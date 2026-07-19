import React, { useState, useMemo } from 'react';
import { useStores, useProducts } from '../../hooks';
import { ArrowRightLeft, Plus, CheckCircle, Package, Search, Printer, ArrowRight, ArrowDownToLine, ArrowUpFromLine, FileText } from 'lucide-react';
import { Button, message, Popconfirm, Tag, Modal, Select, InputNumber } from 'antd';
import DataTable from '../common/DataTable';

const TransferManager = () => {
  const { 
    transfers, 
    activeStoreId, 
    stores, 
    createTransfer, 
    receiveTransfer 
  } = useStores();
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
          <h1>BON DE TRANSFERT INTERNE</h1>
          <div class="meta">
            <div class="meta-box">
              <strong>Réf :</strong> ${transfer.reference}<br/>
              <strong>Date :</strong> ${new Date(transfer.date).toLocaleDateString()}<br/>
              <strong>Statut :</strong> ${transfer.status === 'completed' ? 'Réceptionné' : 'En transit'}
            </div>
            <div class="meta-box">
              <strong>De :</strong> ${fromStore}<br/>
              <strong>Vers :</strong> ${toStore}<br/>
              <strong>Initié par :</strong> ${transfer.initiatedBy}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Article</th>
                <th>Quantité</th>
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
            <div class="signature">Signature Expéditeur</div>
            <div class="signature">Signature Réceptionnaire</div>
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
      title: 'Référence', 
      render: (val) => <span className="font-bold text-text-heading">{val}</span> 
    },
    { 
      key: 'date', 
      title: 'Date', 
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
      title: 'Articles',
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
      title: 'Statut',
      render: (val) => {
        if (val === 'completed') return <Tag color="success">Réceptionné</Tag>;
        return <Tag color="processing">En transit</Tag>;
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button 
            size="small" 
            icon={<Printer size={14} />} 
            onClick={() => handlePrintTransfer(record)}
            title="Imprimer le bon"
          />
          {activeTab === 'incoming' && record.status === 'in_transit' && (
            <Popconfirm
              title="Confirmer la réception ?"
              description="Les articles seront ajoutés à votre stock."
              onConfirm={() => {
                receiveTransfer(record.id);
                message.success('Réception validée !');
              }}
              okText="Oui, recevoir"
              cancelText="Annuler"
            >
              <Button type="primary" size="small" className="bg-emerald-500 hover:bg-emerald-600 border-none">
                Recevoir
              </Button>
            </Popconfirm>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-bg-card border border-black/5 dark:border-white/5 rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <ArrowRightLeft size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-text-heading tracking-tight">Transferts Inter-Magasins</h2>
              <p className="text-[0.7rem] text-text-muted font-black uppercase tracking-widest">
                Gérer les mouvements de stock
              </p>
            </div>
          </div>
          <Button 
            type="primary" 
            icon={<Plus size={18} />} 
            onClick={() => setIsModalVisible(true)}
            className="h-11 px-6 rounded-xl font-bold shadow-lg shadow-primary/20"
          >
            Nouveau Transfert
          </Button>
        </div>

        {/* Custom Tabs */}
        <div className="flex gap-4 mb-6 border-b border-black/5 dark:border-white/5 pb-2">
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 relative ${
              activeTab === 'outgoing' ? 'text-primary' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <div className="flex items-center gap-2">
              <ArrowUpFromLine size={16} />
              Sortants
              {outgoingTransfers.filter(t => t.status === 'in_transit').length > 0 && (
                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                  {outgoingTransfers.filter(t => t.status === 'in_transit').length}
                </span>
              )}
            </div>
            {activeTab === 'outgoing' && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></div>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('incoming')}
            className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 relative ${
              activeTab === 'incoming' ? 'text-primary' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <div className="flex items-center gap-2">
              <ArrowDownToLine size={16} />
              Entrants
              {incomingTransfers.filter(t => t.status === 'in_transit').length > 0 && (
                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs animate-pulse">
                  {incomingTransfers.filter(t => t.status === 'in_transit').length}
                </span>
              )}
            </div>
            {activeTab === 'incoming' && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></div>
            )}
          </button>
        </div>

        <DataTable 
          columns={columns} 
          data={displayedTransfers} 
          emptyIcon={FileText}
          emptyTitle="Aucun transfert"
          emptyDescription={`Vous n'avez aucun transfert ${activeTab === 'outgoing' ? 'sortant' : 'entrant'} pour le moment.`}
        />
      </div>

      {/* Modal Nouveau Transfert */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-text-heading font-black text-xl mb-4">
            <ArrowRightLeft className="text-primary" />
            Nouveau Transfert
          </div>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setTransferItems([]);
          setSelectedToStore(null);
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <div className="space-y-6">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">1. Destination</h3>
            <Select
              className="w-full"
              size="large"
              placeholder="Sélectionnez le magasin de destination"
              value={selectedToStore}
              onChange={setSelectedToStore}
              options={otherStores.map(s => ({ value: s.id, label: s.name }))}
            />
          </div>

          <div className="bg-bg-secondary border border-black/5 dark:border-white/5 rounded-xl p-6">
            <h3 className="text-sm font-bold text-text-heading uppercase tracking-widest mb-4">2. Articles à transférer</h3>
            <div className="flex gap-4 mb-4">
              <Select
                className="flex-1"
                showSearch
                placeholder="Rechercher un produit..."
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
                Ajouter
              </Button>
            </div>

            {transferItems.length > 0 && (
              <div className="mt-6 border border-black/5 dark:border-white/5 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-black/5 dark:bg-white/5 font-bold uppercase tracking-wider text-[0.7rem] text-text-muted">
                    <tr>
                      <th className="px-4 py-3">Article</th>
                      <th className="px-4 py-3">Quantité</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {transferItems.map((item, idx) => (
                      <tr key={idx} className="bg-bg-primary">
                        <td className="px-4 py-3 font-semibold text-text-primary">{item.name}</td>
                        <td className="px-4 py-3 text-primary font-bold">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">
                          <Button danger size="small" type="text" onClick={() => handleRemoveItem(item.productId)}>
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
            <Button onClick={() => setIsModalVisible(false)}>Annuler</Button>
            <Button 
              type="primary" 
              onClick={handleSubmitTransfer}
              className="bg-primary hover:bg-primary-dark border-none"
              disabled={!selectedToStore || transferItems.length === 0}
            >
              Créer le transfert
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TransferManager;
