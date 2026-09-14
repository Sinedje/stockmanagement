import { useT } from '../../i18n/I18nContext';
import { Toolbar, Panel, Table, Button } from '../ui';
import Modal from '../common/Modal';
import React, { useState, useMemo } from 'react';
import { printHeaderHtml } from '../common/PrintHeader';
import OnlineOnly from '../../offline/OnlineOnly';
import { useStores, useProducts, useSettings } from '../../hooks';
import { ArrowRightOutlined, CheckCircleOutlined, FileTextOutlined, InboxOutlined, PlusOutlined, PrinterOutlined, SearchOutlined, SwapOutlined, VerticalAlignBottomOutlined, VerticalAlignTopOutlined } from '@ant-design/icons';
import { InputNumber, Popconfirm, Segmented, Select, Tag, message } from 'antd';

const TransferManager = () => {
  const t = useT();
  const { 
    transfers, 
    activeStoreId, 
    stores, 
    createTransfer, 
    receiveTransfer 
  } = useStores();
  const { companySettings } = useSettings();
  const { products } = useProducts();
  
  const [activeTab, setActiveTab] = useState('outgoing');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedToStore, setSelectedToStore] = useState(null);
  const [transferItems, setTransferItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const currentStore = stores.find(s => s.id === activeStoreId);
  const otherStores = stores.filter(s => s.id !== activeStoreId);

  // Derived data
  const outgoingTransfers = useMemo(() => 
    transfers.filter(t => t.fromStoreId === activeStoreId).sort((a, b) => new Date(b.date) - new Date(a.date)),
  [transfers, activeStoreId]);

  const incomingTransfers = useMemo(() => 
    transfers.filter(t => t.toStoreId === activeStoreId).sort((a, b) => new Date(b.date) - new Date(a.date)),
  [transfers, activeStoreId]);

  const displayedTransfers = activeTab === 'outgoing' ? outgoingTransfers : incomingTransfers;

  // Handlers
  const handleAddItem = () => {
    if (!selectedProduct) {
      message.warning("Sélectionnez un produit");
      return;
    }
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    if (quantity > product.stock) {
      message.error(`Stock insuffisant. Maximum disponible: ${product.stock}`);
      return;
    }

    const existingItem = transferItems.find(i => i.productId === selectedProduct);
    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (newQty > product.stock) {
        message.error(`Stock insuffisant. Maximum disponible: ${product.stock}`);
        return;
      }
      setTransferItems(prev => prev.map(i => i.productId === selectedProduct ? { ...i, quantity: newQty } : i));
    } else {
      setTransferItems(prev => [...prev, { productId: product.id, name: product.name, quantity }]);
    }
    
    setSelectedProduct(null);
    setQuantity(1);
  };

  const handleRemoveItem = (productId) => {
    setTransferItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleSubmitTransfer = () => {
    if (!selectedToStore) {
      message.warning("Veuillez sélectionner un magasin de destination.");
      return;
    }
    if (transferItems.length === 0) {
      message.warning("Ajoutez au moins un produit à transférer.");
      return;
    }

    createTransfer(selectedToStore, transferItems, "Transfert interne");
    message.success("Transfert créé avec succès !");
    setIsModalVisible(false);
    setTransferItems([]);
    setSelectedToStore(null);
    setActiveTab('outgoing');
  };

  const handlePrintTransfer = (transfer) => {
    const printWindow = window.open('', '_blank');
    const fromStore = stores.find(s => s.id === transfer.fromStoreId)?.name;
    const toStore = stores.find(s => s.id === transfer.toStoreId)?.name;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Bon de Transfert ${transfer.reference}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; color: #000; }
            h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 40px; margin-top: 20px; }
            .meta-box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; width: 45%; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 12px; text-align: left; }
            th { background-color: #f8f9fa; }
            .footer { margin-top: 60px; display: flex; justify-content: space-between; }
            .signature { border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 10px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          ${printHeaderHtml(companySettings, { title: t('s.bon_de_transfert_interne') })}
          <div class="meta">
            <div class="meta-box">
              <strong>${t('s.ref')}</strong> ${transfer.reference}<br/>
              <strong>${t('s.date_2')}</strong> ${new Date(transfer.date).toLocaleDateString()}<br/>
              <strong>${t('s.statut_2')}</strong> ${transfer.status === 'completed' ? 'Réceptionné' : 'En transit'}
            </div>
            <div class="meta-box">
              <strong>${t('s.de')}</strong> ${fromStore}<br/>
              <strong>${t('s.vers')}</strong> ${toStore}<br/>
              <strong>${t('s.initie_par')}</strong> ${transfer.initiatedBy}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>${t('s.article')}</th>
                <th>${t('s.quantite')}</th>
              </tr>
            </thead>
            <tbody>
              ${transfer.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <div class="signature">{t('s.signature_expediteur')}</div>
            <div class="signature">{t('s.signature_receptionnaire')}</div>
          </div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const columns = [
    { 
      key: 'reference', 
      title: t('s.reference'), 
      render: (val) => <span className="font-bold text-text-heading">{val}</span> 
    },
    { 
      key: 'date', 
      title: t('s.date'), 
      render: (val) => <span className="text-sm">{new Date(val).toLocaleDateString()}</span> 
    },
    {
      key: activeTab === 'outgoing' ? 'toStoreId' : 'fromStoreId',
      title: activeTab === 'outgoing' ? 'Destinataire' : 'Expéditeur',
      render: (storeId) => (
        <span className="font-semibold text-primary">
          {stores.find(s => s.id === storeId)?.name || 'Inconnu'}
        </span>
      )
    },
    {
      key: 'items',
      title: t('s.articles'),
      render: (items) => (
        <div className="flex flex-col gap-1">
          {items.map((i, idx) => (
            <span key={idx} className="text-xs bg-bg-secondary px-2 py-1 rounded">
              {i.quantity}x {i.name}
            </span>
          ))}
        </div>
      )
    },
    {
      key: 'status',
      title: t('s.statut'),
      render: (val) => {
        if (val === 'completed') return <Tag color="success">{t('s.receptionne')}</Tag>;
        return <Tag color="processing">{t('s.en_transit')}</Tag>;
      }
    },
    {
      key: 'actions',
      title: t('s.actions'),
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button icon={<PrinterOutlined style={{ fontSize: 14 }} />} onClick={() => handlePrintTransfer(record)} title={t('s.imprimer_le_bon')} />
          {activeTab === 'incoming' && record.status === 'in_transit' && (
            <Popconfirm
              title={t('s.confirmer_la_reception')}
              description={t('s.les_articles_seront_ajoutes_a_votre_stock')}
              onConfirm={() => {
                receiveTransfer(record.id);
                message.success('Réception validée !');
              }}
              okText={t('s.oui_recevoir')}
              cancelText={t('s.annuler')}
            >
              <Button type="primary" className="bg-emerald-500 hover:bg-emerald-600 border-none">
                Recevoir
              </Button>
            </Popconfirm>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in space-y-4">
      {/* Commandes : onglets de sens + création — carte distincte du tableau */}
      <Toolbar right={
        <OnlineOnly reason="Indisponible hors connexion : un transfert engage deux magasins et doit être visible des deux côtés au même moment.">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>{t('s.nouveau_transfert')}</Button>
        </OnlineOnly>
      }>
        <Segmented
          value={activeTab}
          onChange={setActiveTab}
          options={[
            {
              value: 'outgoing',
              label: (
                <span className="flex items-center gap-1.5">
                  <VerticalAlignTopOutlined /> Sortants
                  {outgoingTransfers.filter(t => t.status === 'in_transit').length > 0 && (
                    <span className="bg-primary/20 text-primary px-1.5 rounded text-[0.65rem]">
                      {outgoingTransfers.filter(t => t.status === 'in_transit').length}
                    </span>
                  )}
                </span>
              ),
            },
            {
              value: 'incoming',
              label: (
                <span className="flex items-center gap-1.5">
                  <VerticalAlignBottomOutlined /> Entrants
                  {incomingTransfers.filter(t => t.status === 'in_transit').length > 0 && (
                    <span className="bg-red-500 text-white px-1.5 rounded text-[0.65rem]">
                      {incomingTransfers.filter(t => t.status === 'in_transit').length}
                    </span>
                  )}
                </span>
              ),
            },
          ]}
        />
      </Toolbar>

      {/* Données */}
      <Panel noPadding>
        <Table
          columns={columns}
          data={displayedTransfers}
          emptyIcon={FileTextOutlined}
          emptyTitle={t('s.aucun_transfert')}
          emptyDescription={`Vous n'avez aucun transfert ${activeTab === 'outgoing' ? 'sortant' : 'entrant'} pour le moment.`}
        />
      </Panel>

      {/* Modal Nouveau Transfert */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-text-heading font-black text-xl mb-4">
            <SwapOutlined className="text-primary" />
            {t('s.nouveau_transfert_2')}
          </div>
        }
        open={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setTransferItems([]);
          setSelectedToStore(null);
        }}
        footer={null}
        width={800}
      >
        <div className="space-y-6">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">1. Destination</h3>
            <Select
              className="w-full"
              size="large"
              placeholder={t('s.selectionnez_le_magasin_de_destination')}
              value={selectedToStore}
              onChange={setSelectedToStore}
              options={otherStores.map(s => ({ value: s.id, label: s.name }))}
            />
          </div>

          <div className="bg-bg-secondary border border-black/5 dark:border-white/5 rounded-xl p-6">
            <h3 className="text-sm font-bold text-text-heading uppercase tracking-widest mb-4">{t('s.2_articles_a_transferer')}</h3>
            <div className="flex gap-4 mb-4">
              <Select
                className="flex-1"
                showSearch
                placeholder={t('s.rechercher_un_produit')}
                value={selectedProduct}
                onChange={setSelectedProduct}
                options={products.map(p => ({ 
                  value: p.id, 
                  label: `${p.name} (Stock: ${p.stock})`,
                  disabled: p.stock <= 0
                }))}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
              <InputNumber 
                min={1} 
                value={quantity} 
                onChange={setQuantity} 
                className="w-24"
              />
              <Button type="primary" onClick={handleAddItem}>
                {t('s.ajouter')}
              </Button>
            </div>

            {transferItems.length > 0 && (
              <div className="mt-6 border border-black/5 dark:border-white/5 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-black/5 dark:bg-white/5 font-bold uppercase tracking-wider text-[0.7rem] text-text-muted">
                    <tr>
                      <th className="px-4 py-3">{t('s.article')}</th>
                      <th className="px-4 py-3">{t('s.quantite')}</th>
                      <th className="px-4 py-3 text-right">{t('s.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {transferItems.map((item, idx) => (
                      <tr key={idx} className="bg-bg-primary">
                        <td className="px-4 py-3 font-semibold text-text-primary">{item.name}</td>
                        <td className="px-4 py-3 text-primary font-bold">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">
                          <Button danger type="text" onClick={() => handleRemoveItem(item.productId)}>
                            Retirer
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-black/5 dark:border-white/5">
            <Button onClick={() => setIsModalVisible(false)}>{t('s.annuler')}</Button>
            <Button type="primary" onClick={handleSubmitTransfer} className="bg-primary hover:bg-primary-dark border-none" disabled={!selectedToStore || transferItems.length === 0} >
              {t('s.creer_le_transfert')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TransferManager;
