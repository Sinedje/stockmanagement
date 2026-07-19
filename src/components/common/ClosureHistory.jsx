import React, { useMemo, useState } from 'react';
import { formatPrice } from '../../context/StoreContext';
import { useSales } from '../../hooks';
import { useAuth } from '../../context/AuthContext';
import { History, Calendar, User, Wallet, TrendingUp, MinusCircle, ArrowUpCircle, CheckCircle2, FileText, Search, Printer } from 'lucide-react';
import DataTable from './DataTable';

const ClosureHistory = () => {
  const { cashReports = [] } = useSales();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrage selon le rôle et la recherche
  const filteredReports = useMemo(() => {
    let result = [...cashReports];
    
    if (currentUser?.role !== 'manager' && currentUser?.role !== 'accountant') {
      // Pour le caissier, uniquement ses propres bilans
      result = result.filter(r => r.cashier === currentUser?.name);
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
      title: 'Date & Heure', 
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
      title: 'Caissier', 
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User size={12} />
          </div>
          <span className="text-[0.8rem] font-bold text-text-secondary">{val}</span>
        </div>
      ),
      sorter: (a, b) => (a.cashier || '').localeCompare(b.cashier || '')
    },
    { 
      key: 'initialFund', 
      title: 'Fond Initial', 
      render: (val) => <span className="text-[0.8rem] font-medium text-text-muted">{formatPrice(val)}</span> 
    },
    { 
      key: 'cashSales', 
      title: 'Recettes Esp.', 
      render: (val) => <span className="text-[0.8rem] font-black text-emerald-500">+{formatPrice(val)}</span> 
    },
    { 
      key: 'totalExpenses', 
      title: 'Dépenses', 
      render: (val) => <span className="text-[0.8rem] font-bold text-red-500">-{formatPrice(val)}</span> 
    },
    { 
      key: 'totalVersements', 
      title: 'Versements', 
      render: (val) => <span className="text-[0.8rem] font-bold text-red-500">-{formatPrice(val)}</span> 
    },
    { 
      key: 'finalBalance', 
      title: 'Solde Final', 
      render: (val) => (
        <div className="bg-primary/10 px-3 py-1 rounded-lg">
          <span className="text-[0.85rem] font-black text-primary">{formatPrice(val)}</span>
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
          title="Réimprimer ce bilan"
        >
          <Printer size={16} />
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
        <div className="bg-bg-card border border-black/5 dark:border-white/5 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                <History size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-text-heading tracking-tight">Historique des Bilans de Caisse</h2>
                <p className="text-[0.7rem] text-text-muted font-black uppercase tracking-widest">
                  {currentUser?.role === 'manager' 
                    ? "Consultation de toutes les clôtures effectuées" 
                    : "Consultez vos clôtures journalières passées"
                  }
                </p>
              </div>
            </div>
            
            <div className="relative w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input 
                type="text"
                placeholder="Rechercher un caissier..."
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl pl-12 pr-4 py-3 text-[0.85rem] text-text-heading focus:outline-none focus:border-primary/50 transition-all font-bold"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <DataTable 
            columns={columns} 
            data={filteredReports} 
          />

          {filteredReports.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted/30">
                <FileText size={32} />
              </div>
              <p className="text-text-muted font-bold">Aucun bilan de caisse enregistré pour le moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Vue d'impression du Bilan Historique */}
      {reportToPrint && (
        <div className="hidden print:block text-black p-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 border-b-2 border-black inline-block pb-2">Bilan Financier (Copie)</h1>
            <div className="flex justify-between items-end mt-6">
              <div className="text-left">
                <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Date et Heure de clôture</p>
                <p className="text-xl font-black">{new Date(reportToPrint.date).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Caissier responsable</p>
                <p className="text-xl font-black uppercase">{reportToPrint.cashier}</p>
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto border-2 border-black rounded-3xl p-10 bg-white">
            <h3 className="text-2xl font-black tracking-tight mb-8 text-center">État de la Caisse</h3>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center text-lg border-b border-gray-300 pb-4">
                <span className="font-bold text-gray-600">Fond Initial</span>
                <span className="font-bold">{formatPrice(reportToPrint.initialFund)}</span>
              </div>
              <div className="flex justify-between items-center text-lg border-b border-gray-300 pb-4">
                <span className="font-black text-gray-800">Recettes Espèces / Mixte</span>
                <span className="font-black text-emerald-600">+{formatPrice(reportToPrint.cashSales)}</span>
              </div>

              {reportToPrint.expensesList && reportToPrint.expensesList.length > 0 ? (
                <div className="border-b border-gray-300 pb-4">
                  <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Détail des Dépenses</div>
                  {reportToPrint.expensesList.map(exp => (
                    <div key={exp.id} className="flex justify-between items-center text-base py-1">
                      <span className="font-bold text-gray-700">- {exp.label}</span>
                      <span className="font-bold text-red-600">-{formatPrice(exp.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-lg mt-2 pt-2 border-t border-dashed border-gray-300">
                    <span className="font-bold text-gray-600">Total Dépenses</span>
                    <span className="font-bold text-red-600">-{formatPrice(reportToPrint.totalExpenses)}</span>
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
                <span className="font-bold text-red-600">-{formatPrice(reportToPrint.totalVersements)}</span>
              </div>
              
              <div className="pt-8 text-center">
                <div className="text-gray-500 text-sm font-black uppercase tracking-widest mb-2">SOLDE DE CLÔTURE</div>
                <div className="text-5xl font-black tracking-tighter bg-gray-100 inline-block px-10 py-4 rounded-2xl border-2 border-gray-300">
                  {formatPrice(reportToPrint.finalBalance)}
                </div>
              </div>
            </div>

            <div className="mt-12">
              <h4 className="text-lg font-black uppercase tracking-widest text-center mb-4 border-b border-gray-200 pb-2">Détail des factures incluses</h4>
              {reportToPrint.invoicesList && reportToPrint.invoicesList.length > 0 ? (
                <table className="w-full text-left border-collapse mt-4">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 border border-gray-300 text-sm font-bold uppercase tracking-widest">N° Facture</th>
                      <th className="px-4 py-2 border border-gray-300 text-sm font-bold uppercase tracking-widest text-right">Montant Pris en Compte</th>
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
                  Aucun détail de factures disponible pour cette clôture.
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
