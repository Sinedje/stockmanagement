import React, { useState, useMemo } from 'react';
import { formatPrice } from '../../context/StoreContext';
import { useSales, useStores, useUsers } from '../../hooks';
import { FileText, Download, Filter, Search, Calendar as CalendarIcon, Store, User, Package, Printer } from 'lucide-react';
import { Button, Select, DatePicker, ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

const { RangePicker } = DatePicker;

const ReleaseNotes = () => {
  const { allSales = [] } = useSales();
  const { stores = [] } = useStores();
  const { users = [] } = useUsers();
  const [dateRange, setDateRange] = useState([dayjs().startOf('day'), dayjs().endOf('day')]);
  const [selectedStore, setSelectedStore] = useState('all');
  const [selectedCashier, setSelectedCashier] = useState('all');
  const [releaseType, setReleaseType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const releaseNotes = useMemo(() => {
    if (!Array.isArray(allSales)) return [];
    
    const notes = [];
    
    allSales.forEach(sale => {
      // Ne prendre en compte que les factures avec des articles livrés ou partiellement livrés
      const deliveredItems = sale.items?.filter(item => item.isDelivered || item.quantityDelivered > 0) || [];
      if (deliveredItems.length === 0) return;

      // Find the true store of the cashier, fallback to sale.storeId
      const cashierUser = users.find(u => u.name === sale.cashier);
      const trueSaleStoreId = cashierUser?.storeId || sale.storeId;
      
      // Grouper les articles livrés par magasin d'origine (item.storeId)
      const itemsByStore = {};
      deliveredItems.forEach(item => {
        const sId = item.storeId || trueSaleStoreId;
        if (!itemsByStore[sId]) itemsByStore[sId] = [];
        itemsByStore[sId].push(item);
      });
      
      // Créer un bon de sortie distinct pour chaque magasin
      Object.keys(itemsByStore).forEach(storeIdStr => {
        const storeId = parseInt(storeIdStr);
        const storeItems = itemsByStore[storeId];
        
        const noteTotal = storeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const type = storeId === trueSaleStoreId ? 'local' : 'inter_store';
        
        // Statut de livraison spécifique à ce bon de sortie
        const isNoteFullyDelivered = storeItems.every(item => item.isDelivered || (item.quantityDelivered && item.quantityDelivered >= item.quantity));
        const noteDeliveryStatus = isNoteFullyDelivered ? 'delivered' : 'partially_delivered';
        
        notes.push({
          ...sale,
          id: `${sale.id}-${storeId}`,
          originalSaleId: sale.id,
          storeId: trueSaleStoreId, // Override with true store ID
          releaseStoreId: storeId,
          releaseType: type,
          items: storeItems,
          total: noteTotal,
          noteDeliveryStatus
        });
      });
    });
    
    return notes;
  }, [allSales, users]);

  const filteredNotes = useMemo(() => {
    let result = [...releaseNotes];
    
    // Filter by Date Range
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf('day').toDate();
      const end = dateRange[1].endOf('day').toDate();
      result = result.filter(n => {
        const d = new Date(n.date);
        return d >= start && d <= end;
      });
    }

    // Filter by Type
    if (releaseType !== 'all') {
      result = result.filter(n => n.releaseType === releaseType);
    }

    // Filter by Store (using releaseStoreId instead of sale.storeId)
    if (selectedStore !== 'all') {
      result = result.filter(n => n.releaseStoreId === parseInt(selectedStore));
    }

    // Filter by Cashier
    if (selectedCashier !== 'all') {
      result = result.filter(n => n.cashier === selectedCashier);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(n => 
        (n.invoiceNumber?.toLowerCase().includes(term) || '') ||
        n.items?.some(item => item.name?.toLowerCase().includes(term))
      );
    }

    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [releaseNotes, dateRange, releaseType, selectedStore, selectedCashier, searchTerm]);

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <ConfigProvider locale={frFR}>
      <div className="space-y-6 animate-fade-in pb-10">
        {/* Filters Bar */}
        <div className="bg-bg-card border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-xl flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
              <input 
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl pl-12 pr-6 py-3 text-sm text-text-heading focus:outline-none focus:border-primary/50 font-bold"
                placeholder="Rechercher une facture ou un article..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <RangePicker 
              className="h-11 rounded-xl border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 font-bold"
              value={dateRange}
              onChange={setDateRange}
              placeholder={['Début', 'Fin']}
              format="DD/MM/YYYY"
              presets={[
                { label: 'Aujourd\'hui', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
                { label: 'Cette Semaine', value: [dayjs().startOf('week'), dayjs().endOf('week')] },
                { label: 'Ce Mois', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
              ]}
            />

            <Select 
              value={releaseType}
              onChange={setReleaseType}
              className="h-11 min-w-[160px]"
              options={[
                { value: 'all', label: 'Toutes les sorties' },
                { value: 'local', label: 'Sorties Locales' },
                { value: 'inter_store', label: 'Sorties Inter-Magasins' }
              ]}
            />

            <Select 
              value={selectedStore}
              onChange={setSelectedStore}
              className="h-11 min-w-[160px]"
              options={[
                { value: 'all', label: 'Tous les magasins' },
                ...stores.map(s => ({ value: s.id.toString(), label: s.name }))
              ]}
            />
            <Select 
              value={selectedCashier}
              onChange={setSelectedCashier}
              className="h-11 min-w-[160px]"
              options={[
                { value: 'all', label: 'Tous les caissiers' },
                ...users.filter(u => u.role === 'cashier').map(u => ({ value: u.name, label: u.name }))
              ]}
            />
            <Button 
              type="primary" 
              icon={<Printer size={16} />} 
              onClick={handleExportPDF}
              className="h-11 rounded-xl font-black uppercase tracking-widest text-[0.7rem]"
            >
              Imprimer / PDF
            </Button>
          </div>
        </div>

        {/* Results Table */}
        <div id="release-notes-print-area" className="bg-bg-card border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-8 py-6 border-b border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01]">
          <h3 className="text-lg font-black text-text-heading tracking-tight">Bons de Sortie Marchandises</h3>
          <p className="text-[0.7rem] text-text-muted font-bold uppercase tracking-widest mt-1">Articles facturés et confirmés comme livrés par magasin d'origine</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/[0.02] dark:bg-white/[0.02]">
                <th className="px-8 py-4 text-[0.65rem] font-black text-text-muted uppercase tracking-widest">Dates & Facture</th>
                <th className="px-8 py-4 text-[0.65rem] font-black text-text-muted uppercase tracking-widest">Caissier / Origine</th>
                <th className="px-8 py-4 text-[0.65rem] font-black text-text-muted uppercase tracking-widest">Détails des Articles (Livrés / Total)</th>
                <th className="px-8 py-4 text-[0.65rem] font-black text-text-muted uppercase tracking-widest text-right">Total Sortie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filteredNotes.map(note => (
                <tr key={note.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors group">
                  <td className="px-8 py-6 align-top">
                    <div className="text-sm font-black text-text-heading tracking-tight mb-2">{note.invoiceNumber || 'N/A'}</div>
                    <div className="space-y-1">
                      <div className="text-[0.65rem] font-bold text-text-secondary">
                        Facturé : <span className="text-text-muted opacity-80">{note.date ? new Date(note.date).toLocaleString('fr-FR', {dateStyle: 'short', timeStyle: 'short'}) : 'Date inconnue'}</span>
                      </div>
                      <div className="text-[0.65rem] font-bold text-text-secondary">
                        Statut : <span className={note.noteDeliveryStatus === 'delivered' ? "text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-wider" : "text-orange-500 font-black uppercase tracking-wider"}>
                          {note.noteDeliveryStatus === 'delivered' ? 'Livré' : 'Partiel'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 align-top">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={12} className="text-primary" />
                      <span className="text-sm font-bold text-text-heading">{note.cashier}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[0.55rem] font-black uppercase tracking-widest text-text-muted">Caisse :</span>
                        <span className="text-[0.65rem] font-bold text-text-secondary">{stores.find(s => s.id === note.storeId)?.name || 'Magasin'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[0.55rem] font-black uppercase tracking-widest text-text-muted">Origine :</span>
                        <span className={`text-[0.65rem] font-black uppercase tracking-wider ${note.releaseType === 'inter_store' ? 'text-orange-500' : 'text-primary'}`}>
                          {stores.find(s => s.id === note.releaseStoreId)?.name || 'Magasin'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1.5">
                      {note.items.map((item, idx) => {
                        const qtyDelivered = item.isDelivered ? item.quantity : (item.quantityDelivered || 0);
                        const isFullyDelivered = qtyDelivered >= item.quantity;
                        
                        return (
                          <div key={idx} className="flex flex-wrap items-center gap-3 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg">
                            <Package size={12} className="text-text-muted" />
                            <span className="text-[0.75rem] font-black text-text-heading flex-1">{item.name}</span>
                            
                            <div className="flex gap-2">
                              {isFullyDelivered ? (
                                <span className="text-[0.65rem] font-black px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md whitespace-nowrap">
                                  {qtyDelivered} / {item.quantity} Livré
                                </span>
                              ) : (
                                <span className="text-[0.65rem] font-black px-2 py-0.5 bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-md whitespace-nowrap">
                                  {qtyDelivered} / {item.quantity} Livré
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right align-top">
                    <div className="text-base font-black text-text-heading">{formatPrice(note.total)}</div>
                    <div className="text-[0.6rem] font-bold text-text-muted uppercase tracking-widest opacity-50 mt-1">
                      {note.paymentMethod}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredNotes.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <FileText size={48} />
                      <span className="text-sm font-bold italic">Aucun bon de sortie livré trouvé pour ces critères</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 10mm; size: auto; }
          
          /* Tout cacher par défaut */
          body * { visibility: hidden !important; }
          
          /* Afficher seulement la zone d'impression et ses descendants */
          #release-notes-print-area, #release-notes-print-area * { 
            visibility: visible !important; 
          }
          
          /* Forcer les couleurs en noir sur blanc pour éviter le texte blanc sur fond blanc */
          #release-notes-print-area, 
          #release-notes-print-area .text-text-heading, 
          #release-notes-print-area .text-text-primary, 
          #release-notes-print-area .text-text-secondary,
          #release-notes-print-area div,
          #release-notes-print-area span,
          #release-notes-print-area table,
          #release-notes-print-area th,
          #release-notes-print-area td {
            color: black !important;
            background-color: transparent !important;
          }
          
          #release-notes-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            background-color: white !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Style du tableau pour l'impression */
          th { border-bottom: 2px solid #333 !important; padding: 12px 8px !important; background: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
          td { border-bottom: 1px solid #ddd !important; padding: 12px 8px !important; }
          
          /* Assurer que les badges de quantité sont visibles */
          .bg-primary\\/20 { 
            background: #eee !important; 
            border: 1px solid #ccc !important;
            -webkit-print-color-adjust: exact;
          }
          
          /* Masquer les éléments interactifs à l'intérieur de la zone si nécessaire */
          .no-print { display: none !important; }
        }
      `}} />
      </div>
    </ConfigProvider>
  );
};

export default ReleaseNotes;
