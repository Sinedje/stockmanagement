import { useT } from '../../i18n/I18nContext';
import { Table } from '../ui';
import Modal from '../common/Modal';
import React, { useState, useMemo } from 'react';
import { formatPrice } from '../../context/StoreContext';
import { useSales, useStores } from '../../hooks';
import { useAuth } from '../../context/AuthContext';
import { CarOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, InboxOutlined, SearchOutlined, ShopOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Tag, InputNumber, message } from 'antd';

const DeliveriesPanel = () => {
  const t = useT();
  const { allSales, deliverPartial } = useSales();
  const { stores } = useStores();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [deliveryQtys, setDeliveryQtys] = useState({});

  // Sales that have at least one item from this storekeeper's store
  const myStoreSales = useMemo(() => {
    return allSales.filter(s =>
      s.status !== 'cancelled' && s.items.some(i => i.storeId === currentUser?.storeId)
    );
  }, [allSales, currentUser]);

  const pendingDeliveries = myStoreSales.filter(s =>
    s.items.some(i => i.storeId === currentUser?.storeId && !i.isDelivered)
  );
  const partialSales = myStoreSales.filter(s => s.deliveryStatus === 'partially_delivered');
  const deliveredHistory = myStoreSales.filter(s =>
    s.items.every(i => i.storeId !== currentUser?.storeId || i.isDelivered)
  );

  const filteredPending = pendingDeliveries.filter(s =>
    s.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.cashier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open delivery modal pre-filled with remaining quantities
  const openDeliveryModal = (sale) => {
    setSelectedSale(sale);
    const initQtys = {};
    sale.items
      .filter(i => i.storeId === currentUser?.storeId && !i.isDelivered)
      .forEach(item => {
        const alreadyDelivered = item.quantityDelivered ?? 0;
        initQtys[item.productId] = item.quantity - alreadyDelivered;
      });
    setDeliveryQtys(initQtys);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedSale(null);
    setDeliveryQtys({});
  };

  const handleSubmitDelivery = () => {
    if (!selectedSale) return;
    const deliveries = Object.entries(deliveryQtys)
      .filter(([, qty]) => qty > 0)
      .map(([productId, qtyNow]) => ({ productId: parseInt(productId), qtyNow }));

    if (deliveries.length === 0) {
      message.warning('Veuillez saisir au moins une quantité supérieure à 0.');
      return;
    }
    
    // Afficher un message de chargement
    const hideLoading = message.loading('Enregistrement de la sortie en cours...', 0);
    
    try {
      deliverPartial(selectedSale.id, currentUser?.storeId, deliveries);
      hideLoading();
      message.success('Sortie de stock enregistrée avec succès !');
      closeModal();
    } catch (error) {
      hideLoading();
      message.error('Erreur lors de la sortie : ' + error.message);
    }
  };

  const columns = [
    {
      key: 'invoiceNumber', title: t('s.facture'),
      render: (val) => <span className="font-black text-primary">#{val}</span>
    },
    {
      key: 'date', title: t('s.date'),
      render: (val) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-text-heading">{new Date(val).toLocaleDateString()}</span>
          <span className="text-[0.65rem] opacity-50">{new Date(val).toLocaleTimeString()}</span>
        </div>
      )
    },
    {
      key: 'cashier', title: t('s.caissier'),
      render: (val) => (
        <div className="flex items-center gap-2">
          <UserOutlined style={{ fontSize: 12 }} className="text-text-muted" />
          <span className="text-sm font-medium">{val}</span>
        </div>
      )
    },
    {
      key: 'customer', title: t('s.client'),
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-text-heading">{row.customerName || 'Passager'}</span>
          {row.customerPhone && <span className="text-[0.65rem] opacity-70">{row.customerPhone}</span>}
        </div>
      )
    },
    {
      key: 'items', title: t('s.articles_votre_magasin'),
      render: (val) => (
        <div className="space-y-1.5">
          {val.filter(i => i.storeId === currentUser?.storeId).map((item, idx) => {
            const delivered = item.quantityDelivered ?? 0;
            const remaining = item.quantity - delivered;
            const progress = item.quantity > 0 ? Math.round((delivered / item.quantity) * 100) : 0;
            return (
              <div key={idx} className="flex flex-col gap-1 bg-white/5 px-2 py-1.5 rounded-lg">
                <div className="flex items-center justify-between gap-2 text-[0.7rem]">
                  <div className="flex items-center gap-2">
                    <InboxOutlined style={{ fontSize: 10 }} className={item.isDelivered ? 'text-green-500' : 'text-primary'} />
                    <span className="font-semibold text-text-heading truncate max-w-[140px]">{item.name}</span>
                  </div>
                  <span className={`font-semibold text-xs tabular-nums ${item.isDelivered ? 'text-green-500' : remaining > 0 ? 'text-orange-400' : 'text-green-500'}`}>
                    {delivered}/{item.quantity}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-white/10 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${progress >= 100 ? 'bg-green-500' : progress > 0 ? 'bg-orange-400' : 'bg-primary/40'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )
    },
    {
      key: 'deliveryStatus', title: t('s.etat'),
      render: (val) => (
        <Tag
          color={val === 'delivered' ? 'success' : val === 'partially_delivered' ? 'warning' : 'processing'}
          className="border-none font-bold py-0.5 px-2 text-xs"
        >
          {val === 'delivered' ? 'LIVRÉ' : val === 'partially_delivered' ? 'PARTIEL 🟡' : 'EN ATTENTE'}
        </Tag>
      )
    },
    {
      key: 'action', title: t('s.action'), align: 'right',
      render: (_, row) => {
        const myItems = row.items.filter(i => i.storeId === currentUser?.storeId);
        const allDone = myItems.every(i => i.isDelivered);
        
        const isBlocked = (row.paymentStatus === 'unpaid' || row.paymentStatus === 'partial') && !row.deliveryUnlocked;

        if (allDone) {
          return (
            <Tag color="success" icon={<CheckCircleOutlined style={{ fontSize: 12 }} />} className="border-none font-bold py-1 px-3">
              {t('s.termine')}
            </Tag>
          );
        }

        if (isBlocked) {
          return (
            <Tag color={row.paymentStatus === 'unpaid' ? 'error' : 'warning'} className="border-none font-bold py-1 px-3 whitespace-nowrap">
              {row.paymentStatus === 'unpaid' ? 'IMPAYÉE — BLOQUÉ' : `⚠ RESTE ${formatPrice(row.amountDue)} — BLOQUÉ`}
            </Tag>
          );
        }

        return (
          <Button type="primary" icon={<CarOutlined style={{ fontSize: 14 }} />} className="bg-green-500 hover:bg-green-600 border-none" onClick={() => openDeliveryModal(row)} >
            {t('s.enregistrer_sortie')}
          </Button>
        );
      }
    },
  ];

  const storeName = stores.find(s => s.id === currentUser?.storeId)?.name || 'Inconnu';

  return (
    <div className="animate-fade-in space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-xl p-4 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <ClockCircleOutlined style={{ fontSize: 28 }} />
          </div>
          <div>
            <div className="text-xl font-bold text-text-heading tracking-tighter">{pendingDeliveries.length}</div>
            <div className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest">{t('s.en_attente_2')}</div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400">
            <ExclamationCircleOutlined style={{ fontSize: 28 }} />
          </div>
          <div>
            <div className="text-xl font-bold text-orange-400 tracking-tighter">{partialSales.length}</div>
            <div className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest">{t('s.partiellement_livrees')}</div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
            <CheckCircleOutlined style={{ fontSize: 28 }} />
          </div>
          <div>
            <div className="text-xl font-bold text-text-heading tracking-tighter">{deliveredHistory.length}</div>
            <div className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest">{t('s.totalement_livrees_2')}</div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <ShopOutlined style={{ fontSize: 28 }} />
          </div>
          <div>
            <div className="text-lg font-black text-text-heading tracking-tighter">{storeName}</div>
            <div className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest">{t('s.votre_magasin')}</div>
          </div>
        </div>
      </div>

      {/* Pending Table */}
      <div className="glass-panel rounded-xl p-4 overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-black text-text-heading tracking-tight">{t('s.livraisons_a_traiter')}</h3>
            <p className="text-text-muted text-sm mt-1">
              {t('s.saisissez_les_quantites_sorties_physiquement')}
            </p>
          </div>
          <div className="relative w-full md:w-64">
            <SearchOutlined style={{ fontSize: 16 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder={t('s.rechercher_facture')}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Table
          columns={columns}
          data={filteredPending}
          emptyIcon={CarOutlined}
          emptyTitle={t('s.tout_est_livre')}
          emptyDescription={t('s.il_n_y_a_aucune_commande_en_attente_de_sorti')}
        />
      </div>

      {/* History */}
      <div className="glass-panel rounded-xl p-4 overflow-hidden shadow-sm opacity-80">
        <div className="px-8 py-5 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-base font-black text-text-heading tracking-tight">{t('s.historique_recent_livrees')}</h3>
        </div>
        <Table
          columns={columns.map(col => col.key === 'action' ? { ...col, title: t('s.etat_final') } : col)}
          data={deliveredHistory.slice(0, 5)}
          emptyIcon={InboxOutlined}
          emptyTitle={t('s.aucun_historique')}
          emptyDescription={t('s.les_livraisons_validees_apparaitront_ici')}
        />
      </div>

      {/* ────── Partial Delivery Modal ────── */}
      <Modal
        title={
          <div className="flex items-center gap-3 py-1">
            <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center text-green-500">
              <CarOutlined style={{ fontSize: 18 }} />
            </div>
            <div>
              <div className="font-black text-base leading-tight">{t('s.enregistrer_une_sortie_de_stock')}</div>
              {selectedSale && (
                <div className="text-xs text-gray-400 font-normal mt-0.5">
                  Facture&nbsp;<span className="font-bold text-primary">#{selectedSale.invoiceNumber}</span>
                  &nbsp;·&nbsp;{selectedSale.customerName || selectedSale.cashier}
                </div>
              )}
            </div>
          </div>
        }
        open={modalOpen}
        onClose={closeModal}
        onOk={handleSubmitDelivery}
        okText={t('s.valider_la_sortie')}
        cancelText={t('s.annuler')}
        width={540}
      >
        {selectedSale && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-400 leading-relaxed">
              Saisissez la quantité à sortir physiquement <strong>aujourd'hui</strong> pour chaque article.
              Le reste restera visible en statut <span className="text-orange-400 font-semibold">{t('s.partiel_2')}</span> {t('s.pour_une_livraison_ulterieure')}
            </p>

            <div className="space-y-3">
              {selectedSale.items
                .filter(i => i.storeId === currentUser?.storeId && !i.isDelivered)
                .map((item) => {
                  const alreadyDelivered = item.quantityDelivered ?? 0;
                  const remaining = item.quantity - alreadyDelivered;
                  const currentVal = deliveryQtys[item.productId] ?? remaining;

                  return (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between gap-4 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{item.name}</div>
                        <div className="text-xs text-gray-400 mt-1 space-x-2">
                          <span>{t('s.commande')} <strong className="text-gray-600 dark:text-gray-200">{item.quantity}</strong></span>
                          {alreadyDelivered > 0 && (
                            <>
                              <span>{t('s.deja_sorti')} <strong className="text-orange-500">{alreadyDelivered}</strong></span>
                              <span>· Reste: <strong className="text-blue-500">{remaining}</strong></span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <InputNumber
                          min={0}
                          max={remaining}
                          value={currentVal}
                          onChange={(val) => setDeliveryQtys(prev => ({ ...prev, [item.productId]: val ?? 0 }))}
                          className="w-28"
                          size="large"
                        />
                        <span className="text-xs text-gray-400 whitespace-nowrap">/ {remaining} restants</span>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-400/20 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              <strong>{t('s.stock_physique')}</strong> : seulement les quantités saisies seront déduites du dépôt.
              Les articles non totalement sortis passeront en statut <strong>{t('s.partiel_2')}</strong>.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DeliveriesPanel;
