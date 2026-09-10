/**
 * Migration MongoDB → Supabase.
 *
 *   node scripts/migrate-to-supabase.mjs            # simulation (par défaut)
 *   node scripts/migrate-to-supabase.mjs --apply    # écriture réelle
 *   node scripts/migrate-to-supabase.mjs --apply --with-images
 *
 * MongoDB n'est ouvert qu'en LECTURE : aucune écriture, aucune suppression.
 * La base actuelle reste donc intacte et constitue le retour arrière.
 *
 * Le script est réexécutable : chaque objet est retrouvé par un identifiant
 * naturel (nom de magasin, couple magasin+nom pour un produit) et mis à jour
 * plutôt que dupliqué.
 */
import mongoose from '../server/node_modules/mongoose/index.js';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import ws from 'ws';

/* ── Configuration ───────────────────────────────────────────────────────── */

const readEnv = (file) => {
  try {
    return Object.fromEntries(
      readFileSync(file, 'utf8').split('\n')
        .filter(l => l.trim() && !l.trim().startsWith('#') && l.includes('='))
        .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
    );
  } catch { return {}; }
};

const env = { ...readEnv('server/.env'), ...readEnv('.env.local'), ...readEnv('server/.env.local'), ...process.env };

const APPLY = process.argv.includes('--apply');
const WITH_IMAGES = process.argv.includes('--with-images');

const MONGO_URI = env.MONGODB_URI;
const SB_URL = env.VITE_SUPABASE_URL;
const SB_SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const SB_PUBLIC = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

// La clé service_role contourne la RLS : indispensable pour écrire au nom de
// l'entreprise migrée et pour créer les comptes de connexion. Elle ne doit
// vivre que dans un fichier local ignoré par git, jamais dans le navigateur.
const SB_KEY = SB_SERVICE || SB_PUBLIC;

const log = (...a) => console.log(...a);
const step = (t) => log(`\n── ${t} ${'─'.repeat(Math.max(0, 60 - t.length))}`);

/* ── Lecture MongoDB (lecture seule) ─────────────────────────────────────── */

const loose = new mongoose.Schema({}, { strict: false, versionKey: false });
const model = (name, collection) => mongoose.model(name, loose, collection);

async function readMongo() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  const Store = model('MStore', 'stores');
  const Product = model('MProduct', 'products');
  const User = model('MUser', 'users');
  const Settings = model('MSettings', 'companysettings');

  const [stores, products, users, settings] = await Promise.all([
    Store.find({}).lean(), Product.find({}).lean(),
    User.find({}).lean(), Settings.findOne({}).lean(),
  ]);
  await mongoose.disconnect();
  return { stores, products, users, settings };
}

/* ── Écriture Supabase ───────────────────────────────────────────────────── */

async function migrate() {
  if (!MONGO_URI) throw new Error('MONGODB_URI introuvable (server/.env).');
  if (!SB_URL || !SB_KEY) throw new Error('Configuration Supabase incomplète (.env.local).');

  log(APPLY ? '⚠  MODE ÉCRITURE' : '○  SIMULATION — aucune écriture');
  log(`   Supabase : ${SB_SERVICE ? 'clé service_role' : 'clé publique (RLS active)'}`);

  step('Lecture de MongoDB (lecture seule)');
  const src = await readMongo();
  log(`   magasins ${src.stores.length} · produits ${src.products.length} · utilisateurs ${src.users.length}`);
  log(`   entreprise : ${src.settings?.name || '(aucun réglage)'}`);

  // Node 20 n'a pas de WebSocket natif et supabase-js instancie Realtime au
  // démarrage. La migration n'en a aucun usage : on fournit une implémentation
  // pour que la construction du client aboutisse.
  const sb = createClient(SB_URL, SB_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws },
  });

  /* Entreprise */
  step('Entreprise');
  const slug = (src.settings?.name || 'entreprise').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

  const companyRow = {
    name: src.settings?.name || 'Entreprise',
    slug,
    activity: src.settings?.activity || '',
    phones: src.settings?.phones || '',
    ncc: src.settings?.ncc || '',
    rccm: src.settings?.rccm || '',
    language: src.settings?.language || 'fr',
  };
  log(`   ${companyRow.name}  (slug: ${slug})`);

  let companyId = null;
  if (APPLY) {
    const { data: existing } = await sb.from('companies').select('id').eq('slug', slug).maybeSingle();
    if (existing) {
      companyId = existing.id;
      await sb.from('companies').update(companyRow).eq('id', companyId);
      log('   → déjà présente, mise à jour');
    } else {
      const { data, error } = await sb.from('companies').insert(companyRow).select('id').single();
      if (error) throw new Error(`entreprise : ${error.message}`);
      companyId = data.id;
      log('   → créée');
    }
  }

  /* Magasins — retrouvés par (entreprise, nom) */
  step('Magasins');
  const storeMap = new Map();               // ObjectId Mongo → uuid Supabase
  for (const s of src.stores) {
    log(`   ${s.name}${s.location ? ` — ${s.location}` : ''}`);
    if (!APPLY) continue;
    const row = { company_id: companyId, name: s.name, location: s.location || '' };
    const { data: found } = await sb.from('stores')
      .select('id').eq('company_id', companyId).eq('name', s.name).maybeSingle();
    if (found) {
      await sb.from('stores').update(row).eq('id', found.id);
      storeMap.set(String(s._id), found.id);
    } else {
      const { data, error } = await sb.from('stores').insert(row).select('id').single();
      if (error) throw new Error(`magasin ${s.name} : ${error.message}`);
      storeMap.set(String(s._id), data.id);
    }
  }

  /* Catégories, déduites des produits */
  step('Catégories');
  const categories = [...new Set(src.products.map(p => p.category).filter(Boolean))];
  log(`   ${categories.length} catégories`);
  if (APPLY && categories.length) {
    await sb.from('categories')
      .upsert(categories.map(name => ({ company_id: companyId, name })),
              { onConflict: 'company_id,name', ignoreDuplicates: true });
  }

  /* Produits — par lots, pour ne pas envoyer 368 requêtes */
  step('Produits');
  const withImage = src.products.filter(p => (p.image || '').startsWith('data:')).length;
  log(`   ${src.products.length} produits · ${withImage} avec image en base64`);
  if (!WITH_IMAGES) log('   images ignorées (utiliser --with-images)');

  if (APPLY) {
    const rows = src.products
      .filter(p => storeMap.has(String(p.storeId)))
      .map(p => ({
        company_id: companyId,
        store_id: storeMap.get(String(p.storeId)),
        name: p.name,
        designation: p.designation || '',
        category: p.category || '',
        price: p.price ?? 0,
        cost: p.cost ?? 0,
        stock: p.stock ?? 0,
        physical_stock: p.physicalStock ?? 0,
        min_stock: p.minStock ?? 0,
        supplier: p.supplier || '',
        delivery_note: p.deliveryNote || '',
        is_non_inventory: Boolean(p.isNonInventory),
      }));

    const orphans = src.products.length - rows.length;
    if (orphans) log(`   ⚠ ${orphans} produits rattachés à un magasin inconnu — ignorés`);

    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await sb.from('products')
        .upsert(chunk, { onConflict: 'store_id,name' });
      if (error) throw new Error(`produits [${i}] : ${error.message}`);
      log(`   ${Math.min(i + 100, rows.length)} / ${rows.length}`);
    }
  }

  /* Utilisateurs */
  /* Images — de la base64 vers Supabase Storage */
  if (WITH_IMAGES) {
    step('Images');
    const withImg = src.products.filter(p => (p.image || '').startsWith('data:'));
    log(`   ${withImg.length} images à transférer`);

    if (APPLY) {
      if (!SB_SERVICE) throw new Error('Le transfert des images exige SUPABASE_SERVICE_ROLE_KEY.');

      // Seau public : les fiches produit affichent l'image directement, sans
      // signature à renouveler. Rien de confidentiel dans un visuel de produit.
      const BUCKET = 'product-images';
      const { data: buckets } = await sb.storage.listBuckets();
      if (!buckets?.some(b => b.name === BUCKET)) {
        const { error } = await sb.storage.createBucket(BUCKET, {
          public: true, fileSizeLimit: 5 * 1024 * 1024,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
        });
        if (error) throw new Error(`seau : ${error.message}`);
        log(`   seau « ${BUCKET} » créé`);
      }

      let done = 0, failed = 0;
      for (const p of withImg) {
        const storeId = storeMap.get(String(p.storeId));
        if (!storeId) { failed++; continue; }

        // data:image/png;base64,AAAA…
        const match = /^data:([^;]+);base64,(.*)$/s.exec(p.image);
        if (!match) { failed++; continue; }
        const [, mime, b64] = match;
        const ext = (mime.split('/')[1] || 'png').replace('jpeg', 'jpg');

        // Chemin préfixé par l'entreprise : le cloisonnement se lit dans
        // l'arborescence, et une règle de seau peut s'y appuyer plus tard.
        const safe = String(p.name).replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 60);
        const path = `${companyId}/${safe}-${String(p._id).slice(-6)}.${ext}`;

        const { error: upErr } = await sb.storage.from(BUCKET)
          .upload(path, Buffer.from(b64, 'base64'), { contentType: mime, upsert: true });
        if (upErr) { log(`   ⚠ ${p.name} : ${upErr.message}`); failed++; continue; }

        const { error: updErr } = await sb.from('products')
          .update({ image_path: path }).eq('store_id', storeId).eq('name', p.name);
        if (updErr) { failed++; continue; }

        done++;
        if (done % 20 === 0) log(`   ${done} / ${withImg.length}`);
      }
      log(`   ${done} transférées${failed ? `, ${failed} en échec` : ''}`);
    }
  }

  step('Utilisateurs');
  log(`   ${src.users.length} comptes dans MongoDB`);
  if (!SB_SERVICE) {
    log('   ⚠ Sans SUPABASE_SERVICE_ROLE_KEY, les comptes de connexion ne peuvent');
    log('     pas être créés : profiles.id référence auth.users.');
    log('     Les utilisateurs sont listés ci-dessous pour information.');
    for (const u of src.users) log(`     · ${u.name} (${u.username}) — ${u.role}`);
  } else if (APPLY) {
    for (const u of src.users) {
      const email = u.email || `${u.username}@${slug}.local`;
      const { data: created, error: authError } =
        await sb.auth.admin.createUser({ email, email_confirm: true,
                                         password: crypto.randomUUID().slice(0, 12) + 'Aa1!',
                                         user_metadata: { name: u.name } });
      if (authError) { log(`   ⚠ ${u.username} : ${authError.message}`); continue; }
      const { error } = await sb.from('profiles').insert({
        id: created.user.id, company_id: companyId,
        name: u.name, username: u.username, role: u.role,
        store_id: storeMap.get(String(u.storeId)) || null,
        is_active: u.isActive !== false,
      });
      if (error) log(`   ⚠ profil ${u.username} : ${error.message}`);
      else log(`   · ${u.username} → ${email}`);
    }
  } else {
    for (const u of src.users) log(`   · ${u.name} (${u.username}) — ${u.role}`);
  }

  step('Terminé');
  log(APPLY
    ? '   Écriture effectuée. MongoDB est resté intact.'
    : '   Simulation uniquement. Relancer avec --apply pour écrire.');
}

migrate().catch(err => { console.error('\n✗', err.message); process.exit(1); });
