import React, { useState, useMemo } from 'react';
import { useStore, formatPrice } from '../../context/StoreContext';
import Modal from '../common/Modal';
import { BarChart3, Calendar, FileText, Calculator, Printer, CheckCircle2, TrendingUp, Wallet, CreditCard, MinusCircle, PlusCircle, AlertCircle, ArrowUpCircle, Lock, PackageOpen, Package } from 'lucide-react';
import { Button } from 'antd';

const FinancialReport = () => {
  const { 
    sales, currentUser, expenses, addExpense, 
    initialCashFund, isCashFundInitialized, initializeCashFund, cashInitializationDate,
    versements, addVersement, currentCashBalance,
    lastClosingBalance, closeCashSession, customerTransactions
  } = useStore();

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
    
    let standardSales = 0;
    let breakageSales = 0;
    let sampleSales = 0;

    filteredSales.forEach(s => {
      s.items.forEach(item => {
         const itemGross = item.price * item.quantity;
         if (item.isNonInventory) sampleSales += itemGross;
         else if (item.isBreakage || item.isRepackaged) breakageSales += itemGross;
         else standardSales += itemGross;
      });
    });

    const calculatedBalance = initialCashFund + totalCashIn + totalPeriodDeposits - totalPeriodExpenses - totalPeriodVersements - totalPeriodRefunds;

    const invoicesList = filteredSales.map(s => ({
      number: s.invoiceNumber,
      amount: s.total,
      paymentMethod: s.paymentMethod
    }));

    return { 
      grossTotal, totalDiscounts, netRevenue, 
      standardSales, breakageSales, sampleSales,
      cashSales: totalCashIn, cardSales, accountSales, count: filteredSales.length,
      totalPeriodExpenses, totalPeriodVersements,
      totalPeriodDeposits, totalPeriodRefunds,
      calculatedBalance, invoicesList,
      expensesList: periodExpenses
    };
  }, [filteredSales, myExpenses, myVersements, myDeposits, myRefunds, initialCashFund, invoiceNumbers, endInvoice]);

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
        <div className="bg-bg-card border border-black/5 dark:border-white/5 rounded-3xl p-10 shadow-2xl max-w-md w-full text-center space-y-8">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto">
            <Wallet size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-text-heading tracking-tight">Ouverture de Caisse</h2>
            <p className="text-sm text-text-muted font-medium">
              {lastClosingBalance > 0 
                ? `Solde de clôture précédent : ${formatPrice(lastClosingBalance)}. Confirmez votre fond de caisse actuel.`
                : 'Entrez le fond de caisse disponible pour démarrer votre session.'
              }
            </p>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">FCFA</span>
              <input 
                type="number"
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl pl-16 pr-6 py-4 text-2xl font-black text-text-heading focus:outline-none focus:border-primary/50"
                placeholder="0"
                value={tempInitialFund || ''}
                onChange={e => setTempInitialFund(parseFloat(e.target.value) || 0)}
              />
            </div>
            <Button 
              type="primary" 
              size="large" 
              block 
              onClick={() => initializeCashFund(tempInitialFund)}
              className="h-14 rounded-2xl font-black uppercase tracking-widest text-[0.9rem]"
            >
              Démarrer ma caisse
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Controls */}
          <div className="bg-bg-card border border-black/5 dark:border-white/5 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Calculator size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-text-heading tracking-tight">Gestion de Caisse</h2>
                  <p className="text-[0.7rem] text-text-muted font-bold uppercase tracking-widest">Contrôle des flux financiers</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowVersementModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[0.65rem] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/5"
                >
                  <ArrowUpCircle size={14} /> Effectuer un versement
                </button>
                <button 
                  onClick={() => setShowExpenseModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-[0.65rem] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5"
                >
                  <MinusCircle size={14} /> Enregistre la depense
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[0.65rem] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                  <FileText size={12} className="text-primary" /> Plage de factures (Rapport)
                </label>
                <div className="flex items-center gap-3">
                  <select 
                    className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-[0.85rem] text-text-heading focus:outline-none focus:border-primary/50"
                    value={startInvoice}
                    onChange={e => setStartInvoice(e.target.value)}
                  >
                    <option value="">Départ...</option>
                    {invoiceNumbers.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span className="text-text-muted opacity-30">à</span>
                  <select 
                    className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-[0.85rem] text-text-heading focus:outline-none focus:border-primary/50"
                    value={endInvoice}
                    onChange={e => setEndInvoice(e.target.value)}
                  >
                    <option value="">Fin...</option>
                    {invoiceNumbers.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[0.65rem] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} className="text-primary" /> Période prédéfinie
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'journalier', label: 'Aujourd\'hui' },
                    { id: 'hebdomadaire', label: 'Semaine' },
                    { id: 'mensuel', label: 'Mois' },
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setReportType(p.id); setStartInvoice(''); setEndInvoice(''); }}
                      className={`px-2 py-2 rounded-xl text-[0.65rem] font-black uppercase tracking-widest transition-all ${reportType === p.id && !startInvoice ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'bg-black/5 dark:bg-white/5 text-text-muted hover:text-text-heading'}`}
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
            <div className="bg-bg-card border border-black/5 dark:border-white/5 rounded-2xl p-5 shadow-lg">
              <h4 className="text-[0.65rem] font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <MinusCircle size={14} /> Dernières Dépenses
              </h4>
              <div className="space-y-3 max-h-[150px] overflow-y-auto">
                {filteredExpenses.slice(0, 5).map(exp => (
                  <div key={exp.id} className="flex items-center justify-between bg-black/5 dark:bg-white/5 px-4 py-2.5 rounded-xl text-[0.8rem]">
                    <span className="text-text-secondary font-bold">{exp.label}</span>
                    <span className="text-red-500 font-black">-{formatPrice(exp.amount)}</span>
                  </div>
                ))}
                {filteredExpenses.length === 0 && <p className="text-[0.7rem] text-text-muted text-center py-4">Aucune dépense enregistrée</p>}
              </div>
            </div>

            {/* Versement History List */}
            <div className="bg-bg-card border border-black/5 dark:border-white/5 rounded-2xl p-5 shadow-lg">
              <h4 className="text-[0.65rem] font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ArrowUpCircle size={14} /> Derniers Versements
              </h4>
              <div className="space-y-3 max-h-[150px] overflow-y-auto">
                {filteredVersements.slice(0, 5).map(v => (
                  <div key={v.id} className="flex items-center justify-between bg-black/5 dark:bg-white/5 px-4 py-2.5 rounded-xl text-[0.8rem]">
                    <span className="text-text-secondary font-bold">Versement à la direction</span>
                    <span className="text-emerald-500 font-black">-{formatPrice(v.amount)}</span>
                  </div>
                ))}
                {filteredVersements.length === 0 && <p className="text-[0.7rem] text-text-muted text-center py-4">Aucun versement effectué</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Rolling Fund Settlement Panel */}
        <div className="bg-primary border border-primary/20 rounded-3xl p-8 shadow-2xl flex flex-col">
          <div className="space-y-1 mb-8">
            <h3 className="text-black font-black text-xl tracking-tight">État de la Caisse</h3>
            <p className="text-black/60 text-[0.7rem] font-bold uppercase tracking-widest">Résultat selon la plage sélectionnée</p>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center text-[0.8rem] text-black/70 font-bold border-b border-black/10 pb-2">
              <span>Fond Initial</span>
              <span>{formatPrice(initialCashFund)}</span>
            </div>
            <div className="flex justify-between items-center text-[0.8rem] text-black font-black border-b border-black/10 pb-2">
              <span>Recettes Espèces / Mixte</span>
              <span>+{formatPrice(stats.cashSales)}</span>
            </div>
            {stats.totalPeriodDeposits > 0 && (
              <div className="flex justify-between items-center text-[0.8rem] text-black font-black border-b border-black/10 pb-2">
                <span>Dépôts Clients (Espèces)</span>
                <span>+{formatPrice(stats.totalPeriodDeposits)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-[0.8rem] text-red-800 font-bold border-b border-black/10 pb-2">
              <span>Dépenses cumulées</span>
              <span>-{formatPrice(stats.totalPeriodExpenses)}</span>
            </div>
            <div className="flex justify-between items-center text-[0.8rem] text-red-800 font-bold border-b border-black/10 pb-2">
              <span>Versements cumulés</span>
              <span>-{formatPrice(stats.totalPeriodVersements)}</span>
            </div>
            {stats.totalPeriodRefunds > 0 && (
              <div className="flex justify-between items-center text-[0.8rem] text-red-800 font-bold border-b border-black/10 pb-2">
                <span>Remboursements Clients</span>
                <span>-{formatPrice(stats.totalPeriodRefunds)}</span>
              </div>
            )}

            <div className="pt-8 text-center">
              <div className="text-black/50 text-[0.7rem] font-black uppercase tracking-widest mb-2">SOLDE CALCULÉ (ARRÊT)</div>
              <div className="text-5xl font-black text-black tracking-tighter leading-none mb-4">
                {formatPrice(stats.calculatedBalance)}
              </div>
              
              <button
                onClick={() => setShowClosureModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-[0.7rem] font-black uppercase tracking-widest hover:bg-black/80 transition-all shadow-xl"
              >
                <Lock size={14} /> Clôturer la caisse
              </button>
            </div>
          </div>

          <button 
            className="w-full bg-black text-white rounded-2xl py-4 mt-8 font-black uppercase tracking-widest text-[0.8rem] flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform active:scale-95 shadow-xl"
            onClick={() => window.print()}
          >
            <Printer size={20} />
            Imprimer le journal de caisse
          </button>
        </div>
      </div>

      {/* Résumé de la période (Cartes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'CA Standard', value: formatPrice(stats.standardSales), icon: TrendingUp, color: 'text-primary' },
          { label: 'CA Casses', value: formatPrice(stats.breakageSales), icon: PackageOpen, color: 'text-orange-500' },
          { label: 'CA Échantillons', value: formatPrice(stats.sampleSales), icon: Package, color: 'text-purple-500' },
          { label: 'Factures / Net Total', value: `${stats.count} fact. / ${formatPrice(stats.netRevenue)}`, icon: FileText, color: 'text-blue-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-bg-card border border-black/5 dark:border-white/5 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-black/5 dark:bg-white/5 ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <span className="text-[0.6rem] font-black text-text-heading uppercase tracking-widest">Rapport</span>
            </div>
            <div className="text-xl font-black text-text-heading tracking-tight">{stat.value}</div>
            <div className="text-[0.65rem] font-bold text-text-heading uppercase tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <Modal title="Enregistre la depense" onClose={() => setShowExpenseModal(false)} footer={null}>
          <form onSubmit={handleAddExpense} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[0.75rem] font-black text-text-heading dark:text-text-muted uppercase tracking-widest mb-1.5 block">Motif de la dépense</label>
                <input 
                  autoFocus
                  className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/20 dark:border-white/10 rounded-xl px-4 py-3 text-text-heading focus:outline-none focus:border-primary/50 font-bold"
                  placeholder="Ex: Frais de transport, Fournitures..."
                  value={newExpense.label}
                  onChange={e => setNewExpense(p => ({ ...p, label: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-[0.75rem] font-black text-text-heading dark:text-text-muted uppercase tracking-widest mb-1.5 block">Montant (FCFA)</label>
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
              <Button onClick={() => setShowExpenseModal(false)} className="flex-1 h-12 rounded-xl font-bold">Annuler</Button>
              <Button type="primary" htmlType="submit" className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest">Enregistre la depense</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Versement Modal */}
      {showVersementModal && (
        <Modal title="Effectuer un versement" onClose={() => setShowVersementModal(false)} footer={null}>
          <form onSubmit={handleAddVersement} className="space-y-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center">
              <span className="text-[0.75rem] font-black text-emerald-700 dark:text-emerald-500 uppercase tracking-widest block mb-1">Disponible en caisse</span>
              <span className="text-3xl font-black text-emerald-700 dark:text-emerald-500">{formatPrice(stats.calculatedBalance)}</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[0.75rem] font-black text-text-heading dark:text-text-muted uppercase tracking-widest mb-1.5 block text-center">Montant du versement à la direction</label>
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
              <Button onClick={() => setShowVersementModal(false)} className="flex-1 h-12 rounded-xl font-bold">Annuler</Button>
              <Button type="primary" htmlType="submit" className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest bg-emerald-500 border-emerald-500 hover:bg-emerald-600">Valider le versement</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Closure Modal */}
      {showClosureModal && (
        <Modal title="Clôture de Caisse Journalière" onClose={() => setShowClosureModal(false)} footer={null}>
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-text-muted">Vous allez clôturer la session actuelle. Le solde suivant sera reporté comme fond de caisse initial pour la prochaine ouverture :</p>
              <div className="text-4xl font-black text-primary tracking-tighter py-4">
                {formatPrice(stats.calculatedBalance)}
              </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-start gap-4">
              <AlertCircle className="text-orange-500 shrink-0 mt-1" size={20} />
              <p className="text-[0.7rem] text-text-muted">
                Une fois clôturée, vous ne pourrez plus ajouter de dépenses ou de versements à cette session. Assurez-vous que le montant physique en caisse correspond bien au solde calculé.
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setShowClosureModal(false)} className="flex-1 h-12 rounded-xl font-bold">Annuler</Button>
              <Button 
                type="primary" 
                onClick={() => {
                  closeCashSession(stats.calculatedBalance, {
                    initialFund: initialCashFund,
                    cashSales: stats.cashSales,
                    totalExpenses: stats.totalPeriodExpenses,
                    totalVersements: stats.totalPeriodVersements,
                    invoiceRange: `${startInvoice || invoiceNumbers[0]} - ${endInvoice || invoiceNumbers[invoiceNumbers.length - 1]}`,
                    invoicesList: stats.invoicesList,
                    expensesList: stats.expensesList
                  });
                  setShowClosureModal(false);
                }}
                className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest"
              >
                Confirmer la clôture
              </Button>
            </div>
          </div>
        </Modal>
      )}
      </div>

      {/* Vue d'impression du Bilan Original */}
      <div className="hidden print:block text-black p-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 border-b-2 border-black inline-block pb-2">Bilan Financier (Original)</h1>
          <div className="flex justify-between items-end mt-6">
            <div className="text-left">
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Date et Heure d'impression</p>
              <p className="text-xl font-black">{new Date().toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Caissier responsable</p>
              <p className="text-xl font-black uppercase">{currentUser?.name}</p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto border-2 border-black rounded-3xl p-10 bg-white">
          <h3 className="text-2xl font-black tracking-tight mb-8 text-center">État de la Caisse</h3>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center text-lg border-b border-gray-300 pb-4">
              <span className="font-bold text-gray-600">Fond Initial</span>
              <span className="font-bold">{formatPrice(initialCashFund)}</span>
            </div>
            <div className="flex justify-between items-center text-lg border-b border-gray-300 pb-4">
              <span className="font-black text-gray-800">Recettes Espèces / Mixte</span>
              <span className="font-black text-emerald-600">+{formatPrice(stats.cashSales)}</span>
            </div>
            
            {stats.expensesList && stats.expensesList.length > 0 ? (
              <div className="border-b border-gray-300 pb-4">
                <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Détail des Dépenses</div>
                {stats.expensesList.map(exp => (
                  <div key={exp.id} className="flex justify-between items-center text-base py-1">
                    <span className="font-bold text-gray-700">- {exp.label}</span>
                    <span className="font-bold text-red-600">-{formatPrice(exp.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-lg mt-2 pt-2 border-t border-dashed border-gray-300">
                  <span className="font-bold text-gray-600">Total Dépenses</span>
                  <span className="font-bold text-red-600">-{formatPrice(stats.totalPeriodExpenses)}</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center text-lg border-b border-gray-300 pb-4">
                <span className="font-bold text-gray-600">Dépenses</span>
                <span className="font-bold text-gray-400">0 FCFA</span>
              </div>
            )}

            <div className="flex justify-between items-center text-lg border-b border-gray-300 pb-4">
              <span className="font-bold text-gray-600">Versements cumulés</span>
              <span className="font-bold text-red-600">-{formatPrice(stats.totalPeriodVersements)}</span>
            </div>
            
            <div className="pt-8 text-center">
              <div className="text-gray-500 text-sm font-black uppercase tracking-widest mb-2">SOLDE DE CLÔTURE CALCULÉ</div>
              <div className="text-5xl font-black tracking-tighter bg-gray-100 inline-block px-10 py-4 rounded-2xl border-2 border-gray-300">
                {formatPrice(stats.calculatedBalance)}
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h4 className="text-lg font-black uppercase tracking-widest text-center mb-4 border-b border-gray-200 pb-2">Détail des factures incluses</h4>
            {stats.invoicesList && stats.invoicesList.length > 0 ? (
              <table className="w-full text-left border-collapse mt-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 border border-gray-300 text-sm font-bold uppercase tracking-widest">N° Facture</th>
                    <th className="px-4 py-2 border border-gray-300 text-sm font-bold uppercase tracking-widest text-right">Montant Pris en Compte</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.invoicesList.map(inv => (
                    <tr key={inv.number}>
                      <td className="px-4 py-2 border border-gray-300 font-bold">{inv.number}</td>
                      <td className="px-4 py-2 border border-gray-300 text-right font-black">{formatPrice(inv.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-500 text-sm font-bold mt-4">Aucune facture dans cette plage / période.</p>
            )}
            <div className="mt-4 text-center text-sm font-bold text-gray-500 pt-6">
              Plage couverte : <span className="text-black">{`${startInvoice || invoiceNumbers[0] || 'N/A'} - ${endInvoice || invoiceNumbers[invoiceNumbers.length - 1] || 'N/A'}`}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FinancialReport;
