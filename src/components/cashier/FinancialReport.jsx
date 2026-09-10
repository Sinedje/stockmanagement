import { Button, Select } from '../ui';
import { useT } from '../../i18n/I18nContext';
import React, { useState, useMemo } from 'react';
import { useOnlineStatus } from '../../offline/useOnlineStatus';
import { useOfflineQueue } from '../../offline/useOfflineQueue';
import { formatPrice } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useSales, useCustomers, useSettings, useStores } from '../../hooks';
import Modal from '../common/Modal';
import { BarChartOutlined, CalculatorOutlined, CalendarOutlined, CheckCircleOutlined, CreditCardOutlined, DropboxOutlined, ExclamationCircleOutlined, FileTextOutlined, InboxOutlined, LockOutlined, MinusCircleOutlined, PlusCircleOutlined, PrinterOutlined, RiseOutlined, UpCircleOutlined, WalletOutlined } from '@ant-design/icons';


const FinancialReport = () => {
  const t = useT();

  // Deux conditions distinctes : le serveur doit répondre, et aucune vente ne
  // doit rester en file. Une clôture calculée sur des données partielles reste
  // fausse même après la synchronisation.
  const { online } = useOnlineStatus();
  const { pending } = useOfflineQueue();
  const canClose = online && pending === 0;
  const blockReason = !online
    ? "Clôture indisponible hors connexion : le bilan doit refléter les ventes de tous les postes."
    : pending > 0
      ? `${pending} vente${pending > 1 ? 's' : ''} en attente de transmission. Attendez leur envoi pour clôturer.`
      : '';
  const { currentUser } = useAuth();
  const { 
    sales, expenses, addExpense, 
    initialCashFund, isCashFundInitialized, initializeCashFund, cashInitializationDate,
    versements, addVersement, currentCashBalance,
    lastClosingBalance, closeCashSession
  } = useSales();
  const { customerTransactions, customers } = useCustomers();
  const { companySettings } = useSettings();
  const { stores } = useStores();
  
  const cashierStore = stores?.find(s => s.id === currentUser?.storeId) || { name: 'Magasin Inconnu' };

  const [startInvoice, setStartInvoice] = useState('');
  const [endInvoice, setEndInvoice] = useState('');
  const [reportType, setReportType] = useState('journalier');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showVersementModal, setShowVersementModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ label: '', amount: 0 });
  const [newVersement, setNewVersement] = useState(0);
  const [tempInitialFund, setTempInitialFund] = useState(lastClosingBalance || 0);
  const [showClosureModal, setShowClosureModal] = useState(false);

  // Filtrer uniquement les ventes du caissier connecté
  const mySales = useMemo(() => 
    sales.filter(s => s.cashier === currentUser?.name && s.status !== 'cancelled'),
    [sales, currentUser]
  );

  // Filtrer uniquement les dépenses du caissier connecté
  const myExpenses = useMemo(() => 
    expenses.filter(e => e.cashier === currentUser?.name),
    [expenses, currentUser]
  );

  // Filtrer les versements du caissier
  const myVersements = useMemo(() => 
    versements.filter(v => v.cashier === currentUser?.name),
    [versements, currentUser]
  );

  // Filtrer les dépôts et remboursements clients du caissier
  const myDeposits = useMemo(() =>
    customerTransactions.filter(t => t.cashier === currentUser?.name && t.type === 'deposit'),
    [customerTransactions, currentUser]
  );
  const myRefunds = useMemo(() =>
    customerTransactions.filter(t => t.cashier === currentUser?.name && t.type === 'refund'),
    [customerTransactions, currentUser]
  );

  // Extraire tous les numéros de facture pour les sélecteurs
  const invoiceNumbers = useMemo(() => {
    // Sort sales by date ascending before extracting numbers
    return [...mySales]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(s => s.invoiceNumber)
      .filter(Boolean); // Filter out any empty numbers
  }, [mySales]);

  // Filtrer les ventes selon la plage de factures ou la période
  const filteredSales = useMemo(() => {
    let result = [...mySales].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (startInvoice && endInvoice) {
      const startIndex = invoiceNumbers.indexOf(startInvoice);
      const endIndex = invoiceNumbers.indexOf(endInvoice);
      
      if (startIndex !== -1 && endIndex !== -1) {
        const start = Math.min(startIndex, endIndex);
        const end = Math.max(startIndex, endIndex);
        const allowedNumbers = invoiceNumbers.slice(start, end + 1);
        result = result.filter(s => allowedNumbers.includes(s.invoiceNumber));
      }
    } else {
      const now = new Date();
      const startOfPeriod = new Date();
      switch (reportType) {
        case 'journalier': startOfPeriod.setHours(0,0,0,0); break;
        case 'hebdomadaire': startOfPeriod.setDate(now.getDate() - 7); break;
        case 'mensuel': startOfPeriod.setMonth(now.getMonth() - 1); break;
        default: startOfPeriod.setHours(0,0,0,0); break;
      }
      result = result.filter(s => new Date(s.date) >= startOfPeriod);
    }
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [mySales, startInvoice, endInvoice, reportType, invoiceNumbers]);

  // Filtrer les dépenses selon la période
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const startOfPeriod = new Date();
    const initDate = cashInitializationDate ? new Date(cashInitializationDate) : new Date(0);
    
    if (startInvoice && endInvoice) {
      // Pour une plage de factures, on prend de l'initialisation jusqu'à la dernière facture de la plage
      const lastInvoice = mySales.find(s => s.invoiceNumber === endInvoice);
      const endDate = lastInvoice ? new Date(lastInvoice.date) : now;
      return myExpenses.filter(e => new Date(e.date) >= initDate && new Date(e.date) <= endDate);
    }
    switch (reportType) {
      case 'journalier': startOfPeriod.setHours(0,0,0,0); break;
      case 'hebdomadaire': startOfPeriod.setDate(now.getDate() - 7); break;
      case 'mensuel': startOfPeriod.setMonth(now.getMonth() - 1); break;
      default: startOfPeriod.setHours(0,0,0,0); break;
    }
    const effectiveStart = new Date(Math.max(startOfPeriod, initDate));
    return myExpenses.filter(e => new Date(e.date) >= effectiveStart);
  }, [myExpenses, mySales, startInvoice, endInvoice, reportType, cashInitializationDate]);

  // Filtrer les versements selon la période
  const filteredVersements = useMemo(() => {
    const now = new Date();
    const startOfPeriod = new Date();
    const initDate = cashInitializationDate ? new Date(cashInitializationDate) : new Date(0);
    
    if (startInvoice && endInvoice) {
      const lastInvoice = mySales.find(s => s.invoiceNumber === endInvoice);
      const endDate = lastInvoice ? new Date(lastInvoice.date) : now;
      return myVersements.filter(v => v.date && new Date(v.date) >= initDate && new Date(v.date) <= endDate);
    }
    switch (reportType) {
      case 'journalier': startOfPeriod.setHours(0,0,0,0); break;
      case 'hebdomadaire': startOfPeriod.setDate(now.getDate() - 7); break;
      case 'mensuel': startOfPeriod.setMonth(now.getMonth() - 1); break;
      default: startOfPeriod.setHours(0,0,0,0); break;
    }
    const effectiveStart = new Date(Math.max(startOfPeriod, initDate));
    return myVersements.filter(v => v.date && new Date(v.date) >= effectiveStart);
  }, [myVersements, mySales, startInvoice, endInvoice, reportType, cashInitializationDate]);

  // Statistiques de la période sélectionnée
  const stats = useMemo(() => {
    const grossTotal = filteredSales.reduce((s, v) => s + (v.itemsTotal || v.total), 0);
    const totalDiscounts = filteredSales.reduce((s, v) => s + (v.discount || 0), 0);
    const netRevenue = grossTotal - totalDiscounts;
    
    const cashSales = filteredSales.filter(s => s.paymentMethod === 'Espèces').reduce((s, v) => s + (v.cashPaid || v.total), 0);
    const mixedSales = filteredSales.filter(s => s.paymentMethod === 'Mixte').reduce((s, v) => s + (v.cashPaid || 0), 0);
    const cardSales = filteredSales.filter(s => s.paymentMethod === 'Carte').reduce((s, v) => s + v.total, 0);
    const accountSales = filteredSales.filter(s => s.paymentMethod === 'Compte Client').reduce((s, v) => s + v.total, 0);
    const totalCashIn = cashSales + mixedSales; // physical cash received from sales
    
    const lastInvoiceInSystem = invoiceNumbers[invoiceNumbers.length - 1];
    const isIncludingLatest = !endInvoice || endInvoice === lastInvoiceInSystem;
    
    const endDateForBalance = isIncludingLatest 
      ? new Date()
      : (filteredSales.length > 0 
          ? new Date(Math.max(...filteredSales.map(s => new Date(s.date))))
          : new Date());

    const initDate = cashInitializationDate ? new Date(cashInitializationDate) : new Date(0);

    const periodExpenses = myExpenses.filter(e => new Date(e.date) >= initDate && new Date(e.date) <= endDateForBalance);
    const periodVersements = myVersements.filter(v => v.date && new Date(v.date) >= initDate && new Date(v.date) <= endDateForBalance);
    const periodDeposits = myDeposits.filter(t => t.method === 'Espèces' && new Date(t.date) >= initDate && new Date(t.date) <= endDateForBalance);
    const periodRefunds = myRefunds.filter(t => new Date(t.date) >= initDate && new Date(t.date) <= endDateForBalance);

    const totalPeriodExpenses = periodExpenses.reduce((s, e) => s + e.amount, 0);
    const totalPeriodVersements = periodVersements.reduce((s, v) => s + v.amount, 0);
    const totalPeriodDeposits = periodDeposits.reduce((s, t) => s + t.amount, 0);
    const totalPeriodRefunds = periodRefunds.reduce((s, t) => s + Math.abs(t.amount), 0);
    
    // ─── RECOUVREMENTS depuis customerTransactions (type=invoice_payment) ────────
    // Ces transactions sont créées lors du paiement d'une facture impayée
    const periodInvoicePayments = customerTransactions.filter(t =>
      t.type === 'invoice_payment' &&
      t.cashier === currentUser?.name &&
      new Date(t.date) >= initDate &&
      new Date(t.date) <= endDateForBalance
    );
    const totalInvoicePayments = periodInvoicePayments.reduce((s, t) => s + t.amount, 0);
    
    let standardSales = 0;
    let breakageSales = 0;

    filteredSales.forEach(s => {
      s.items.forEach(item => {
         const itemGross = item.price * item.quantity;
         if (item.isBreakage || item.isRepackaged) breakageSales += itemGross;
         else standardSales += itemGross;
      });
    });

    // ─── DETTES ACCORDÉES ────────────────────────────────────────────────
    // Factures de la période avec un reste à payer (amountDue > 0)
    const debtInvoices = filteredSales.filter(s => (s.amountDue || 0) > 0).map(s => ({
      number: s.invoiceNumber,
      customerName: s.customerName || 'Passager',
      amount: s.total,
      amountDue: s.amountDue,
      amountPaid: s.amountPaid || 0,
      date: s.date,
      paymentStatus: s.paymentStatus
    }));
    const totalDebts = debtInvoices.reduce((sum, d) => sum + d.amountDue, 0);

    // recoveryReceipts = les paiements de factures reçus pendant la session courante
    // On garde aussi la compatibilité avec la logique paymentHistory en fallback
    let recoveryReceipts = periodInvoicePayments.map(t => ({
      id: t.id,
      date: t.date,
      amount: t.amount,
      method: t.method,
      invoiceNumber: t.invoiceNumber || t.reference?.replace('REGLEMENT-', ''),
      invoiceDate: t.invoiceDate,
      customerName: t.customerName || 'Passager',
    }));

    // Fallback: if no invoice_payment transactions (old data), scan paymentHistory
    if (recoveryReceipts.length === 0) {
      const mySalesAll = sales.filter(s => s.cashier === currentUser?.name && s.status !== 'cancelled');
      mySalesAll.forEach(sale => {
        if (!sale.paymentHistory || sale.paymentHistory.length === 0) return;
        sale.paymentHistory.forEach(pmt => {
          const pmtDate = new Date(pmt.date);
          if (pmtDate >= initDate && pmtDate <= endDateForBalance && pmt.cashier === currentUser?.name) {
            const isCurrentPeriodSale = filteredSales.some(fs => fs.id === sale.id);
            if (!isCurrentPeriodSale) {
              recoveryReceipts.push({
                id: pmt.id,
                date: pmt.date,
                amount: pmt.amount,
                method: pmt.method,
                invoiceNumber: sale.invoiceNumber,
                invoiceDate: sale.date,
                customerName: sale.customerName || 'Passager',
              });
            }
          }
        });
      });
    }
    const totalRecoveries = recoveryReceipts.reduce((sum, r) => sum + r.amount, 0);

    // Balance recalculée : fond + recettes espèces + recouvrements + dépôts - dépenses - versements - remboursements - dettes du jour non encaissées
    const calculatedBalanceWithRecoveries = initialCashFund + totalCashIn + totalPeriodDeposits + totalInvoicePayments - totalPeriodExpenses - totalPeriodVersements - totalPeriodRefunds - totalDebts;

    const invoicesList = filteredSales.map(s => ({
      number: s.invoiceNumber,
      amount: s.total,
      amountPaid: s.amountPaid || s.total,
      amountDue: s.amountDue || 0,
      customerName: s.customerName || 'Passager',
      paymentMethod: s.paymentMethod
    }));

    return { 
      grossTotal, totalDiscounts, netRevenue, 
      standardSales, breakageSales,
      cashSales: totalCashIn, cardSales, accountSales, count: filteredSales.length,
      totalPeriodExpenses, totalPeriodVersements,
      totalPeriodDeposits, totalPeriodRefunds,
      calculatedBalance: calculatedBalanceWithRecoveries,
      debtInvoices, totalDebts,
      recoveryReceipts, totalRecoveries,
      invoicesList,
      expensesList: periodExpenses,
      depositsList: periodDeposits,
      refundsList: periodRefunds
    };
  }, [filteredSales, myExpenses, myVersements, myDeposits, myRefunds, initialCashFund, invoiceNumbers, endInvoice, sales, currentUser, cashInitializationDate, customerTransactions]);

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpense.label || newExpense.amount <= 0) return;
    addExpense(newExpense);
    setNewExpense({ label: '', amount: 0 });
    setShowExpenseModal(false);
  };

  const handleAddVersement = (e) => {
    e.preventDefault();
    if (newVersement <= 0) return;
    addVersement(newVersement);
    setNewVersement(0);
    setShowVersementModal(false);
  };

  // Si le fond de caisse n'est pas initialisé, afficher l'écran d'initialisation
  if (!isCashFundInitialized) {
    return (
      <div className="h-full flex items-center justify-center animate-fade-in">
        <div className="glass-panel rounded-xl p-4 max-w-md w-full text-center space-y-8">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto">
            <WalletOutlined style={{ fontSize: 40 }} />
          </div>
          <div className="space-y-2">
            <h2 className="text-[0.95rem] font-semibold text-text-heading">{t('cash.opening')}</h2>
            <p className="text-sm text-text-muted font-medium">
              {lastClosingBalance > 0 
                ? `Solde de clôture précédent : ${formatPrice(lastClosingBalance)}. Confirmez votre fond de caisse actuel.`
                : 'Entrez le fond de caisse disponible pour démarrer votre session.'
              }
            </p>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">{t('s.fcfa')}</span>
              <input 
                type="number"
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl pl-16 pr-6 py-4 text-lg font-bold text-text-heading focus:outline-none focus:border-primary/50"
                placeholder="0"
                value={tempInitialFund || ''}
                onChange={e => setTempInitialFund(parseFloat(e.target.value) || 0)}
              />
            </div>
            <Button type="primary" block onClick={() => initializeCashFund(tempInitialFund)} >
              {t('cash.start')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in pb-10 print:hidden">
        {/* Configuration & Rolling Fund */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Controls */}
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <CalculatorOutlined />
                </span>
                <div>
                  <h2 className="text-[0.9rem] font-semibold text-text-heading">{t('cash.management')}</h2>
                  <p className="text-[0.7rem] text-text-muted">{t('cash.managementHint')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button icon={<UpCircleOutlined />} onClick={() => setShowVersementModal(true)}>
                  {t('cash.makeDeposit')}
                </Button>
                <Button danger icon={<MinusCircleOutlined />} onClick={() => setShowExpenseModal(true)}>
                  {t('cash.recordExpense')}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest flex items-center gap-2">
                  <FileTextOutlined style={{ fontSize: 12 }} className="text-primary" /> {t('cash.invoiceRange')}
                </label>
                <div className="flex items-center gap-3">
                  <Select
                    className="flex-1" width="100%" allowClear
                    placeholder={t('cash.invoiceFrom')}
                    value={startInvoice || undefined}
                    onChange={v => setStartInvoice(v || '')}
                    options={invoiceNumbers.map(n => ({ value: n, label: n }))}
                  />
                  <span className="text-text-muted text-[0.75rem]">{t('common.to').toLowerCase()}</span>
                  <Select
                    className="flex-1" width="100%" allowClear
                    placeholder={t('cash.invoiceTo')}
                    value={endInvoice || undefined}
                    onChange={v => setEndInvoice(v || '')}
                    options={invoiceNumbers.map(n => ({ value: n, label: n }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest flex items-center gap-2">
                  <CalendarOutlined style={{ fontSize: 12 }} className="text-primary" /> {t('cash.presetPeriod')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'journalier', label: t('cash.today') },
                    { id: 'hebdomadaire', label: t('cash.week') },
                    { id: 'mensuel', label: t('cash.month') },
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setReportType(p.id); setStartInvoice(''); setEndInvoice(''); }}
                      className={`px-2 py-2 rounded-xl text-[0.65rem] font-semibold uppercase tracking-widest transition-all ${reportType === p.id && !startInvoice ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-black/5 dark:bg-white/5 text-text-muted hover:text-text-heading'}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expense History List */}
            <div className="glass-panel rounded-xl p-4">
              <h4 className="text-[0.65rem] font-semibold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <MinusCircleOutlined style={{ fontSize: 14 }} /> {t('s.dernieres_depenses')}
              </h4>
              <div className="space-y-3 max-h-[150px] overflow-y-auto">
                {filteredExpenses.slice(0, 5).map(exp => (
                  <div key={exp.id} className="flex items-center justify-between bg-black/5 dark:bg-white/5 px-4 py-2.5 rounded-xl text-[0.8rem]">
                    <span className="text-text-secondary font-bold">{exp.label}</span>
                    <span className="text-red-500 font-black">-{formatPrice(exp.amount)}</span>
                  </div>
                ))}
                {filteredExpenses.length === 0 && <p className="text-[0.7rem] text-text-muted text-center py-4">{t('s.aucune_depense_enregistree')}</p>}
              </div>
            </div>

            {/* Versement History List */}
            <div className="glass-panel rounded-xl p-4">
              <h4 className="text-[0.65rem] font-semibold text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <UpCircleOutlined style={{ fontSize: 14 }} /> {t('s.derniers_versements')}
              </h4>
              <div className="space-y-3 max-h-[150px] overflow-y-auto">
                {filteredVersements.slice(0, 5).map(v => (
                  <div key={v.id} className="flex items-center justify-between bg-black/5 dark:bg-white/5 px-4 py-2.5 rounded-xl text-[0.8rem]">
                    <span className="text-text-secondary font-bold">{t('s.versement_a_la_direction')}</span>
                    <span className="text-emerald-500 font-black">-{formatPrice(v.amount)}</span>
                  </div>
                ))}
                {filteredVersements.length === 0 && <p className="text-[0.7rem] text-text-muted text-center py-4">{t('s.aucun_versement_effectue')}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Rolling Fund Settlement Panel */}
        <div className="bg-primary border border-primary/20 rounded-xl p-5 shadow-2xl flex flex-col">
          <div className="space-y-1 mb-5">
            <h3 className="text-black font-black text-xl tracking-tight">{t('s.etat_de_la_caisse')}</h3>
            <p className="text-black/60 text-[0.7rem] font-bold uppercase tracking-widest">{t('s.resultat_selon_la_plage_selectionnee')}</p>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center text-[0.8rem] text-black/70 font-bold border-b border-black/10 pb-2">
              <span>{t('s.fond_initial')}</span>
              <span>{formatPrice(initialCashFund)}</span>
            </div>
            <div className="flex justify-between items-center text-[0.8rem] text-black font-semibold border-b border-black/10 pb-2">
              <span>{t('s.recettes_especes_mixte')}</span>
              <span>+{formatPrice(stats.cashSales)}</span>
            </div>
            {stats.totalPeriodDeposits > 0 && (
              <div className="flex justify-between items-center text-[0.8rem] text-black font-semibold border-b border-black/10 pb-2">
                <span>{t('s.depots_clients_especes')}</span>
                <span>+{formatPrice(stats.totalPeriodDeposits)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-[0.8rem] text-red-800 font-bold border-b border-black/10 pb-2">
              <span>{t('s.depenses_cumulees')}</span>
              <span>-{formatPrice(stats.totalPeriodExpenses)}</span>
            </div>
            <div className="flex justify-between items-center text-[0.8rem] text-red-800 font-bold border-b border-black/10 pb-2">
              <span>{t('s.versements_cumules')}</span>
              <span>-{formatPrice(stats.totalPeriodVersements)}</span>
            </div>
            {stats.totalPeriodRefunds > 0 && (
              <div className="flex justify-between items-center text-[0.8rem] text-red-800 font-bold border-b border-black/10 pb-2">
                <span>{t('s.remboursements_clients')}</span>
                <span>-{formatPrice(stats.totalPeriodRefunds)}</span>
              </div>
            )}

            {/* Recouvrements reçus */}
            {stats.totalRecoveries > 0 && (
              <div className="flex flex-col border-b border-black/10 pb-2 gap-1">
                <div className="flex justify-between items-center text-[0.8rem] text-emerald-700 font-semibold">
                  <span>{t('s.recouvrements_dettes_recus')}</span>
                  <span>+{formatPrice(stats.totalRecoveries)}</span>
                </div>
                {stats.recoveryReceipts.map((r, i) => (
                  <div key={i} className="flex justify-between items-center text-[0.7rem] text-emerald-600 pl-4">
                    <span>Fact. {r.invoiceNumber} ({r.customerName}) du {new Date(r.invoiceDate).toLocaleDateString('fr-FR')}</span>
                    <span>+{formatPrice(r.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Dettes accordées */}
            {stats.totalDebts > 0 && (
              <div className="flex flex-col border-b border-black/10 pb-2 gap-1">
                <div className="flex justify-between items-center text-[0.8rem] text-red-800 font-bold">
                  <span>{t('s.dettes_accordees_restes_a_payer')}</span>
                  <span>-{formatPrice(stats.totalDebts)}</span>
                </div>
                {stats.debtInvoices.map((d, i) => (
                  <div key={i} className="flex justify-between items-center text-[0.7rem] text-red-600 pl-4">
                    <span>Fact. {d.number} — {d.customerName}</span>
                    <span>Reste: {formatPrice(d.amountDue)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-8 text-center">
              <div className="text-black/50 text-[0.7rem] font-semibold uppercase tracking-widest mb-2">{t('s.solde_calcule_arret')}</div>
              <div className="text-5xl font-black text-black tracking-tighter leading-none mb-4">
                {formatPrice(stats.calculatedBalance)}
              </div>
              
              {/* La clôture arrête les comptes du jour : la faire alors que des
                  ventes attendent encore d'être transmises produirait un bilan
                  incomplet, que rien ne viendrait corriger ensuite. */}
              <button
                onClick={() => setShowClosureModal(true)}
                disabled={!canClose}
                title={canClose ? undefined : blockReason}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-[0.7rem] font-semibold uppercase tracking-widest hover:bg-black/80 transition-all shadow-sm disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-black"
              >
                <LockOutlined style={{ fontSize: 14 }} /> {t('s.cloturer_la_caisse')}
              </button>
              {!canClose && (
                <p className="mt-2 text-[0.7rem] text-black/60 max-w-xs">{blockReason}</p>
              )}
            </div>
          </div>

          <button 
            className="w-full bg-black text-white rounded-xl py-4 mt-8 font-semibold uppercase tracking-widest text-[0.8rem] flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform active:scale-95 shadow-sm"
            onClick={() => window.print()}
          >
            <PrinterOutlined style={{ fontSize: 20 }} />
            {t('s.imprimer_le_journal_de_caisse')}
          </button>
        </div>
      </div>

      {/* Résumé de la période (Cartes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'CA Standard', value: formatPrice(stats.standardSales), icon: RiseOutlined, color: 'text-primary' },
          { label: 'CA Casses', value: formatPrice(stats.breakageSales), icon: DropboxOutlined, color: 'text-orange-500' },
          { label: t('s.factures_net_total'), value: `${stats.count} fact. / ${formatPrice(stats.netRevenue)}`, icon: FileTextOutlined, color: 'text-blue-500' },
        ].map((stat, i) => (
          <div key={i} className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-black/5 dark:bg-white/5 ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <span className="text-[0.6rem] font-semibold text-text-heading uppercase tracking-widest">{t('s.rapport')}</span>
            </div>
            <div className="text-xl font-black text-text-heading tracking-tight">{stat.value}</div>
            <div className="text-[0.65rem] font-bold text-text-heading uppercase tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <Modal title={t('s.enregistre_la_depense')} onClose={() => setShowExpenseModal(false)} footer={null}>
          <form onSubmit={handleAddExpense} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[0.75rem] font-semibold text-text-heading dark:text-text-muted uppercase tracking-widest mb-1.5 block">{t('s.motif_de_la_depense')}</label>
                <input 
                  autoFocus
                  className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/20 dark:border-white/10 rounded-xl px-4 py-3 text-text-heading focus:outline-none focus:border-primary/50 font-bold"
                  placeholder={t('s.ex_frais_de_transport_fournitures')}
                  value={newExpense.label}
                  onChange={e => setNewExpense(p => ({ ...p, label: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-[0.75rem] font-semibold text-text-heading dark:text-text-muted uppercase tracking-widest mb-1.5 block">{t('s.montant_fcfa')}</label>
                <input 
                  type="number"
                  className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/20 dark:border-white/10 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 font-black focus:outline-none focus:border-red-500/50 text-2xl"
                  placeholder="0"
                  value={newExpense.amount || ''}
                  onChange={e => setNewExpense(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowExpenseModal(false)} className="flex-1">{t('s.annuler')}</Button>
              <Button type="primary" htmlType="submit" className="flex-1">{t('s.enregistre_la_depense')}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Versement Modal */}
      {showVersementModal && (
        <Modal title={t('s.effectuer_un_versement')} onClose={() => setShowVersementModal(false)} footer={null}>
          <form onSubmit={handleAddVersement} className="space-y-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center">
              <span className="text-[0.75rem] font-semibold text-emerald-700 dark:text-emerald-500 uppercase tracking-widest block mb-1">{t('s.disponible_en_caisse')}</span>
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-500">{formatPrice(stats.calculatedBalance)}</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[0.75rem] font-semibold text-text-heading dark:text-text-muted uppercase tracking-widest mb-1.5 block text-center">{t('s.montant_du_versement_a_la_direction')}</label>
                <input 
                  type="number"
                  autoFocus
                  className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/20 dark:border-white/10 rounded-xl px-4 py-3 text-emerald-600 dark:text-emerald-400 font-black focus:outline-none focus:border-emerald-500/50 text-3xl text-center"
                  placeholder="0"
                  value={newVersement || ''}
                  onChange={e => setNewVersement(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowVersementModal(false)} className="flex-1">{t('s.annuler')}</Button>
              <Button type="primary" htmlType="submit" className="flex-1 bg-emerald-500 border-emerald-500 hover:bg-emerald-600">{t('s.valider_le_versement')}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Closure Modal */}
      {showClosureModal && (
        <Modal title={t('s.cloture_de_caisse_journaliere')} onClose={() => setShowClosureModal(false)} footer={null}>
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-text-muted">Vous allez clôturer la session actuelle. Le solde suivant sera reporté comme fond de caisse initial pour la prochaine ouverture :</p>
              <div className="text-4xl font-black text-primary tracking-tighter py-4">
                {formatPrice(stats.calculatedBalance)}
              </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-start gap-4">
              <ExclamationCircleOutlined style={{ fontSize: 20 }} className="text-orange-500 shrink-0 mt-1" />
              <p className="text-[0.7rem] text-text-muted">
                Une fois clôturée, vous ne pourrez plus ajouter de dépenses ou de versements à cette session. Assurez-vous que le montant physique en caisse correspond bien au solde calculé.
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setShowClosureModal(false)} className="flex-1">{t('s.annuler')}</Button>
              <Button type="primary" onClick={() => { closeCashSession(stats.calculatedBalance, { initialFund: initialCashFund, cashSales: stats.cashSales, totalExpenses: stats.totalPeriodExpenses, totalVersements: stats.totalPeriodVersements, invoiceRange: `${startInvoice || invoiceNumbers[0]} - ${endInvoice || invoiceNumbers[invoiceNumbers.length - 1]}`, invoicesList: stats.invoicesList, expensesList: stats.expensesList }); setShowClosureModal(false); }} className="flex-1" >
                {t('s.confirmer_la_cloture')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
      </div>

      {/* Vue d'impression du Bilan Financier - compact 1 page */}
      <div className="hidden print:block text-black" style={{fontFamily:'Arial,sans-serif',fontSize:'11px',padding:'12px 16px',maxWidth:'750px',margin:'0 auto'}}>
        {/* En-tête compact avec infos entreprise */}
        <div style={{borderBottom:'2px solid black',paddingBottom:'6px',marginBottom:'8px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
            <div>
              <div style={{fontSize:'12px',fontWeight:'900',textTransform:'uppercase'}}>{companySettings?.name || 'VOTRE ENTREPRISE'}</div>
              <div style={{fontSize:'9px',color:'#444'}}>{companySettings?.address || 'Adresse de l\'entreprise'}</div>
              <div style={{fontSize:'9px',color:'#444'}}>{companySettings?.phone || 'Téléphone'}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:'14px',fontWeight:'900',textTransform:'uppercase',letterSpacing:'1px'}}>{t('s.bilan_financier')}</div>
              <div style={{fontSize:'9px',color:'#666',fontWeight:'bold',marginTop:'2px'}}>{t('s.magasin_2')} <span style={{color:'black'}}>{cashierStore.name}</span></div>
            </div>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:'4px',fontSize:'10px',borderTop:'1px dotted #ccc',paddingTop:'4px'}}>
            <span><strong>{t('s.date_2')}</strong> {new Date().toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'})}</span>
            <span><strong>{t('s.caissier_2')}</strong> {currentUser?.name?.toUpperCase()}</span>
            <span><strong>{t('s.plage')}</strong> {`${startInvoice||invoiceNumbers[0]||'N/A'} → ${endInvoice||invoiceNumbers[invoiceNumbers.length-1]||'N/A'}`}</span>
          </div>
        </div>

        {/* État de caisse - tableau compact */}
        <div style={{marginBottom:'8px'}}>
          <div style={{fontWeight:'900',fontSize:'11px',textTransform:'uppercase',borderBottom:'1px solid #ccc',paddingBottom:'2px',marginBottom:'4px'}}>{t('s.etat_de_la_caisse')}</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'10px'}}>
            <tbody>
              <tr><td style={{padding:'1px 4px'}}>{t('s.fond_initial')}</td><td style={{textAlign:'right',padding:'1px 4px',fontWeight:'bold'}}>{formatPrice(initialCashFund)}</td></tr>
              <tr><td style={{padding:'1px 4px',fontWeight:'bold'}}>+ Recettes Espèces / Mixte</td><td style={{textAlign:'right',padding:'1px 4px',fontWeight:'900',color:'#059669'}}>+{formatPrice(stats.cashSales)}</td></tr>
              {stats.totalPeriodDeposits > 0 && <tr><td style={{padding:'1px 4px'}}>+ Dépôts Clients (Espèces)</td><td style={{textAlign:'right',padding:'1px 4px',color:'#059669'}}>+{formatPrice(stats.totalPeriodDeposits)}</td></tr>}
              {stats.totalRecoveries > 0 && <>
                <tr><td style={{padding:'1px 4px',fontWeight:'bold'}}>+ Recouvrements de Dettes Reçus</td><td style={{textAlign:'right',padding:'1px 4px',fontWeight:'900',color:'#059669'}}>+{formatPrice(stats.totalRecoveries)}</td></tr>
                {stats.recoveryReceipts.map((r,i)=>(
                  <tr key={i} style={{background:'#f0fdf4'}}><td style={{padding:'1px 4px 1px 16px',fontSize:'9px',color:'#166534'}}>Fact.{r.invoiceNumber} – {r.customerName} (du {r.invoiceDate ? new Date(r.invoiceDate).toLocaleDateString('fr-FR') : '?'})</td><td style={{textAlign:'right',padding:'1px 4px',fontSize:'9px',color:'#166534'}}>+{formatPrice(r.amount)}</td></tr>
                ))}
              </>}
              {stats.expensesList && stats.expensesList.length > 0 && <>
                <tr><td style={{padding:'1px 4px',fontWeight:'bold'}}>{t('s.depenses_2')}</td><td style={{textAlign:'right',padding:'1px 4px',fontWeight:'900',color:'#dc2626'}}>-{formatPrice(stats.totalPeriodExpenses)}</td></tr>
                {stats.expensesList.map(exp=>(
                  <tr key={exp.id} style={{background:'#fff1f2'}}><td style={{padding:'1px 4px 1px 16px',fontSize:'9px',color:'#991b1b'}}>- {exp.label}</td><td style={{textAlign:'right',padding:'1px 4px',fontSize:'9px',color:'#991b1b'}}>-{formatPrice(exp.amount)}</td></tr>
                ))}
              </>}
              {stats.totalPeriodExpenses === 0 && <tr><td style={{padding:'1px 4px'}}>{t('s.depenses_2')}</td><td style={{textAlign:'right',padding:'1px 4px',color:'#999'}}>0 FCFA</td></tr>}
              <tr><td style={{padding:'1px 4px',fontWeight:'bold'}}>{t('s.versements_cumules_2')}</td><td style={{textAlign:'right',padding:'1px 4px',fontWeight:'900',color:'#dc2626'}}>-{formatPrice(stats.totalPeriodVersements)}</td></tr>
              {stats.totalPeriodRefunds > 0 && <tr><td style={{padding:'1px 4px'}}>– Remboursements Clients</td><td style={{textAlign:'right',padding:'1px 4px',color:'#dc2626'}}>-{formatPrice(stats.totalPeriodRefunds)}</td></tr>}
              {stats.totalDebts > 0 && <>
                <tr><td style={{padding:'1px 4px',fontWeight:'bold'}}>{t('s.dettes_accordees_non_encaissees')}</td><td style={{textAlign:'right',padding:'1px 4px',fontWeight:'900',color:'#dc2626'}}>-{formatPrice(stats.totalDebts)}</td></tr>
                {stats.debtInvoices.map((d,i)=>(
                  <tr key={i} style={{background:'#fff1f2'}}><td style={{padding:'1px 4px 1px 16px',fontSize:'9px',color:'#991b1b'}}>Fact.{d.number} – {d.customerName}</td><td style={{textAlign:'right',padding:'1px 4px',fontSize:'9px',color:'#991b1b'}}>Reste: {formatPrice(d.amountDue)}</td></tr>
                ))}
              </>}
              <tr style={{borderTop:'2px solid black'}}><td style={{padding:'4px 4px',fontWeight:'900',fontSize:'12px'}}>{t('s.solde_de_cloture_calcule')}</td><td style={{textAlign:'right',padding:'4px 4px',fontWeight:'900',fontSize:'14px'}}>{formatPrice(stats.calculatedBalance)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Détail des factures */}
        {stats.invoicesList && stats.invoicesList.length > 0 && (
          <div>
            <div style={{fontWeight:'900',fontSize:'11px',textTransform:'uppercase',borderBottom:'1px solid #ccc',paddingBottom:'2px',marginBottom:'4px'}}>{t('s.detail_des_factures_incluses')}</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'9px'}}>
              <thead>
                <tr style={{background:'#f3f4f6'}}>
                  <th style={{border:'1px solid #d1d5db',padding:'2px 4px',textAlign:'left'}}>{t('s.n_facture')}</th>
                  <th style={{border:'1px solid #d1d5db',padding:'2px 4px',textAlign:'left'}}>{t('s.client')}</th>
                  <th style={{border:'1px solid #d1d5db',padding:'2px 4px',textAlign:'right'}}>{t('s.total')}</th>
                  <th style={{border:'1px solid #d1d5db',padding:'2px 4px',textAlign:'right'}}>{t('s.paye_2')}</th>
                  <th style={{border:'1px solid #d1d5db',padding:'2px 4px',textAlign:'right'}}>{t('s.reste')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.invoicesList.map(inv=>(
                  <tr key={inv.number} style={inv.amountDue>0?{background:'#fff1f2'}:{}}>
                    <td style={{border:'1px solid #d1d5db',padding:'2px 4px',fontWeight:'bold'}}>{inv.number}</td>
                    <td style={{border:'1px solid #d1d5db',padding:'2px 4px'}}>{inv.customerName}</td>
                    <td style={{border:'1px solid #d1d5db',padding:'2px 4px',textAlign:'right',fontWeight:'900'}}>{formatPrice(inv.amount)}</td>
                    <td style={{border:'1px solid #d1d5db',padding:'2px 4px',textAlign:'right',color:'#059669'}}>{formatPrice(inv.amountPaid)}</td>
                    <td style={{border:'1px solid #d1d5db',padding:'2px 4px',textAlign:'right',color:'#dc2626'}}>{inv.amountDue>0?formatPrice(inv.amountDue):'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Détail des Dépôts & Remboursements */}
        {((stats.depositsList && stats.depositsList.length > 0) || (stats.refundsList && stats.refundsList.length > 0)) && (
          <div style={{marginTop:'8px'}}>
            <div style={{fontWeight:'900',fontSize:'11px',textTransform:'uppercase',borderBottom:'1px solid #ccc',paddingBottom:'2px',marginBottom:'4px'}}>{t('s.detail_des_depots_remboursements_inclus')}</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'9px'}}>
              <thead>
                <tr style={{background:'#f3f4f6'}}>
                  <th style={{border:'1px solid #d1d5db',padding:'2px 4px',textAlign:'left'}}>{t('s.type_reference')}</th>
                  <th style={{border:'1px solid #d1d5db',padding:'2px 4px',textAlign:'left'}}>{t('s.client_infos')}</th>
                  <th style={{border:'1px solid #d1d5db',padding:'2px 4px',textAlign:'right'}}>{t('s.montant')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.depositsList?.map(dep => {
                  const client = customers?.find(c => c.id === dep.customerId);
                  return (
                    <tr key={dep.id}>
                      <td style={{border:'1px solid #d1d5db',padding:'2px 4px',fontWeight:'bold'}}>Dépôt client - {dep.reference}</td>
                      <td style={{border:'1px solid #d1d5db',padding:'2px 4px'}}>{client?.name || `ID: ${dep.customerId}`} ({dep.method})</td>
                      <td style={{border:'1px solid #d1d5db',padding:'2px 4px',textAlign:'right',fontWeight:'900',color:'#059669'}}>+{formatPrice(dep.amount)}</td>
                    </tr>
                  );
                })}
                {stats.refundsList?.map(ref => {
                  const client = customers?.find(c => c.id === ref.customerId);
                  return (
                    <tr key={ref.id} style={{background:'#fff1f2'}}>
                      <td style={{border:'1px solid #d1d5db',padding:'2px 4px',fontWeight:'bold'}}>Remboursement - {ref.reference}</td>
                      <td style={{border:'1px solid #d1d5db',padding:'2px 4px'}}>{client?.name || `ID: ${ref.customerId}`} ({ref.method})</td>
                      <td style={{border:'1px solid #d1d5db',padding:'2px 4px',textAlign:'right',fontWeight:'900',color:'#dc2626'}}>-{formatPrice(Math.abs(ref.amount))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{marginTop:'12px',borderTop:'1px dashed #ccc',paddingTop:'6px',display:'flex',justifyContent:'space-between',fontSize:'9px',color:'#666'}}>
          <span>Document généré le {new Date().toLocaleString('fr-FR')}</span>
          <span>Signature : ___________________________</span>
        </div>
      </div>

    </>
  );
};

export default FinancialReport;
