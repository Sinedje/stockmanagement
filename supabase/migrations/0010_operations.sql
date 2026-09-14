-- ===========================================================================
--  0010 — Opérations composées, en une seule transaction
--
--  Une vente touche quatre tables : l'en-tête, ses lignes, ses règlements, et
--  le stock de chaque article. Enchaînée depuis le navigateur, la séquence
--  n'est pas atomique : une coupure réseau — banale sur un réseau mobile à
--  Yaoundé — laisse une vente sans lignes, ou un stock décrémenté pour une
--  vente qui n'existe pas. Aucun écran ne rattrape cela ensuite.
--
--  Ces fonctions s'exécutent côté PostgreSQL : tout passe, ou rien.
--
--  Elles sont volontairement en `security invoker` : la RLS continue donc de
--  s'appliquer ligne par ligne, et un caissier ne peut rien écrire dans une
--  autre entreprise que la sienne, même en appelant directement l'API.
-- ===========================================================================

/* ── Vente ────────────────────────────────────────────────────────────────── */

create or replace function public.create_sale(p_sale jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_company uuid;
  v_sale_id uuid;
  v_item    jsonb;
begin
  select company_id into v_company from public.profiles where id = auth.uid();
  if v_company is null then
    raise exception 'Aucune entreprise associée à ce compte';
  end if;

  insert into public.sales (
    company_id, store_id, customer_id, invoice_number, date, total, items_total,
    payment_method, cashier, customer_name, customer_phone, amount_paid,
    amount_due, payment_status, delivery_status, status, type, original_invoice_number
  )
  values (
    v_company,
    (p_sale->>'store_id')::uuid,
    nullif(p_sale->>'customer_id', '')::uuid,
    coalesce(p_sale->>'invoice_number', ''),
    coalesce((p_sale->>'date')::timestamptz, now()),
    coalesce((p_sale->>'total')::numeric, 0),
    coalesce((p_sale->>'items_total')::numeric, 0),
    coalesce(p_sale->>'payment_method', 'cash'),
    coalesce(p_sale->>'cashier', ''),
    coalesce(p_sale->>'customer_name', ''),
    coalesce(p_sale->>'customer_phone', ''),
    coalesce((p_sale->>'amount_paid')::numeric, 0),
    coalesce((p_sale->>'amount_due')::numeric, 0),
    coalesce(p_sale->>'payment_status', 'paid'),
    coalesce(p_sale->>'delivery_status', 'pending'),
    coalesce(p_sale->>'status', 'completed'),
    coalesce(p_sale->>'type', 'sale'),
    p_sale->>'original_invoice_number'
  )
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_sale->'items', '[]'::jsonb))
  loop
    insert into public.sale_items (sale_id, product_id, store_id, name, price, quantity)
    values (
      v_sale_id,
      nullif(v_item->>'product_id', '')::uuid,
      (v_item->>'store_id')::uuid,
      coalesce(v_item->>'name', ''),
      coalesce((v_item->>'price')::numeric, 0),
      coalesce((v_item->>'quantity')::integer, 0)
    );

    -- Le stock suit la vente dans la même transaction. Les articles hors
    -- inventaire (service, consigne) n'ont pas de quantité à décrémenter.
    if nullif(v_item->>'product_id', '') is not null then
      update public.products
         set stock = stock - coalesce((v_item->>'quantity')::integer, 0),
             updated_at = now()
       where id = (v_item->>'product_id')::uuid
         and is_non_inventory = false;
    end if;
  end loop;

  for v_item in select * from jsonb_array_elements(coalesce(p_sale->'payments', '[]'::jsonb))
  loop
    insert into public.sale_payments (sale_id, date, amount, method, cashier, reference)
    values (
      v_sale_id,
      coalesce((v_item->>'date')::timestamptz, now()),
      coalesce((v_item->>'amount')::numeric, 0),
      coalesce(v_item->>'method', 'cash'),
      coalesce(v_item->>'cashier', ''),
      coalesce(v_item->>'reference', '')
    );
  end loop;

  return v_sale_id;
end;
$$;

comment on function public.create_sale(jsonb) is
  'Vente, lignes, règlements et décrément du stock en une transaction.';

/* ── Annulation d'une vente ───────────────────────────────────────────────── */

create or replace function public.cancel_sale(p_sale_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status from public.sales where id = p_sale_id;
  if v_status is null then raise exception 'Vente introuvable'; end if;
  -- Annuler deux fois rendrait le stock une seconde fois.
  if v_status = 'cancelled' then return; end if;

  update public.products p
     set stock = p.stock + si.quantity,
         updated_at = now()
    from public.sale_items si
   where si.sale_id = p_sale_id
     and p.id = si.product_id
     and p.is_non_inventory = false;

  update public.sales set status = 'cancelled', updated_at = now() where id = p_sale_id;
end;
$$;

comment on function public.cancel_sale(uuid) is
  'Annule une vente et restitue le stock. Sans effet si elle l''est déjà.';

/* ── Règlement d'une facture ──────────────────────────────────────────────── */

create or replace function public.record_payment(
  p_sale_id uuid, p_amount numeric, p_method text, p_cashier text, p_reference text default ''
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_total numeric;
  v_paid  numeric;
begin
  if p_amount <= 0 then raise exception 'Le montant doit être positif'; end if;

  insert into public.sale_payments (sale_id, amount, method, cashier, reference)
  values (p_sale_id, p_amount, p_method, coalesce(p_cashier, ''), coalesce(p_reference, ''));

  -- Les montants de l'en-tête sont recalculés depuis les règlements plutôt
  -- qu'incrémentés : deux encaissements simultanés ne peuvent pas s'écraser.
  select s.total, coalesce(sum(sp.amount), 0)
    into v_total, v_paid
    from public.sales s
    left join public.sale_payments sp on sp.sale_id = s.id
   where s.id = p_sale_id
   group by s.total;

  update public.sales
     set amount_paid = v_paid,
         amount_due = greatest(v_total - v_paid, 0),
         payment_status = case
           when v_paid >= v_total then 'paid'
           when v_paid > 0 then 'partial'
           else 'unpaid' end,
         updated_at = now()
   where id = p_sale_id;
end;
$$;

comment on function public.record_payment(uuid, numeric, text, text, text) is
  'Ajoute un règlement et recalcule les montants depuis la somme des règlements.';

/* ── Entrée de stock ──────────────────────────────────────────────────────── */

create or replace function public.create_stock_entry(p_entry jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_company uuid;
  v_entry_id uuid;
  v_item jsonb;
begin
  select company_id into v_company from public.profiles where id = auth.uid();
  if v_company is null then raise exception 'Aucune entreprise associée à ce compte'; end if;

  insert into public.stock_entries (company_id, store_id, supplier, note_number, date)
  values (
    v_company,
    (p_entry->>'store_id')::uuid,
    coalesce(p_entry->>'supplier', ''),
    coalesce(p_entry->>'note_number', ''),
    coalesce((p_entry->>'date')::timestamptz, now())
  )
  returning id into v_entry_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_entry->'items', '[]'::jsonb))
  loop
    insert into public.stock_entry_items (stock_entry_id, product_id, name, quantity, cost)
    values (
      v_entry_id,
      nullif(v_item->>'product_id', '')::uuid,
      coalesce(v_item->>'name', ''),
      coalesce((v_item->>'quantity')::integer, 0),
      coalesce((v_item->>'cost')::numeric, 0)
    );

    if nullif(v_item->>'product_id', '') is not null then
      update public.products
         set stock = stock + coalesce((v_item->>'quantity')::integer, 0),
             -- Le dernier coût d'achat fait foi pour la marge.
             cost = coalesce(nullif((v_item->>'cost')::numeric, 0), cost),
             updated_at = now()
       where id = (v_item->>'product_id')::uuid;
    end if;
  end loop;

  return v_entry_id;
end;
$$;

comment on function public.create_stock_entry(jsonb) is
  'Entrée de stock, ses lignes et l''incrément des quantités en une transaction.';

/* ── Transfert entre magasins ─────────────────────────────────────────────── */

create or replace function public.create_transfer(p_transfer jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_company uuid;
  v_id uuid;
  v_item jsonb;
  v_from uuid;
begin
  select company_id into v_company from public.profiles where id = auth.uid();
  if v_company is null then raise exception 'Aucune entreprise associée à ce compte'; end if;
  v_from := (p_transfer->>'from_store_id')::uuid;

  insert into public.transfers (company_id, reference, from_store_id, to_store_id,
                                status, initiated_by, notes, date)
  values (
    v_company,
    coalesce(p_transfer->>'reference', ''),
    v_from,
    (p_transfer->>'to_store_id')::uuid,
    'in_transit',
    coalesce(p_transfer->>'initiated_by', ''),
    coalesce(p_transfer->>'notes', ''),
    coalesce((p_transfer->>'date')::timestamptz, now())
  )
  returning id into v_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_transfer->'items', '[]'::jsonb))
  loop
    insert into public.transfer_items (transfer_id, product_id, name, quantity)
    values (v_id, nullif(v_item->>'product_id', '')::uuid,
            coalesce(v_item->>'name', ''), coalesce((v_item->>'quantity')::integer, 0));

    -- Le stock quitte le magasin d'origine dès l'envoi ; il n'arrivera dans le
    -- magasin de destination qu'à la réception. Entre les deux, il est en route.
    if nullif(v_item->>'product_id', '') is not null then
      update public.products
         set stock = stock - coalesce((v_item->>'quantity')::integer, 0), updated_at = now()
       where id = (v_item->>'product_id')::uuid and store_id = v_from;
    end if;
  end loop;

  return v_id;
end;
$$;

comment on function public.create_transfer(jsonb) is
  'Transfert et sortie du stock d''origine en une transaction. Le stock arrive à la réception.';

create or replace function public.receive_transfer(p_transfer_id uuid, p_received_by text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_to uuid;
  v_status text;
  v_item record;
  v_target uuid;
begin
  select to_store_id, status into v_to, v_status
    from public.transfers where id = p_transfer_id;
  if v_to is null then raise exception 'Transfert introuvable'; end if;
  -- Réceptionner deux fois créerait du stock à partir de rien.
  if v_status = 'completed' then return; end if;

  for v_item in
    select ti.product_id, ti.name, ti.quantity
      from public.transfer_items ti where ti.transfer_id = p_transfer_id
  loop
    -- L'article existe-t-il déjà dans le magasin d'arrivée ? Le catalogue est
    -- par magasin : sinon la ligne y est créée à partir de celle d'origine.
    select id into v_target from public.products
     where store_id = v_to and name = v_item.name limit 1;

    if v_target is null and v_item.product_id is not null then
      insert into public.products (company_id, store_id, name, designation, category,
                                   price, cost, stock, min_stock, supplier, is_non_inventory)
      select company_id, v_to, name, designation, category,
             price, cost, v_item.quantity, min_stock, supplier, is_non_inventory
        from public.products where id = v_item.product_id
      returning id into v_target;
    elsif v_target is not null then
      update public.products
         set stock = stock + v_item.quantity, updated_at = now()
       where id = v_target;
    end if;
  end loop;

  update public.transfers
     set status = 'completed', received_by = coalesce(p_received_by, ''), received_date = now()
   where id = p_transfer_id;
end;
$$;

comment on function public.receive_transfer(uuid, text) is
  'Réceptionne un transfert : entrée en stock à destination. Sans effet s''il l''est déjà.';
