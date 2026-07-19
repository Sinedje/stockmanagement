import React, { useState } from 'react';
import { formatPrice } from '../../context/StoreContext';
import { useProducts } from '../../hooks';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import DataTable from '../common/DataTable';
import SearchComponent from '../common/SearchComponent';
import { Plus, Edit3, Trash2, Package } from 'lucide-react';
import { Button, Space, Popconfirm } from 'antd';

const emptyProduct = { 
  name: '', 
  category: '', 
  price: '', 
  cost: '', 
  stock: '', 
  minStock: '', 
  image: '',
  supplier: '',
  deliveryNote: ''
};

const InventoryPanel = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct, addCategory } = useProducts();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('Tous');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [newCategory, setNewCategory] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'Tous' || p.category === filterCat;
    return matchSearch && matchCat;
  });



  const openAdd = () => { 
    setEditingProduct(null); 
    setForm(emptyProduct); 
    setIsAddingNewCategory(false);
    setNewCategory('');
    setShowModal(true); 
  };
  const openEdit = (p) => { 
    setEditingProduct(p); 
    setForm({ 
      ...p, 
      price: String(p.price), 
      cost: String(p.cost), 
      stock: String(p.stock), 
      minStock: String(p.minStock) 
    }); 
    setIsAddingNewCategory(false);
    setShowModal(true); 
  };

  const handleSave = () => {
    let finalCategory = form.category;
    if (isAddingNewCategory && newCategory.trim()) {
      addCategory(newCategory.trim());
      finalCategory = newCategory.trim();
    }

    const data = { 
      ...form, 
      category: finalCategory,
      price: Number(form.price), 
      cost: Number(form.cost), 
      stock: Number(form.stock), 
      minStock: Number(form.minStock) 
    };
    if (!data.name || !data.price || !data.category) return;
    if (editingProduct) { updateProduct(editingProduct.id, data); }
    else { addProduct(data); }
    setShowModal(false);
  };

  const columns = [
    { key: 'image', title: '', width: '60px', render: (val) => (
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center">
        {val ? (
          <img src={val} alt="" className="w-full h-full object-cover" />
        ) : (
          <Package size={16} className="opacity-20" />
        )}
      </div>
    )},
    { key: 'name', title: 'Produit', render: (val) => <span className="font-semibold text-text-heading">{val}</span> },
    { key: 'category', title: 'Catégorie', render: (val) => <span className="badge badge-info">{val}</span> },
    { key: 'price', title: 'Prix', render: (val) => <span className="font-bold text-primary">{formatPrice(val)}</span> },
    { key: 'cost', title: 'Coût', render: (val) => formatPrice(val) },
    { key: 'stock', title: 'Stock Vente', render: (val, row) => (
      <div className="flex flex-col">
        <span className={`font-black ${val <= row.minStock ? 'text-red-500' : 'text-text-primary'}`}>{val}</span>
        <span className="text-[0.6rem] text-text-muted uppercase font-bold tracking-tighter">Théorique</span>
      </div>
    )},
    { key: 'physicalStock', title: 'Stock Magasin', render: (val, row) => (
      <div className="flex flex-col">
        <span className={`font-black ${val <= row.minStock ? 'text-purple-500' : 'text-text-primary'}`}>{val}</span>
        <span className="text-[0.6rem] text-text-muted uppercase font-bold tracking-tighter">Physique</span>
      </div>
    )},
    { key: 'minStock', title: 'Min' },
    { key: 'status', title: 'État', render: (_, row) => (
      <span className={`badge ${row.physicalStock <= 5 ? 'badge-danger' : row.physicalStock <= row.minStock ? 'badge-warning' : 'badge-success'}`}>
        {row.physicalStock <= 5 ? 'Critique' : row.physicalStock <= row.minStock ? 'Bas' : 'OK'}
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-card p-6 rounded-2xl border border-black/5 dark:border-white/5">
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

      <div className="flex flex-wrap gap-2 p-1.5 bg-black/5 dark:bg-black/20 rounded-xl w-fit border border-black/5 dark:border-white/5">
        {['Tous', ...categories].map(cat => (
          <button 
            key={cat} 
            className={`
              px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
              ${filterCat === cat 
                ? 'bg-primary text-black shadow-lg shadow-primary/20' 
                : 'text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'}
            `} 
            onClick={() => setFilterCat(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-bg-secondary rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden shadow-2xl">
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
            
            {!isAddingNewCategory ? (
              <Select
                label="Catégorie"
                value={form.category}
                onChange={val => {
                  if (val === 'ADD_NEW') {
                    setIsAddingNewCategory(true);
                  } else {
                    setForm({ ...form, category: val });
                  }
                }}
                options={[...categories, { label: '+ Nouveau...', value: 'ADD_NEW' }]}
                placeholder="Sélectionner..."
              />
            ) : (
              <div className="space-y-2">
                <Input
                  label="Nouvelle Catégorie"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="Ex: Surgelés, Electronique..."
                  autoFocus
                />
                <button 
                  className="text-primary text-[0.7rem] font-bold uppercase tracking-wider hover:underline"
                  onClick={() => setIsAddingNewCategory(false)}
                >
                  Choisir une catégorie existante
                </button>
              </div>
            )}

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

            <div className="grid grid-cols-2 gap-4 border-t border-black/5 dark:border-white/5 pt-4">
              <Input
                label="Fournisseur"
                value={form.supplier || ''}
                onChange={e => setForm({ ...form, supplier: e.target.value })}
                placeholder="Nom du fournisseur"
              />
              <Input
                label="N° Bon (Livraison/Commande)"
                value={form.deliveryNote || ''}
                onChange={e => setForm({ ...form, deliveryNote: e.target.value })}
                placeholder="Ex: BL-2024-001"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.65rem] font-black text-text-muted uppercase tracking-widest px-1">Image du Produit</label>
              <div className="flex items-center gap-4 p-4 bg-black/5 dark:bg-white/5 border border-dashed border-black/20 dark:border-white/20 rounded-2xl transition-all hover:border-primary/50">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center flex-shrink-0">
                  {form.image ? (
                    <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Package size={24} className="opacity-20" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <input
                    type="file"
                    accept="image/*"
                    id="product-image"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setForm({ ...form, image: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label 
                    htmlFor="product-image"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-black text-xs font-black rounded-lg cursor-pointer hover:bg-primary/90 transition-all uppercase tracking-tighter"
                  >
                    Choisir une image
                  </label>
                  <p className="text-[0.6rem] text-text-muted">PNG, JPG ou GIF (Max 2MB recommandé)</p>
                </div>
                {form.image && (
                  <button 
                    onClick={() => setForm({ ...form, image: '' })}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InventoryPanel;
