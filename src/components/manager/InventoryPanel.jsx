import React, { useState } from 'react';
import { useStore, formatPrice } from '../../context/StoreContext';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import DataTable from '../common/DataTable';
import SearchComponent from '../common/SearchComponent';
import { Plus, Edit3, Trash2, Package } from 'lucide-react';
import { Button, Space, Popconfirm } from 'antd';

const emptyProduct = { name: '', category: '', price: '', cost: '', stock: '', minStock: '' };

const InventoryPanel = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useStore();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('Tous');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'Tous' || p.category === filterCat;
    return matchSearch && matchCat;
  });

  const openAdd = () => { setEditingProduct(null); setForm(emptyProduct); setShowModal(true); };
  const openEdit = (p) => { 
    setEditingProduct(p); 
    setForm({ 
      ...p, 
      price: String(p.price), 
      cost: String(p.cost), 
      stock: String(p.stock), 
      minStock: String(p.minStock) 
    }); 
    setShowModal(true); 
  };

  const handleSave = () => {
    const data = { 
      ...form, 
      price: Number(form.price), 
      cost: Number(form.cost), 
      stock: Number(form.stock), 
      minStock: Number(form.minStock) 
    };
    if (!data.name || !data.price) return;
    if (editingProduct) { updateProduct(editingProduct.id, data); }
    else { addProduct(data); }
    setShowModal(false);
  };

  const columns = [
    { key: 'name', title: 'Produit', render: (val) => <span className="font-semibold text-text-heading">{val}</span> },
    { key: 'category', title: 'Catégorie', render: (val) => <span className="badge badge-info">{val}</span> },
    { key: 'price', title: 'Prix', render: (val) => <span className="font-bold text-primary">{formatPrice(val)}</span> },
    { key: 'cost', title: 'Coût', render: (val) => formatPrice(val) },
    { key: 'stock', title: 'Stock', render: (val, row) => <span className={`font-black ${val <= row.minStock ? 'text-red-500' : 'text-text-primary'}`}>{val}</span> },
    { key: 'minStock', title: 'Min' },
    { key: 'status', title: 'État', render: (_, row) => (
      <span className={`badge ${row.stock <= 5 ? 'badge-danger' : row.stock <= row.minStock ? 'badge-warning' : 'badge-success'}`}>
        {row.stock <= 5 ? 'Critique' : row.stock <= row.minStock ? 'Bas' : 'OK'}
      </span>
    )},
    { key: 'actions', title: 'Actions', align: 'right', render: (_, row) => (
      <Space size="small">
        <Button 
          type="text" 
          className="text-text-secondary hover:text-primary!"
          icon={<Edit3 size={14} />} 
          onClick={(e) => { e.stopPropagation(); openEdit(row); }} 
        />
        <Popconfirm
          title="Supprimer le produit"
          description="Êtes-vous sûr de vouloir supprimer ce produit ?"
          onConfirm={() => deleteProduct(row.id)}
          okText="Oui"
          cancelText="Non"
        >
          <Button 
            type="text" 
            danger 
            className="hover:bg-red-500/10!"
            icon={<Trash2 size={14} />} 
            onClick={(e) => e.stopPropagation()}
          />
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 p-6 rounded-2xl border border-white/5">
        <SearchComponent
          placeholder="Rechercher un produit..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          width="100%"
          className="max-w-md"
        />
        <Button 
          type="primary" 
          icon={<Plus size={16} />} 
          onClick={openAdd} 
          size="large"
          className="h-11 px-6 rounded-xl font-bold uppercase tracking-wider"
        >
          Ajouter Produit
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 bg-black/20 rounded-xl w-fit border border-white/5">
        {['Tous', ...categories].map(cat => (
          <button 
            key={cat} 
            className={`
              px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
              ${filterCat === cat 
                ? 'bg-primary text-black shadow-lg shadow-primary/20' 
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}
            `} 
            onClick={() => setFilterCat(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-bg-secondary rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
        <DataTable
          columns={columns}
          data={filtered}
          emptyIcon={Package}
          emptyTitle="Aucun produit trouvé"
          emptyDescription="Essayez de modifier vos filtres ou ajoutez un nouveau produit."
        />
      </div>

      {showModal && (
        <Modal
          title={editingProduct ? 'Modifier le Produit' : 'Nouveau Produit'}
          onClose={() => setShowModal(false)}
          footer={<div className="flex justify-end gap-3">
            <Button 
              onClick={() => setShowModal(false)} 
              className="h-10 rounded-lg px-6 font-semibold"
            >
              Annuler
            </Button>
            <Button 
              type="primary" 
              onClick={handleSave}
              className="h-10 rounded-lg px-6 font-bold"
            >
              Enregistrer
            </Button>
          </div>}
        >
          <div className="space-y-4 p-1">
            <Input
              label="Nom du Produit"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Riz Basmati 5kg"
            />
            <Select
              label="Catégorie"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              options={[...categories, 'Autre']}
              placeholder="Sélectionner..."
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prix de Vente"
                type="number"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder="0"
              />
              <Input
                label="Prix d'Achat"
                type="number"
                value={form.cost}
                onChange={e => setForm({ ...form, cost: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Stock"
                type="number"
                value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })}
                placeholder="0"
              />
              <Input
                label="Stock Minimum"
                type="number"
                value={form.minStock}
                onChange={e => setForm({ ...form, minStock: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InventoryPanel;
