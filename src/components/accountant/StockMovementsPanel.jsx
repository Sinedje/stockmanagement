import { useT } from '../../i18n/I18nContext';
import React, { useState, useMemo } from 'react';
import { formatPrice } from '../../context/StoreContext';
import { useStores, useUsers } from '../../hooks';
import { CalendarOutlined, CarOutlined, DownOutlined, FileTextOutlined, InboxOutlined, SearchOutlined, ShopOutlined, SwapOutlined, UpOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Select, DatePicker, ConfigProvider, Tag } from 'antd';
import frFR from 'antd/locale/fr_FR';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');
const { RangePicker } = DatePicker;

// ─── STOCK ENTRIES TAB ───────────────────────────────────────────────────────
const StockEntriesTab = () => {
  const t = useT();
  const { stockEntries = [], stores = [] } = useStores();
  const [search, setSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    let result = [...stockEntries];

    if (dateRange?.[0] && dateRange?.[1]) {
      const start = dateRange[0].startOf('day').toDate();
      const end = dateRange[1].endOf('day').toDate();
      result = result.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      });
    }
    if (selectedStore !== 'all') {
      result = result.filter(e => e.storeId === parseInt(selectedStore));
    }
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(e =>
        e.reference?.toLowerCase().includes(term) ||
        e.supplier?.toLowerCase().includes(term) ||
        e.noteNumber?.toLowerCase().includes(term) ||
        e.items?.some(i => i.name?.toLowerCase().includes(term))
      );
    }
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [stockEntries, dateRange, selectedStore, search]);

  const totalCost = filtered.reduce((s, e) => s + (e.totalCost || 0), 0);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="glass-panel rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <SearchOutlined style={{ fontSize: 16 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50"
            placeholder={t('s.reference_fournisseur_article')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <ConfigProvider locale={frFR}>
          <RangePicker
            className="h-10 rounded-xl"
            value={dateRange}
            onChange={setDateRange}
            format="DD/MM/YYYY"
            placeholder={['Début', 'Fin']}
          />
        </ConfigProvider>
        <Select
          value={selectedStore}
          onChange={setSelectedStore}
          className="h-10 min-w-[160px]"
          options={[
            { value: 'all', label: t('s.tous_les_magasins') },
            ...stores.map(s => ({ value: s.id.toString(), label: s.name }))
          ]}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
          <div className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest mb-1">{t('s.total_bons')}</div>
          <div className="text-lg font-bold text-primary">{filtered.length}</div>
        </div>
        <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
          <div className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest mb-1">{t('s.cout_total_entrees')}</div>
          <div className="text-lg font-bold text-blue-500">{formatPrice(totalCost)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-xl p-4 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01]">
          <h3 className="text-base font-black text-text-heading">{t('s.entrees_de_stock')}</h3>
          <p className="text-[0.65rem] text-text-muted font-bold uppercase tracking-widest mt-0.5">{t('s.bons_de_livraison_fournisseur_enregistres')}</p>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 opacity-30">
            <CarOutlined style={{ fontSize: 48 }} />
            <span className="text-sm font-bold italic">{t('s.aucune_entree_de_stock_trouvee')}</span>
          </div>
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {filtered.map(entry => (
              <div key={entry.id} className="group">
                <button
                  className="w-full px-6 py-5 flex items-center gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-left"
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <CarOutlined style={{ fontSize: 18 }} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-text-heading">{entry.reference}</span>
                      {entry.noteNumber && (
                        <span className="text-[0.65rem] font-bold bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md text-text-muted">
                          BL: {entry.noteNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[0.72rem] text-text-muted flex-wrap">
                      <span className="flex items-center gap-1"><UserOutlined style={{ fontSize: 11 }} /> {entry.supplier}</span>
                      <span className="flex items-center gap-1"><ShopOutlined style={{ fontSize: 11 }} /> {stores.find(s => s.id === entry.storeId)?.name || 'Magasin'}</span>
                      <span className="flex items-center gap-1"><CalendarOutlined style={{ fontSize: 11 }} /> {new Date(entry.date).toLocaleDateString('fr-FR', { dateStyle: 'short' })}</span>
                      <span className="flex items-center gap-1"><InboxOutlined style={{ fontSize: 11 }} /> {entry.items?.length} article(s)</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-text-heading text-base">{formatPrice(entry.totalCost)}</div>
                    <div className="text-[0.65rem] text-text-muted mt-0.5">{t('s.cout_d_achat')}</div>
                  </div>
                  <div className="text-text-muted ml-2">
                    {expandedId === entry.id ? <UpOutlined style={{ fontSize: 16 }} /> : <DownOutlined style={{ fontSize: 16 }} />}
                  </div>
                </button>

                {expandedId === entry.id && (
                  <div className="px-6 pb-5 bg-black/[0.015] dark:bg-white/[0.015]">
                    <div className="border border-black/5 dark:border-white/5 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-black/5 dark:bg-white/5">
                          <tr>
                            <th className="px-4 py-3 text-left text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest">{t('s.article')}</th>
                            <th className="px-4 py-3 text-center text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest">{t('s.qte')}</th>
                            <th className="px-4 py-3 text-right text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest">{t('s.prix_d_achat_unit')}</th>
                            <th className="px-4 py-3 text-right text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest">{t('s.total_ligne')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                          {entry.items?.map((item, idx) => (
                            <tr key={idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                              <td className="px-4 py-3 font-bold text-text-heading">{item.name}</td>
                              <td className="px-4 py-3 text-center font-black text-primary">{item.quantity}</td>
                              <td className="px-4 py-3 text-right font-bold text-text-primary">{formatPrice(item.cost || 0)}</td>
                              <td className="px-4 py-3 text-right font-black text-text-heading">{formatPrice((item.quantity || 0) * (item.cost || 0))}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-primary/5">
                          <tr>
                            <td colSpan="3" className="px-4 py-3 text-right text-[0.7rem] font-semibold text-text-muted uppercase tracking-widest">{t('s.total_bon')}</td>
                            <td className="px-4 py-3 text-right font-black text-primary text-base">{formatPrice(entry.totalCost)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── TRANSFERS TAB ────────────────────────────────────────────────────────────
const TransfersTab = () => {
  const t = useT();
  const { transfers = [], stores = [] } = useStores();
  const { allCashierProducts = [] } = useUsers();
  const [search, setSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = [...transfers];

    if (dateRange?.[0] && dateRange?.[1]) {
      const start = dateRange[0].startOf('day').toDate();
      const end = dateRange[1].endOf('day').toDate();
      result = result.filter(t => {
        const d = new Date(t.date);
        return d >= start && d <= end;
      });
    }
    if (selectedStore !== 'all') {
      const sid = parseInt(selectedStore);
      result = result.filter(t => t.fromStoreId === sid || t.toStoreId === sid);
    }
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(t =>
        t.reference?.toLowerCase().includes(term) ||
        t.initiatedBy?.toLowerCase().includes(term) ||
        t.items?.some(i => i.name?.toLowerCase().includes(term))
      );
    }
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transfers, dateRange, selectedStore, statusFilter, search]);

  const totalValue = filtered.reduce((sum, t) => {
    return sum + t.items.reduce((s, item) => {
      const product = allCashierProducts.find(p => p.id === item.productId);
      return s + (item.quantity * (product?.cost || 0));
    }, 0);
  }, 0);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="glass-panel rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <SearchOutlined style={{ fontSize: 16 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50"
            placeholder={t('s.reference_expediteur_article')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <ConfigProvider locale={frFR}>
          <RangePicker
            className="h-10 rounded-xl"
            value={dateRange}
            onChange={setDateRange}
            format="DD/MM/YYYY"
            placeholder={['Début', 'Fin']}
          />
        </ConfigProvider>
        <Select
          value={selectedStore}
          onChange={setSelectedStore}
          className="h-10 min-w-[160px]"
          options={[
            { value: 'all', label: t('s.tous_les_magasins') },
            ...stores.map(s => ({ value: s.id.toString(), label: s.name }))
          ]}
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          className="h-10 min-w-[140px]"
          options={[
            { value: 'all', label: t('s.tous_statuts') },
            { value: 'in_transit', label: 'En Transit' },
            { value: 'received', label: t('s.recus') },
          ]}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
          <div className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest mb-1">{t('s.total_transferts')}</div>
          <div className="text-lg font-bold text-primary">{filtered.length}</div>
        </div>
        <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
          <div className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest mb-1">{t('s.valeur_totale_pa')}</div>
          <div className="text-lg font-bold text-purple-500">{formatPrice(totalValue)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-xl p-4 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01]">
          <h3 className="text-base font-black text-text-heading">{t('s.transferts_inter_magasins')}</h3>
          <p className="text-[0.65rem] text-text-muted font-bold uppercase tracking-widest mt-0.5">{t('s.mouvements_de_marchandise_entre_points_de_ve')}</p>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 opacity-30">
            <SwapOutlined style={{ fontSize: 48 }} />
            <span className="text-sm font-bold italic">{t('s.aucun_transfert_trouve')}</span>
          </div>
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {filtered.map(transfer => {
              const itemsValue = transfer.items.reduce((sum, item) => {
                const product = allCashierProducts.find(p => p.id === item.productId);
                return sum + (item.quantity * (product?.cost || 0));
              }, 0);
              const fromStore = stores.find(s => s.id === transfer.fromStoreId);
              const toStore = stores.find(s => s.id === transfer.toStoreId);

              return (
                <div key={transfer.id} className="group">
                  <button
                    className="w-full px-6 py-5 flex items-center gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-left"
                    onClick={() => setExpandedId(expandedId === transfer.id ? null : transfer.id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <SwapOutlined style={{ fontSize: 18 }} className="text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-text-heading">{transfer.reference}</span>
                        <Tag color={transfer.status === 'received' ? 'green' : 'orange'} className="text-[0.65rem] font-semibold uppercase tracking-wider">
                          {transfer.status === 'received' ? 'Reçu' : 'En Transit'}
                        </Tag>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[0.72rem] text-text-muted flex-wrap">
                        <span className="font-bold text-text-primary">{fromStore?.name || '?'}</span>
                        <SwapOutlined style={{ fontSize: 10 }} className="text-primary" />
                        <span className="font-bold text-text-primary">{toStore?.name || '?'}</span>
                        <span className="flex items-center gap-1"><UserOutlined style={{ fontSize: 11 }} /> {transfer.initiatedBy}</span>
                        <span className="flex items-center gap-1"><CalendarOutlined style={{ fontSize: 11 }} /> {new Date(transfer.date).toLocaleDateString('fr-FR', { dateStyle: 'short' })}</span>
                        <span className="flex items-center gap-1"><InboxOutlined style={{ fontSize: 11 }} /> {transfer.items?.length} article(s)</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-black text-text-heading text-base">{formatPrice(itemsValue)}</div>
                      <div className="text-[0.65rem] text-text-muted mt-0.5">{t('s.valeur_pa')}</div>
                    </div>
                    <div className="text-text-muted ml-2">
                      {expandedId === transfer.id ? <UpOutlined style={{ fontSize: 16 }} /> : <DownOutlined style={{ fontSize: 16 }} />}
                    </div>
                  </button>

                  {expandedId === transfer.id && (
                    <div className="px-6 pb-5 bg-black/[0.015] dark:bg-white/[0.015]">
                      {transfer.notes && (
                        <div className="mb-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[0.8rem] text-amber-700 dark:text-amber-400">
                          <strong>{t('s.note')}</strong> {transfer.notes}
                        </div>
                      )}
                      <div className="border border-black/5 dark:border-white/5 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-black/5 dark:bg-white/5">
                            <tr>
                              <th className="px-4 py-3 text-left text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest">{t('s.article')}</th>
                              <th className="px-4 py-3 text-center text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest">{t('s.qte')}</th>
                              <th className="px-4 py-3 text-right text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest">{t('s.prix_d_achat_unit')}</th>
                              <th className="px-4 py-3 text-right text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest">{t('s.valeur_totale')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {transfer.items?.map((item, idx) => {
                              const product = allCashierProducts.find(p => p.id === item.productId);
                              const unitCost = product?.cost || 0;
                              return (
                                <tr key={idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                                  <td className="px-4 py-3 font-bold text-text-heading">{item.name}</td>
                                  <td className="px-4 py-3 text-center font-black text-primary">{item.quantity}</td>
                                  <td className="px-4 py-3 text-right font-bold text-text-primary">{formatPrice(unitCost)}</td>
                                  <td className="px-4 py-3 text-right font-black text-text-heading">{formatPrice(item.quantity * unitCost)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-purple-500/5">
                            <tr>
                              <td colSpan="3" className="px-4 py-3 text-right text-[0.7rem] font-semibold text-text-muted uppercase tracking-widest">{t('s.valeur_totale_pa_2')}</td>
                              <td className="px-4 py-3 text-right font-black text-purple-500 text-base">{formatPrice(itemsValue)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      {transfer.receivedBy && (
                        <div className="mt-3 text-[0.72rem] text-text-muted font-bold">
                          Reçu par : <span className="text-text-primary">{transfer.receivedBy}</span>
                          {transfer.receivedDate && ` — ${new Date(transfer.receivedDate).toLocaleDateString('fr-FR', { dateStyle: 'short' })}`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MAIN PANEL ───────────────────────────────────────────────────────────────
const StockMovementsPanel = () => {
  const t = useT();
  const [tab, setTab] = useState('entries');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1.5 bg-black/5 dark:bg-white/5 rounded-2xl w-fit border border-black/5 dark:border-white/5">
        <button
          onClick={() => setTab('entries')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold uppercase tracking-widest transition-all ${tab === 'entries' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text-primary'}`}
        >
          <CarOutlined style={{ fontSize: 16 }} /> {t('s.entrees_de_stock')}
        </button>
        <button
          onClick={() => setTab('transfers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold uppercase tracking-widest transition-all ${tab === 'transfers' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text-primary'}`}
        >
          <SwapOutlined style={{ fontSize: 16 }} /> {t('s.transferts_inter_magasins')}
        </button>
      </div>

      {tab === 'entries' && <StockEntriesTab />}
      {tab === 'transfers' && <TransfersTab />}
    </div>
  );
};

export default StockMovementsPanel;
