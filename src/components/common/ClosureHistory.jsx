import { useT } from '../../i18n/I18nContext';
import { Table } from '../ui';
import DateField from './DateField';
import React, { useMemo, useState } from 'react';
import { formatPrice } from '../../context/StoreContext';
import { useSales } from '../../hooks';
import { useAuth } from '../../context/AuthContext';
import { CalendarOutlined, CheckCircleOutlined, FileTextOutlined, HistoryOutlined, MinusCircleOutlined, PrinterOutlined, RiseOutlined, SearchOutlined, UpCircleOutlined, UserOutlined, WalletOutlined } from '@ant-design/icons';
import { useStore } from '../../context/StoreContext';

const ClosureHistory = () => {
  const t = useT();
  const { cashReports = [] } = useSales();
  const { activeStoreId, stores } = useStore();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  console.log('DEBUG ClosureHistory:', { cashReports, activeStoreId, role: currentUser?.role });

  // Filtrage selon le rôle, la recherche, le magasin actif et la plage de dates
  const filteredReports = useMemo(() => {
    let result = [...cashReports];
    
    const role = currentUser?.role;
    const isGlobalRole = ['ceo', 'admin', 'manager', 'accountant'].includes(role);

    if (!isGlobalRole) {
      // Pour le caissier, uniquement ses propres bilans et pour le magasin actif
      result = result.filter(r => r.cashier === currentUser?.name && String(r.storeId) === String(activeStoreId));
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(r => new Date(r.date) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(r => new Date(r.date) <= end);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.cashier?.toLowerCase().includes(term) || 
        r.invoiceRange?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [cashReports, currentUser, searchTerm]);

  const columns = [
    { 
      key: 'date', 
      title: t('s.date_heure'), 
      render: (val) => (
        <div className="flex flex-col">
          <span className="font-bold text-text-heading">{new Date(val).toLocaleDateString('fr-FR')}</span>
          <span className="text-[0.65rem] text-text-muted font-medium">{new Date(val).toLocaleTimeString('fr-FR')}</span>
        </div>
      ),
      sorter: (a, b) => new Date(a.date) - new Date(b.date)
    },
    { 
      key: 'cashier', 
      title: t('s.caissier'), 
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <UserOutlined style={{ fontSize: 12 }} />
          </div>
          <span className="text-[0.8rem] font-bold text-text-secondary">{val}</span>
        </div>
      ),
      sorter: (a, b) => (a.cashier || '').localeCompare(b.cashier || '')
    },
    {
      key: 'storeName',
      title: t('s.magasin'),
      render: (_, row) => {
        const store = stores.find(s => String(s.id) === String(row.storeId));
        return <span className="text-[0.7rem] font-bold text-text-muted">{store?.name || 'Inconnu'}</span>;
      }
    },
    { 
      key: 'initialFund', 
      title: t('s.fond_initial'), 
      render: (val) => <span className="text-[0.8rem] font-medium text-text-muted">{formatPrice(val)}</span> 
    },
    { 
      key: 'cashSales', 
      title: 'Recettes Esp.', 
      render: (val) => <span className="text-[0.8rem] font-semibold text-emerald-500">+{formatPrice(val)}</span> 
    },
    { 
      key: 'totalExpenses', 
      title: t('s.depenses'), 
      render: (val) => <span className="text-[0.8rem] font-bold text-red-500">-{formatPrice(val)}</span> 
    },
    { 
      key: 'totalVersements', 
      title: t('s.versements'), 
      render: (val) => <span className="text-[0.8rem] font-bold text-red-500">-{formatPrice(val)}</span> 
    },
    { 
      key: 'finalBalance', 
      title: t('s.solde_final'), 
      render: (val) => (
        <div className="bg-primary/10 px-3 py-1 rounded-lg">
          <span className="text-[0.85rem] font-semibold text-primary">{formatPrice(val)}</span>
        </div>
      ),
      sorter: (a, b) => a.finalBalance - b.finalBalance
    },
    { 
      key: 'invoiceRange',
      title: 'Plage Factures',
      render: (val) => <span className="text-[0.65rem] font-bold text-text-muted uppercase">{val || 'N/A'}</span>
    },
    {
      key: 'actions',
      title: '',
      render: (val, row) => (
        <button 
          onClick={() => handlePrint(row)}
          className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 transition-all rounded-lg"
          title={t('s.reimprimer_ce_bilan')}
        >
          <PrinterOutlined style={{ fontSize: 16 }} />
        </button>
      )
    }
  ];

  const [reportToPrint, setReportToPrint] = useState(null);

  const handlePrint = (report) => {
    setReportToPrint(report);
    // On laisse le temps au DOM de se mettre à jour avec la vue d'impression avant de lancer la fenêtre
    setTimeout(() => {
      window.print();
      // Optionnel : on efface après impression, bien que le hidden print:block fasse le travail
      setTimeout(() => setReportToPrint(null), 1000);
    }, 100);
  };

  return (
    <>
      <div className={`space-y-6 animate-fade-in pb-10 ${reportToPrint ? 'print:hidden' : ''}`}>
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center justify-between mb-5">
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <DateField value={startDate} onChange={setStartDate} placeholder={t('s.du')} />
                <span className="text-text-muted text-[0.78rem]">à</span>
                <DateField value={endDate} onChange={setEndDate} placeholder={t('s.au')} />
              </div>
              <div className="relative w-full sm:w-72">
                <SearchOutlined style={{ fontSize: 18 }} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text"
                  placeholder={t('s.rechercher_un_caissier')}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl pl-12 pr-4 py-3 text-[0.85rem] text-text-heading focus:outline-none focus:border-primary/50 transition-all font-bold"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Table 
            columns={columns} 
            data={filteredReports} 
          />

          {filteredReports.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted/30">
                <FileTextOutlined style={{ fontSize: 32 }} />
              </div>
              <p className="text-text-muted font-bold">{t('s.aucun_bilan_de_caisse_enregistre_pour_le_mom')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Vue d'impression du Bilan Historique */}
      {reportToPrint && (
        <div className="hidden print:block text-black p-5">
          <div className="text-center mb-10">
            <h1 className="text-xl font-bold uppercase tracking-tighter mb-2 border-b-2 border-black inline-block pb-2">{t('s.bilan_financier_copie')}</h1>
            <div className="flex justify-between items-end mt-6">
              <div className="text-left">
                <p className="text-sm font-bold uppercase tracking-widest text-gray-500">{t('s.date_et_heure_de_cloture')}</p>
                <p className="text-xl font-black">{new Date(reportToPrint.date).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold uppercase tracking-widest text-gray-500">{t('s.caissier_responsable')}</p>
                <p className="text-xl font-black uppercase">{reportToPrint.cashier}</p>
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto border-2 border-black rounded-xl p-10 bg-white">
            <h3 className="text-lg font-bold tracking-tight mb-5 text-center">{t('s.etat_de_la_caisse')}</h3>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center text-lg border-b border-gray-300 pb-4">
                <span className="font-bold text-gray-600">{t('s.fond_initial')}</span>
                <span className="font-bold">{formatPrice(reportToPrint.initialFund)}</span>
              </div>
              <div className="flex justify-between items-center text-lg border-b border-gray-300 pb-4">
                <span className="font-black text-gray-800">{t('s.recettes_especes_mixte')}</span>
                <span className="font-black text-emerald-600">+{formatPrice(reportToPrint.cashSales)}</span>
              </div>

              {reportToPrint.expensesList && reportToPrint.expensesList.length > 0 ? (
                <div className="border-b border-gray-300 pb-4">
                  <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">{t('s.detail_des_depenses')}</div>
                  {reportToPrint.expensesList.map(exp => (
                    <div key={exp.id} className="flex justify-between items-center text-base py-1">
                      <span className="font-bold text-gray-700">- {exp.label}</span>
                      <span className="font-bold text-red-600">-{formatPrice(exp.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-lg mt-2 pt-2 border-t border-dashed border-gray-300">
                    <span className="font-bold text-gray-600">{t('s.total_depenses')}</span>
                    <span className="font-bold text-red-600">-{formatPrice(reportToPrint.totalExpenses)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center text-lg border-b border-gray-300 pb-4">
                  <span className="font-bold text-gray-600">{t('s.depenses')}</span>
                  <span className="font-bold text-gray-400">0 FCFA</span>
                </div>
              )}

              <div className="flex justify-between items-center text-lg border-b border-gray-300 pb-4">
                <span className="font-bold text-gray-600">{t('s.versements_cumules')}</span>
                <span className="font-bold text-red-600">-{formatPrice(reportToPrint.totalVersements)}</span>
              </div>
              
              <div className="pt-8 text-center">
                <div className="text-gray-500 text-sm font-semibold uppercase tracking-widest mb-2">{t('s.solde_de_cloture')}</div>
                <div className="text-5xl font-black tracking-tighter bg-gray-100 inline-block px-10 py-4 rounded-2xl border-2 border-gray-300">
                  {formatPrice(reportToPrint.finalBalance)}
                </div>
              </div>
            </div>

            <div className="mt-12">
              <h4 className="text-lg font-black uppercase tracking-widest text-center mb-4 border-b border-gray-200 pb-2">{t('s.detail_des_factures_incluses_2')}</h4>
              {reportToPrint.invoicesList && reportToPrint.invoicesList.length > 0 ? (
                <table className="w-full text-left border-collapse mt-4">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 border border-gray-300 text-sm font-bold uppercase tracking-widest">{t('s.n_facture')}</th>
                      <th className="px-4 py-2 border border-gray-300 text-sm font-bold uppercase tracking-widest text-right">{t('s.montant_pris_en_compte')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportToPrint.invoicesList.map(inv => (
                      <tr key={inv.number}>
                        <td className="px-4 py-2 border border-gray-300 font-bold">{inv.number}</td>
                        <td className="px-4 py-2 border border-gray-300 text-right font-black">{formatPrice(inv.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-gray-500 text-sm font-bold mt-4">
                  {t('s.aucun_detail_de_factures_disponible_pour_cet')}
                </p>
              )}
              <div className="mt-4 text-center text-sm font-bold text-gray-500 pt-6 border-t border-gray-200">
                Plage de factures couverte : <span className="text-black">{reportToPrint.invoiceRange || 'Non spécifiée'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClosureHistory;
