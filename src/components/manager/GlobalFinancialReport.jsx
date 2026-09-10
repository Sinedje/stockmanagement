import { useT } from '../../i18n/I18nContext';
import React, { useMemo } from 'react';
import Pagination from '../common/Pagination';
import { usePagination } from '../../hooks';
import { formatPrice } from '../../context/StoreContext';
import { useSales, useUsers, useStores, useCustomers } from '../../hooks';
import { CalculatorOutlined, CheckCircleOutlined, DropboxOutlined, InboxOutlined, MinusCircleOutlined, PlusCircleOutlined, RiseOutlined, ShopOutlined, UpCircleOutlined, UserOutlined, WalletOutlined } from '@ant-design/icons';

const GlobalFinancialReport = () => {
  const t = useT();
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

      cashierSales.forEach(s => {
        s.items.forEach(item => {
           const itemGross = item.price * item.quantity;
           if (item.isBreakage || item.isRepackaged) breakageSales += itemGross;
          else standardSales += itemGross;
        });
      });

      return {
        ...cashier,
        totalSales,
        standardSales,
        breakageSales,
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
      expenses: acc.expenses + report.totalExpenses,
      versements: acc.versements + report.totalVersements,
      deposits: (acc.deposits || 0) + report.totalDeposits,
      refunds: (acc.refunds || 0) + report.totalRefunds,
      balance: acc.balance + report.balance
    }), { sales: 0, standardSales: 0, breakageSales: 0, expenses: 0, versements: 0, deposits: 0, refunds: 0, balance: 0 });
  }, [cashierReports]);

  // Pagination : le tableau n'affiche que 20 lignes à la fois.
  const { page, setPage, pageCount, total, pageSize, pageItems } = usePagination(cashierReports);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('s.recettes_especes_total'), value: formatPrice(totals.sales), icon: WalletOutlined, color: 'text-emerald-500' },
          { label: 'CA Standard', value: formatPrice(totals.standardSales), icon: RiseOutlined, color: 'text-primary' },
          { label: 'CA Casses', value: formatPrice(totals.breakageSales), icon: DropboxOutlined, color: 'text-orange-500' },
          { label: t('s.depots_clients_total'), value: formatPrice(totals.deposits), icon: PlusCircleOutlined, color: 'text-emerald-400' },
          { label: t('s.remboursements_total'), value: formatPrice(totals.refunds), icon: MinusCircleOutlined, color: 'text-rose-400' },
          { label: t('s.depenses_totales'), value: formatPrice(totals.expenses), icon: MinusCircleOutlined, color: 'text-red-500' },
          { label: t('s.versements_recus'), value: formatPrice(totals.versements), icon: UpCircleOutlined, color: 'text-blue-500' },
          { label: t('s.solde_global'), value: formatPrice(totals.balance), icon: CalculatorOutlined, color: 'text-black' },
        ].map((stat, i) => (
          <div key={i} className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-black/5 dark:bg-white/5 ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <span className="text-[0.6rem] font-semibold text-text-heading uppercase tracking-widest">{t('s.global')}</span>
            </div>
            <div className="text-xl font-black text-text-heading tracking-tight">{stat.value}</div>
            <div className="text-[0.65rem] font-bold text-text-heading uppercase tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Cashiers List */}
      <div className="glass-panel rounded-xl p-4 overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01]">
          <div>
            <h3 className="text-lg font-black text-text-heading tracking-tight">{t('s.etats_de_compte_par_caissier')}</h3>
            <p className="text-[0.7rem] text-text-muted font-bold uppercase tracking-widest mt-1">{t('s.suivi_individuel_des_flux_financiers')}</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/[0.02] dark:bg-white/[0.02]">
                <th className="px-8 py-4 text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest">{t('s.caissier')}</th>
                <th className="px-8 py-4 text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest text-right">{t('s.ventilation_ca_especes')}</th>
                <th className="px-8 py-4 text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest text-right">{t('s.depenses')}</th>
                <th className="px-8 py-4 text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest text-right">{t('s.versements')}</th>
                <th className="px-8 py-4 text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest text-right">{t('s.solde_actuel')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {pageItems.map(report => (
                <tr key={report.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                        {report.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-heading tracking-tight">{report.name}</div>
                        <div className="flex items-center gap-1.5 opacity-50">
                          <ShopOutlined style={{ fontSize: 10 }} />
                          <span className="text-[0.65rem] font-bold uppercase tracking-wider">{report.storeName}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right font-semibold text-text-heading text-sm">
                    <div>{formatPrice(report.totalSales)}</div>
                    <div className="text-[0.55rem] font-bold text-text-muted uppercase mt-1">
                      Std: {formatPrice(report.standardSales)} | Casses: {formatPrice(report.breakageSales)}
                    </div>
                    {(report.totalDeposits > 0 || report.totalRefunds > 0) && (
                      <div className="text-[0.55rem] font-bold text-emerald-600 dark:text-emerald-500 uppercase mt-0.5">
                        Dépôts: +{formatPrice(report.totalDeposits)} | Remb: -{formatPrice(report.totalRefunds)}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right font-semibold text-red-500 text-sm">
                    -{formatPrice(report.totalExpenses)}
                    <div className="text-[0.6rem] font-bold uppercase opacity-50 mt-0.5">{report.expenseCount} opérations</div>
                  </td>
                  <td className="px-8 py-5 text-right font-semibold text-blue-500 text-sm">
                    -{formatPrice(report.totalVersements)}
                    <div className="text-[0.6rem] font-bold uppercase opacity-50 mt-0.5">{report.versementCount} reçus</div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className={`px-4 py-1.5 rounded-lg font-semibold text-sm ${report.balance >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                      {formatPrice(report.balance)}
                    </span>
                  </td>
                </tr>
              ))}
              {cashierReports.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-8 py-10 text-center text-text-muted font-bold italic">
                    {t('s.aucune_donnee_financiere_disponible_pour_le_')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} label="caissiers" />
        </div>
      </div>
    </div>
  );
};

export default GlobalFinancialReport;
