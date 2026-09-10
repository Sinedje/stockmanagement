import { useT } from '../../i18n/I18nContext';
import React, { useState, useMemo } from 'react';
import { formatPrice } from '../../context/StoreContext';
import Modal from '../common/Modal';
import { CheckCircleOutlined, CreditCardOutlined, DeleteOutlined, FileTextOutlined, MoneyCollectOutlined, PhoneOutlined, PrinterOutlined, SearchOutlined, ShopOutlined, UserOutlined, WalletOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Tag, message as antMessage } from 'antd';
import ReceiptView from './ReceiptView';

/* ── Editable price cell with local state ── */
const PriceInput = ({ value, minPrice, onChange, isFlexiblePrice }) => {
  const t = useT();
  const [raw, setRaw] = useState(String(value));
  const belowMin = !isFlexiblePrice && parseFloat(raw) < minPrice;

  return (
    <div className="flex flex-col items-end gap-0.5">
      <input
        type="number"
        min={isFlexiblePrice ? 0 : minPrice}
        className={`w-28 text-right bg-white dark:bg-black/20 border rounded-lg px-2 py-1 font-black focus:outline-none transition-colors
          ${belowMin ? 'border-red-500/60 text-red-500 dark:text-red-400 focus:border-red-500' : 'border-black/15 dark:border-white/10 text-primary focus:border-primary/50'}`}
        value={raw}
        onChange={e => setRaw(e.target.value)}
        onBlur={() => {
          const num = parseFloat(raw);
          const clamped = isNaN(num) || (!isFlexiblePrice && num < minPrice) ? minPrice : num;
          setRaw(String(clamped));
          onChange(clamped);
        }}
      />
      {belowMin && (
        <span className="text-[0.55rem] text-red-400 flex items-center gap-1">
          <WarningOutlined style={{ fontSize: 8 }} /> min {formatPrice(minPrice)}
        </span>
      )}
      {!belowMin && !isFlexiblePrice && (
        <span className="text-[0.55rem] text-text-muted opacity-40">min {formatPrice(minPrice)}</span>
      )}
      {isFlexiblePrice && (
        <span className="text-[0.55rem] text-primary opacity-60">{t('s.prix_libre')}</span>
      )}
    </div>
  );
};

/* ── Payment Modal (with optional account balance) ── */
const PaymentModal = ({ total, invoiceNumber, onPay, onClose, customerBalance = 0 }) => {
  const t = useT();
  const [useAccount, setUseAccount] = useState(false);
  const [isPartial, setIsPartial] = useState(false);
  const [initialPayment, setInitialPayment] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('Espèces');
  const [immediateDelivery, setImmediateDelivery] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canUseAccount = customerBalance > 0;
  const accountUsed = useAccount ? Math.min(customerBalance, total) : 0;
  const remainingAfterAccount = total - accountUsed;

  const cashToPay = isPartial && initialPayment !== '' ? parseFloat(initialPayment) || 0 : remainingAfterAccount;
  const debt = remainingAfterAccount - cashToPay;

  const handlePayMethod = (method) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const paymentAmount = isPartial && initialPayment !== '' ? cashToPay : null;
    const isCredit = debt > 0;
    const grantDelivery = isCredit ? immediateDelivery : false;
    
    if (useAccount && remainingAfterAccount <= 0) {
      onPay(null, accountUsed, null, false);
    } else if (useAccount) {
      onPay(method || 'Espèces', accountUsed, paymentAmount, grantDelivery);
    } else {
      onPay(method, 0, paymentAmount, grantDelivery);
    }
  };

  return (
    <Modal
      title={t('s.encaisser')}
      onClose={onClose}
      onOk={isSubmitting ? undefined : () => handlePayMethod(selectedMethod)}
    >
      <div className="mb-6">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
          <span className="text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-1 block">{t('s.montant_a_payer')}</span>
          <span className="text-4xl font-black text-primary tracking-tighter">{formatPrice(total)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-5 px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl">
        <FileTextOutlined style={{ fontSize: 14 }} className="text-primary opacity-70" />
        <span className="text-[0.75rem] text-text-secondary font-semibold">{t('s.facture_n')}</span>
        <span className="text-[1rem] font-black text-primary tracking-widest">{invoiceNumber}</span>
      </div>

      {/* Customer Balance Option */}
      {canUseAccount && (
        <div
          className={`mb-5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
            useAccount
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-emerald-400/50'
          }`}
          onClick={() => setUseAccount(v => !v)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                useAccount ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-500'
              }`}>
                <WalletOutlined style={{ fontSize: 18 }} />
              </div>
              <div>
                <div className="text-sm font-semibold text-text-heading">{t('s.utiliser_le_solde_client')}</div>
                <div className="text-xs text-emerald-600 font-bold">
                  {formatPrice(customerBalance)} disponible
                </div>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              useAccount ? 'border-emerald-500 bg-emerald-500' : 'border-black/20 dark:border-white/20'
            }`}>
              {useAccount && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
            </div>
          </div>

          {useAccount && (
            <div className="mt-3 pt-3 border-t border-emerald-500/20 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">{t('s.total_facture_2')}</span>
                <span className="font-bold text-text-heading">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-600">{t('s.debit_compte')}</span>
                <span className="font-bold text-emerald-600">- {formatPrice(accountUsed)}</span>
              </div>
              <div className="flex justify-between font-black">
                <span className="text-text-heading">{t('s.reste_a_encaisser')}</span>
                <span className={remainingAfterAccount > 0 ? 'text-primary' : 'text-emerald-500'}>
                  {formatPrice(remainingAfterAccount)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Buttons */}
      {(!useAccount || remainingAfterAccount > 0) ? (
        <div className="space-y-3">
          
          <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4">
            <label className="flex items-center gap-3 cursor-pointer" onClick={() => setIsPartial(!isPartial)}>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${isPartial ? 'bg-primary border-primary text-white' : 'border-black/20 dark:border-white/20'}`}>
                {isPartial && <CheckCircleOutlined style={{ fontSize: 14 }} />}
              </div>
              <span className="text-sm font-bold text-text-heading">{t('s.paiement_partiel_acompte')}</span>
            </label>
            
            {isPartial && (
              <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 animate-fade-in">
                <label className="text-[0.7rem] font-bold text-text-muted uppercase tracking-widest block mb-2">{t('s.acompte_verse_aujourd_hui')}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    className="w-full bg-white dark:bg-black/30 border border-black/15 dark:border-white/10 rounded-xl px-4 py-3 text-lg font-black text-primary focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder={t('s.montant_en_fcfa')}
                    value={initialPayment}
                    onChange={e => setInitialPayment(e.target.value)}
                  />
                </div>
                {debt > 0 && (
                  <div className="mt-4 space-y-3">
                    <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${immediateDelivery ? 'bg-green-500/10 border-green-500/30' : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10'}`} onClick={() => setImmediateDelivery(!immediateDelivery)}>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${immediateDelivery ? 'bg-green-500 border-green-500 text-black' : 'border-black/30 dark:border-white/30'}`}>
                        {immediateDelivery && <CheckCircleOutlined style={{ fontSize: 14 }} />}
                      </div>
                      <span className={`text-sm font-bold ${immediateDelivery ? 'text-green-500' : 'text-text-secondary'}`}>{t('s.autoriser_la_livraison_immediate_credit')}</span>
                    </label>
                    
                    <div className={`p-3 rounded-xl border ${immediateDelivery ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                      <div className="font-bold text-sm">Reste à solder : {formatPrice(debt)}</div>
                      <div className="text-[0.75rem] leading-tight mt-1 opacity-80">
                        {immediateDelivery 
                          ? "✓ Les marchandises seront libérées au magasinier."
                          : "⚠ Les marchandises seront retenues jusqu'au paiement complet."}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-[0.9rem] font-bold text-text-heading uppercase tracking-wide text-center pt-2">
            {useAccount && remainingAfterAccount > 0 ? `Reste à payer en...` : 'Mode de paiement'}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <button
              className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all duration-300 group border-2 ${
                selectedMethod === 'Espèces'
                  ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-text-secondary hover:bg-primary/10 hover:border-primary/20 hover:text-primary'
              }`}
              onClick={() => setSelectedMethod('Espèces')}
            >
              <MoneyCollectOutlined style={{ fontSize: 32 }} className={`transition-transform ${selectedMethod === 'Espèces' ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="font-bold uppercase tracking-widest text-[0.8rem]">{t('s.especes')}</span>
            </button>
            <button
              className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all duration-300 group border-2 ${
                selectedMethod === 'Carte'
                  ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-text-secondary hover:bg-primary/10 hover:border-primary/20 hover:text-primary'
              }`}
              onClick={() => setSelectedMethod('Carte')}
            >
              <CreditCardOutlined style={{ fontSize: 32 }} className={`transition-transform ${selectedMethod === 'Carte' ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="font-bold uppercase tracking-widest text-[0.8rem]">{t('s.carte')}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full flex items-center justify-center gap-3 p-5 bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-2xl font-black text-lg">
          <CheckCircleOutlined style={{ fontSize: 24 }} />
          {t('s.le_compte_couvre_l_integralite_validez_via_o')}
        </div>
      )}
    </Modal>
  );
};

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
import { useUsers, useStores, useSales, useCustomers } from '../../hooks';

const InvoiceBuilder = () => {
  const t = useT();
  const { allCashierProducts } = useUsers();
  const { stores } = useStores();
  const { nextInvoiceNumber, completeInvoiceSale } = useSales();
  const { customers } = useCustomers();

  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [lines, setLines] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStore, setFilterStore] = useState('Tous');
  const [showPayment, setShowPayment] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [discount, setDiscount] = useState(0);

  // Look up customer account balance by name+phone
  const matchedCustomer = useMemo(() => {
    if (!customer.name.trim()) return null;
    return customers.find(c =>
      c.name.toLowerCase() === customer.name.toLowerCase() &&
      (!customer.phone || c.phone === customer.phone)
    ) || customers.find(c => c.name.toLowerCase() === customer.name.toLowerCase()) || null;
  }, [customers, customer.name, customer.phone]);

  const itemsTotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const total = itemsTotal - discount;

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    return allCashierProducts
      .filter(p => {
        const matchSearch = 
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.designation && p.designation.toLowerCase().includes(search.toLowerCase()));
        const matchStore = filterStore === 'Tous' || String(p.storeId) === String(filterStore);
        // Show all products with any stock (>= 0) or non-inventory items — 
        // avoids hiding items when local cache hasn't synced yet with server.
        const hasStock = p.isNonInventory || (p.stock ?? 0) >= 0;
        return matchSearch && matchStore && hasStock;
      })
      .slice(0, 8);
  }, [search, filterStore, allCashierProducts]);

  const addProduct = (product) => {
    setLines(prev => {
      const existing = prev.find(l => l.productId === product.id);
      if (existing) {
        return prev.map(l =>
          l.productId === product.id
            ? { ...l, quantity: Math.min(l.stock, l.quantity + 1) }
            : l
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        cost: product.cost,
        price: product.price,
        quantity: 1,
        storeId: product.storeId,
        storeName: product.storeName,
        stock: product.stock,
        isNonInventory: product.isNonInventory,
        isBreakage: product.isBreakage,
        isRepackaged: product.isRepackaged
      }];
    });
    setSearch('');
  };

  const updateQty = (productId, qty) => {
    const line = lines.find(l => l.productId === productId);
    const maxQty = line?.isNonInventory ? 99999 : (line?.stock || 999);
    const val = Math.max(1, Math.min(maxQty, parseInt(qty) || 1));
    setLines(prev => prev.map(l => l.productId === productId ? { ...l, quantity: val } : l));
  };

  const updatePrice = (productId, price) => {
    setLines(prev => prev.map(l => l.productId === productId ? { ...l, price } : l));
  };

  const removeLine = (productId) => setLines(prev => prev.filter(l => l.productId !== productId));

  const handlePay = async (method, accountPayment = 0, initialPayment = null, immediateDelivery = false) => {
    const customerInfo = matchedCustomer
      ? { id: matchedCustomer.id, name: matchedCustomer.name, phone: matchedCustomer.phone }
      : customer;
    try {
      const sale = await completeInvoiceSale(method, lines, customerInfo, discount, accountPayment, initialPayment, immediateDelivery);
      if (sale) {
        setCompletedSale(sale);
        setShowPayment(false);
        setLines([]);
        setCustomer({ name: '', phone: '' });
        setDiscount(0);
      }
    } catch (err) {
      console.error('Erreur lors de l\'encaissement:', err);
      antMessage.error('Erreur lors de l\'encaissement. Veuillez réessayer.');
    }
  };

  if (completedSale) return <ReceiptView sale={completedSale} onClose={() => setCompletedSale(null)} />;

  return (
    <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar" style={{ height: 'calc(100vh - 220px)' }}>
      {/* Invoice header */}
      <div className="flex flex-wrap items-center justify-between gap-2 glass-panel rounded-2xl px-4 sm:px-5 py-3">
        <div className="flex items-center gap-2">
          <FileTextOutlined style={{ fontSize: 15 }} className="text-primary" />
          <span className="text-[0.7rem] font-semibold text-text-muted uppercase tracking-widest">{t('s.facture')}</span>
          <span className="text-primary font-black text-[1.1rem] ml-1">{nextInvoiceNumber}</span>
        </div>
        <span className="text-[0.72rem] text-text-muted opacity-50">
          {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Customer info */}
      <div className="glass-panel rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'name', label: t('s.nom_du_client'), icon: UserOutlined, placeholder: 'Jean Dupont...' },
            { key: 'phone', label: t('s.telephone'), icon: PhoneOutlined, placeholder: '+225 07 00 00 00...' },
          ].map(({ key, label, icon: Icon, placeholder }) => (
            <div key={key}>
              <label className="text-[0.62rem] font-semibold text-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Icon size={10} /> {label}
              </label>
              <input
                className="w-full bg-white dark:bg-black/20 border border-black/15 dark:border-white/10 rounded-xl px-4 py-2.5 text-[0.88rem] text-text-heading placeholder-text-muted/40 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder={placeholder}
                value={customer[key]}
                onChange={e => setCustomer(p => ({ ...p, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        {/* Show matched customer balance */}
        {matchedCustomer && matchedCustomer.balance > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <WalletOutlined style={{ fontSize: 14 }} className="text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600">
              Solde disponible: {formatPrice(matchedCustomer.balance)}
            </span>
            <span className="text-xs text-emerald-500 ml-auto">{t('s.utilisable_a_l_encaissement')}</span>
          </div>
        )}
      </div>

      {/* Product search */}
      <div className="relative">
        <div className="flex flex-col sm:flex-row gap-2">
          {stores.length > 1 && (
            <select
              className="w-full sm:w-auto sm:max-w-[160px] shrink-0 bg-white dark:bg-black/30 border border-black/15 dark:border-white/10 rounded-xl px-3 py-2.5 text-[0.8rem] text-text-secondary focus:outline-none focus:border-primary/40 cursor-pointer"
              value={filterStore === 'Tous' ? 'Tous' : String(filterStore)}
              onChange={e => setFilterStore(e.target.value === 'Tous' ? 'Tous' : e.target.value)}
            >
              <option value="Tous">{t('s.tous_les_magasins')}</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <div className="flex-1 relative">
            <SearchOutlined style={{ fontSize: 15 }} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-50 pointer-events-none" />
            <input
              className="w-full bg-white dark:bg-black/20 border border-black/15 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-[0.88rem] text-text-heading placeholder-text-muted/40 focus:outline-none focus:border-primary/50 transition-colors"
              placeholder={t('s.rechercher_un_article_a_ajouter_2')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Dropdown results */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 glass-panel-strong rounded-xl z-50 overflow-hidden">
            {searchResults.map(p => (
              <button
                key={p.id}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/10 transition-colors border-b border-white/5 last:border-0"
                onClick={() => addProduct(p)}
              >
                <div className="flex-1 text-left">
                  <div className="text-[0.85rem] font-semibold text-text-heading">{p.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[0.62rem] text-primary opacity-60 font-bold">{p.category}</span>
                    {p.storeName && <span className="text-[0.6rem] text-text-muted opacity-50">• {p.storeName}</span>}
                  </div>
                </div>
                
                {/* Available Stock Display in the middle */}
                <div className="flex-1 text-center hidden md:block">
                  <div className="inline-flex flex-col items-center px-4 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <span className="text-[0.55rem] font-semibold text-text-muted uppercase tracking-widest leading-none mb-1">
                      {p.isNonInventory ? 'Disponibilité' : 'Disponible'}
                    </span>
                    {p.isNonInventory ? (
                      <span className="text-[0.8rem] font-semibold leading-none text-emerald-500">{t('s.hors_stock')}</span>
                    ) : (
                      <span className={`text-[0.9rem] font-black leading-none ${p.stock <= 5 ? 'text-red-500' : 'text-primary'}`}>
                        {p.stock}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right ml-4 shrink-0">
                  <div className="text-primary font-black text-[1rem] tracking-tight">{formatPrice(p.price)}</div>
                  <div className="md:hidden text-[0.6rem] text-text-muted opacity-50">
                    {p.isNonInventory ? 'Hors-stock' : `Stock: ${p.stock}`}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Line items table */}
      {lines.length > 0 ? (
        <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[560px] text-[0.8rem]">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-black/20">
                {['Article', 'Qté', 'Prix unit.', 'Total', ''].map((h, i) => (
                  <th key={i} className={`px-4 py-3 text-text-muted font-semibold uppercase tracking-widest text-[0.58rem] ${i >= 1 ? 'text-center' : 'text-left'} ${i === 3 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map(line => (
                <tr key={line.productId} className="border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-text-heading">{line.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {line.storeName && (
                        <div className="flex items-center gap-1">
                          <ShopOutlined style={{ fontSize: 8 }} className="text-primary opacity-50" />
                          <span className="text-[0.58rem] text-primary opacity-50">{line.storeName}</span>
                        </div>
                      )}
                      <span className="text-[0.58rem] font-bold text-text-muted opacity-40">
                        {line.isNonInventory ? 'Hors-stock' : `Stock: ${line.stock}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <input
                      type="number" min={1} max={line.isNonInventory ? 99999 : line.stock}
                      className="w-16 text-center bg-white dark:bg-black/20 border border-black/15 dark:border-white/10 rounded-lg px-2 py-1 text-text-heading font-bold focus:outline-none focus:border-primary/50"
                      value={line.quantity}
                      onChange={e => updateQty(line.productId, e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <PriceInput
                      value={line.price}
                      minPrice={line.cost}
                      onChange={price => updatePrice(line.productId, price)}
                      isFlexiblePrice={line.isNonInventory || line.isBreakage || line.isRepackaged}
                    />
                  </td>
                  <td className="px-3 py-3 text-right font-black text-text-heading whitespace-nowrap">
                    {formatPrice(line.price * line.quantity)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      className="w-7 h-7 flex items-center justify-center mx-auto text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      onClick={() => removeLine(line.productId)}
                    >
                      <DeleteOutlined style={{ fontSize: 13 }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 opacity-30 gap-3">
          <FileTextOutlined style={{ fontSize: 40 }} className="text-text-muted" />
          <p className="text-text-secondary text-sm font-semibold">{t('s.recherchez_un_article_pour_commencer_la_fact')}</p>
        </div>
      )}

      {/* Checkout Button & Total */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 glass-panel-strong rounded-2xl p-4 sm:p-6 mt-2">
        <div className="flex flex-wrap items-center gap-4 sm:gap-8">
          <div>
            <span className="text-[0.75rem] font-bold text-text-muted uppercase tracking-widest block mb-1">{t('s.total_articles')}</span>
            <span className="text-xl font-black text-text-heading tracking-tight">{formatPrice(itemsTotal)}</span>
          </div>

          <div className="hidden sm:block w-[1px] h-10 bg-black/10 dark:bg-white/10"></div>

          <div className="relative">
            <span className="text-[0.75rem] font-bold text-text-muted uppercase tracking-widest block mb-1">{t('s.remise_accordee')}</span>
            <input
              type="number"
              className="w-28 sm:w-32 bg-black/10 dark:bg-white/10 border border-transparent focus:border-primary/50 rounded-lg px-3 py-1 text-primary font-black focus:outline-none"
              placeholder="0..."
              value={discount || ''}
              onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
            />
          </div>

          <div className="hidden sm:block w-[1px] h-10 bg-black/10 dark:bg-white/10"></div>

          <div>
            <span className="text-[0.75rem] font-bold text-primary uppercase tracking-widest block mb-1">{t('s.net_a_encaisser')}</span>
            <span className="text-2xl sm:text-xl font-bold text-primary tracking-tighter">{formatPrice(total)}</span>
          </div>
        </div>

        <Button type="primary" disabled={lines.length === 0} onClick={() => setShowPayment(true)} className="w-full lg:w-auto shadow-glow" >
          {t('s.encaisser')}
        </Button>
      </div>

      {showPayment && (
        <PaymentModal
          total={total}
          invoiceNumber={nextInvoiceNumber}
          onPay={handlePay}
          onClose={() => setShowPayment(false)}
          customerBalance={matchedCustomer?.balance || 0}
        />
      )}
    </div>
  );
};

export default InvoiceBuilder;
