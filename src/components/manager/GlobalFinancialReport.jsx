import React, { useMemo } from 'react';
import { formatPrice } from '../../context/StoreContext';
import { useSales, useUsers, useStores, useCustomers } from '../../hooks';
import { Wallet, MinusCircle, ArrowUpCircle, User, Store, Calculator, CheckCircle2, TrendingUp, PackageOpen, Package, PlusCircle } from 'lucide-react';

const GlobalFinancialReport = () => {
  const { allSales = [], expenses = [], versements = [] } = useSales();
  const { users = [] } = useUsers();
  const { stores = [] } = useStores();
  const { customerTransactions = [] } = useCustomers();

  const cashiers = useMemo(() => users.filter(u => u.role === 'cashier'), [users]);

  const cashierReports = useMemo(() => {
    return cashiers.map(cashier => {
      const cashierSales = allSales.filter(s => s.cashier === cashier.name && s.paymentMethod === 'Espèces');
      const cashierExpenses = expenses.filter(e => e.cashier === cashier.name);
      const cashierVersements = versements.filter(v => v.cashier === cashier.name);
      const cashierDeposits = customerTransactions.filter(t => t.cashier === cashier.name && t.type === 'deposit');
      const cashierRefunds = customerTransactions.filter(t => t.cashier === cashier.name && t.type === 'refund');

      const totalSales = cashierSales.reduce((s, v) => s + v.total, 0);
      const totalExpenses = cashierExpenses.reduce((s, e) => s + e.amount, 0);
      const totalVersements = cashierVersements.reduce((s, v) => s + v.amount, 0);
      const totalDeposits = cashierDeposits.reduce((s, t) => s + t.amount, 0);
      const totalRefunds = cashierRefunds.reduce((s, t) => s + Math.abs(t.amount), 0);
      
      // Note: In a real app, initial fund should be per-cashier-session. 
      // For now we use the global initialCashFund if applicable or 0 if not tracked per cashier in the mock.
      // Assuming we want to show current activity.
      
      let standardSales = 0;
      let breakageSales = 0;
      let sampleSales = 0;

      cashierSales.forEach(s => {
        s.items.forEach(item => {
           const itemGross = item.price * item.quantity;
           if (item.isNonInventory) sampleSales += itemGross;
           else if (item.isBreakage || item.isRepackaged) breakageSales += itemGross;
           else standardSales += itemGross;
        });
      });

      return {
        ...cashier,
        totalSales,
        standardSales,
        breakageSales,
        sampleSales,
        totalExpenses,
        totalVersements,
        totalDeposits,
        totalRefunds,
        balance: totalSales + totalDeposits - totalExpenses - totalVersements - totalRefunds,
        expenseCount: cashierExpenses.length,
        versementCount: cashierVersements.length,
        storeName: stores.find(s => s.id === cashier.storeId)?.name || 'N/A'
      };
    });
  }, [cashiers, allSales, expenses, versements, stores, customerTransactions]);

  const totals = useMemo(() => {
    return cashierReports.reduce((acc, report) => ({
      sales: acc.sales + report.totalSales,
      standardSales: (acc.standardSales || 0) + report.standardSales,
      breakageSales: (acc.breakageSales || 0) + report.breakageSales,
      sampleSales: (acc.sampleSales || 0) + report.sampleSales,
      expenses: acc.expenses + report.totalExpenses,
      versements: acc.versements + report.totalVersements,
      deposits: (acc.deposits || 0) + report.totalDeposits,
      refunds: (acc.refunds || 0) + report.totalRefunds,
      balance: acc.balance + report.balance
    }), { sales: 0, standardSales: 0, breakageSales: 0, sampleSales: 0, expenses: 0, versements: 0, deposits: 0, refunds: 0, balance: 0 });
  }, [cashierReports]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Recettes Espèces (Total)', value: formatPrice(totals.sales), icon: Wallet, color: 'text-emerald-500' },
          { label: 'CA Standard', value: formatPrice(totals.standardSales), icon: TrendingUp, color: 'text-primary' },
          { label: 'CA Casses', value: formatPrice(totals.breakageSales), icon: PackageOpen, color: 'text-orange-500' },
          { label: 'CA Échantillons', value: formatPrice(totals.sampleSales), icon: Package, color: 'text-purple-500' },
          { label: 'Dépôts Clients (Total)', value: formatPrice(totals.deposits), icon: PlusCircle, color: 'text-emerald-400' },
          { label: 'Remboursements (Total)', value: formatPrice(totals.refunds), icon: MinusCircle, color: 'text-rose-400' },
          { label: 'Dépenses Totales', value: formatPrice(totals.expenses), icon: MinusCircle, color: 'text-red-500' },
          { label: 'Versements Reçus', value: formatPrice(totals.versements), icon: ArrowUpCircle, color: 'text-blue-500' },
          { label: 'Solde Global', value: formatPrice(totals.balance), icon: Calculator, color: 'text-black' },
        ].map((stat, i) => (
          <div key={i} className="bg-bg-card border border-black/5 dark:border-white/5 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-black/5 dark:bg-white/5 ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <span className="text-[0.6rem] font-black text-text-heading uppercase tracking-widest">Global</span>
            </div>
            <div className="text-xl font-black text-text-heading tracking-tight">{stat.value}</div>
            <div className="text-[0.65rem] font-bold text-text-heading uppercase tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Cashiers List */}
      <div className="bg-bg-card border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-8 py-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01]">
          <div>
            <h3 className="text-lg font-black text-text-heading tracking-tight">États de Compte par Caissier</h3>
            <p className="text-[0.7rem] text-text-muted font-bold uppercase tracking-widest mt-1">Suivi individuel des flux financiers</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/[0.02] dark:bg-white/[0.02]">
                <th className="px-8 py-4 text-[0.65rem] font-black text-text-muted uppercase tracking-widest">Caissier</th>
                <th className="px-8 py-4 text-[0.65rem] font-black text-text-muted uppercase tracking-widest text-right">Ventilation CA (Espèces)</th>
                <th className="px-8 py-4 text-[0.65rem] font-black text-text-muted uppercase tracking-widest text-right">Dépenses</th>
                <th className="px-8 py-4 text-[0.65rem] font-black text-text-muted uppercase tracking-widest text-right">Versements</th>
                <th className="px-8 py-4 text-[0.65rem] font-black text-text-muted uppercase tracking-widest text-right">Solde Actuel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {cashierReports.map(report => (
                <tr key={report.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                        {report.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-black text-text-heading tracking-tight">{report.name}</div>
                        <div className="flex items-center gap-1.5 opacity-50">
                          <Store size={10} />
                          <span className="text-[0.65rem] font-bold uppercase tracking-wider">{report.storeName}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-text-heading text-sm">
                    <div>{formatPrice(report.totalSales)}</div>
                    <div className="text-[0.55rem] font-bold text-text-muted uppercase mt-1">
                      Std: {formatPrice(report.standardSales)} | Casses: {formatPrice(report.breakageSales)} | Échan: {formatPrice(report.sampleSales)}
                    </div>
                    {(report.totalDeposits > 0 || report.totalRefunds > 0) && (
                      <div className="text-[0.55rem] font-bold text-emerald-600 dark:text-emerald-500 uppercase mt-0.5">
                        Dépôts: +{formatPrice(report.totalDeposits)} | Remb: -{formatPrice(report.totalRefunds)}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right font-black text-red-500 text-sm">
                    -{formatPrice(report.totalExpenses)}
                    <div className="text-[0.6rem] font-bold uppercase opacity-50 mt-0.5">{report.expenseCount} opérations</div>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-blue-500 text-sm">
                    -{formatPrice(report.totalVersements)}
                    <div className="text-[0.6rem] font-bold uppercase opacity-50 mt-0.5">{report.versementCount} reçus</div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className={`px-4 py-1.5 rounded-lg font-black text-sm ${report.balance >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                      {formatPrice(report.balance)}
                    </span>
                  </td>
                </tr>
              ))}
              {cashierReports.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-8 py-10 text-center text-text-muted font-bold italic">
                    Aucune donnée financière disponible pour le moment
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GlobalFinancialReport;
