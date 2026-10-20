import React, { useState, useMemo } from 'react';
import { useT } from '../../i18n/I18nContext';
import { formatPrice } from '../../context/StoreContext';
import { useSales, useStores } from '../../hooks';
import { Table, Toolbar, SearchInput, Select } from '../ui';
import { 
  AlertOutlined, 
  EyeOutlined, 
  PrinterOutlined, 
  WarningOutlined, 
  ShopOutlined, 
  UserOutlined, 
  FileTextOutlined,
  CalendarOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { Tag, Button, Modal, Tooltip } from 'antd';
import InvoicePrintTemplate from '../cashier/InvoicePrintTemplate';

const BelowMinPriceSurveillance = () => {
  const t = useT();
  const { allSales } = useSales();
  const { stores } = useStores();

  const [search, setSearch] = useState('');
  const [filterStore, setFilterStore] = useState('Tous');
  const [selectedSale, setSelectedSale] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Extract all sales containing items sold below minimum price
  const belowMinSales = useMemo(() => {
    const list = [];

    (allSales || []).forEach(sale => {
      if (sale.status === 'cancelled' || sale.type === 'return') return;

      const belowMinItems = (sale.items || []).filter(item => {
        // Look for minPrice, fallback to item.price if non-inventory/flexible or not set
        const minP = item.minPrice !== undefined && item.minPrice !== null ? item.minPrice : item.price;
        // Check if unit price sold is strictly less than minPrice
        return minP > 0 && item.price < minP;
      });

      if (belowMinItems.length > 0) {
        // Calculate total loss or gap from minimum price
        const totalGap = belowMinItems.reduce((acc, item) => {
          const minP = item.minPrice !== undefined && item.minPrice !== null ? item.minPrice : item.price;
          return acc + ((minP - item.price) * item.quantity);
        }, 0);

        list.push({
          ...sale,
          belowMinItems,
          belowMinCount: belowMinItems.length,
          totalGap
        });
      }
    });

    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [allSales]);

  // Apply filters
  const filteredSales = useMemo(() => {
    return belowMinSales.filter(sale => {
      const q = search.toLowerCase().trim();
      const matchSearch = !q || 
        (sale.invoiceNumber && sale.invoiceNumber.toLowerCase().includes(q)) ||
        (sale.customerName && sale.customerName.toLowerCase().includes(q)) ||
        (sale.cashier && sale.cashier.toLowerCase().includes(q)) ||
        sale.belowMinItems.some(item => (item.name || '').toLowerCase().includes(q));

      const saleStoreStr = String(sale.storeId || '');
      const matchStore = filterStore === 'Tous' || saleStoreStr === String(filterStore);

      return matchSearch && matchStore;
    });
  }, [belowMinSales, search, filterStore]);

  // Total gap across filtered results
  const totalDifference = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.totalGap, 0);
  }, [filteredSales]);

  const columns = [
    {
      key: 'invoiceNumber',
      title: 'Facture',
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-black text-primary text-sm">{val || `#${row.id}`}</span>
          <span className="text-[0.68rem] text-text-muted flex items-center gap-1">
            <CalendarOutlined style={{ fontSize: 10 }} />
            {new Date(row.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(row.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )
    },
    {
      key: 'cashier',
      title: 'Caissier',
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-bold text-text-heading text-xs flex items-center gap-1">
            <UserOutlined style={{ fontSize: 10 }} className="text-primary/70" />
            {val || 'Caissier'}
          </span>
          {row.storeId && (
            <span className="text-[0.65rem] text-text-muted opacity-80 flex items-center gap-1">
              <ShopOutlined style={{ fontSize: 9 }} />
              {stores.find(s => String(s.id) === String(row.storeId))?.name || 'Magasin'}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'customer',
      title: 'Client',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-text-heading">{row.customerName || 'Client standard'}</span>
          {row.customerPhone && <span className="text-[0.65rem] text-text-muted">{row.customerPhone}</span>}
        </div>
      )
    },
    {
      key: 'items',
      title: 'Articles Vendus Sous Prix Min.',
      render: (_, row) => (
        <div className="space-y-1.5 py-1">
          {row.belowMinItems.map((item, idx) => {
            const minP = item.minPrice !== undefined && item.minPrice !== null ? item.minPrice : item.price;
            const diffPerUnit = minP - item.price;
            return (
              <div key={idx} className="flex flex-wrap items-center gap-2 text-xs bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
                <span className="font-bold text-text-heading">{item.name}</span>
                <span className="text-[0.7rem] text-text-muted">(Qté: {item.quantity})</span>
                <span className="text-text-muted text-[0.7rem] line-through">Min: {formatPrice(minP)}</span>
                <span className="font-black text-amber-600 dark:text-amber-400">Vendu: {formatPrice(item.price)}</span>
                <Tag color="orange" className="font-bold text-[0.65rem] m-0">
                  -{formatPrice(diffPerUnit * item.quantity)}
                </Tag>
              </div>
            );
          })}
        </div>
      )
    },
    {
      key: 'totalGap',
      title: 'Écart Total (Rabais)',
      align: 'right',
      render: (val) => (
        <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
          -{formatPrice(val)}
        </span>
      )
    },
    {
      key: 'total',
      title: 'Total Facture',
      align: 'right',
      render: (val) => <span className="font-black text-primary text-sm">{formatPrice(val)}</span>
    },
    {
      key: 'actions',
      title: 'Actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="text"
            icon={<PrinterOutlined style={{ fontSize: 14 }} />}
            title="Imprimer la facture"
            onClick={() => {
              setSelectedSale(row);
              setIsPrintModalOpen(true);
            }}
          />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Banner / Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 border border-amber-500/20 bg-amber-500/5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <WarningOutlined style={{ fontSize: 24 }} />
          </div>
          <div>
            <div className="text-[0.7rem] font-bold text-text-muted uppercase tracking-wider">Factures Concernées</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{filteredSales.length}</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 border border-red-500/20 bg-red-500/5">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
            <ArrowDownOutlined style={{ fontSize: 24 }} />
          </div>
          <div>
            <div className="text-[0.7rem] font-bold text-text-muted uppercase tracking-wider">Écart Total Sous Prix Min.</div>
            <div className="text-2xl font-black text-red-600 dark:text-red-400">{formatPrice(totalDifference)}</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 border border-primary/20 bg-primary/5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <AlertOutlined style={{ fontSize: 24 }} />
          </div>
          <div>
            <div className="text-[0.7rem] font-bold text-text-muted uppercase tracking-wider">Statut Contrôle</div>
            <div className="text-xs font-bold text-text-heading mt-1">
              Surveillance temps réel des prix négociés ou réduits
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar filters */}
      <Toolbar
        right={
          <span className="text-xs text-text-muted tabular-nums font-semibold">
            {filteredSales.length} facture(s) trouvée(s)
          </span>
        }
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher facture, client, caissier, article..."
          width={320}
        />
        {stores.length > 1 && (
          <Select
            value={filterStore}
            onChange={setFilterStore}
            options={[
              { value: 'Tous', label: 'Tous les magasins' },
              ...stores.map(s => ({ value: s.id, label: s.name }))
            ]}
            width={180}
          />
        )}
      </Toolbar>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-black/5 dark:border-white/5">
        <Table
          columns={columns}
          data={filteredSales}
          emptyText="Aucune facture avec prix inférieur au prix minimum."
        />
      </div>

      {/* Print Modal */}
      {isPrintModalOpen && selectedSale && (
        <Modal
          title={`Facture N° ${selectedSale.invoiceNumber || selectedSale.id}`}
          open={isPrintModalOpen}
          onCancel={() => {
            setIsPrintModalOpen(false);
            setSelectedSale(null);
          }}
          footer={[
            <Button key="close" onClick={() => {
              setIsPrintModalOpen(false);
              setSelectedSale(null);
            }}>
              Fermer
            </Button>,
            <Button
              key="print"
              type="primary"
              icon={<PrinterOutlined />}
              onClick={() => window.print()}
            >
              Imprimer
            </Button>
          ]}
          width={800}
        >
          <div className="p-4 bg-white text-black rounded-xl">
            <InvoicePrintTemplate sale={selectedSale} />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BelowMinPriceSurveillance;
