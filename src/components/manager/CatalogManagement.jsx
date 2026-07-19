import React, { useState } from 'react';
import { useStore, formatPrice } from '../../context/StoreContext';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import DataTable from '../common/DataTable';
import SearchComponent from '../common/SearchComponent';
import { Plus, Edit3, Trash2, Package } from 'lucide-react';
import { Button, Space, Popconfirm, message } from 'antd';

const emptyProduct = { 
  name: '', 
  designation: '',
  category: '', 
  price: '', 
  cost: '', 
  stock: '', 
  minStock: '', 
  image: '',
  supplier: '',
  deliveryNote: '',
  isNonInventory: false
};

const CatalogManagement = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct, addCategory } = useStore();
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
      minStock: String(p.minStock),
      isNonInventory: !!p.isNonInventory
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
      stock: Number(form.stock) || 0, 
      minStock: Number(form.minStock) || 0,
      isNonInventory: !!form.isNonInventory
    };
    if (!data.name || !data.price || !data.category) {
        message.error('Veuillez remplir les champs obligatoires (Nom, Prix, Catégorie)');
        return;
    }
    if (editingProduct) { 
        updateProduct(editingProduct.id, data); 
        message.success('Produit mis à jour');
    }
    else { 
        addProduct(data); 
        message.success('Produit ajouté au catalogue');
    }
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
    { key: 'name', title: 'Référence', render: (val) => <span className="font-semibold text-text-heading">{val}</span> },
    { key: 'designation', title: 'Désignation', render: (val, row) => <span className="text-sm">{val || row.name}</span> },
    { key: 'category', title: 'Catégorie', render: (val) => <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[0.65rem] font-bold uppercase">{val}</span> },
    { key: 'price', title: 'Prix', render: (val) => <span className="font-bold text-primary">{formatPrice(val)}</span> },
    { key: 'cost', title: 'Coût', render: (val) => formatPrice(val) },
    { key: 'stock', title: 'Stock', render: (val, row) => (
      row.isNonInventory ? <span className="text-xs text-text-muted italic">Hors-stock</span> :
      <span className={`font-black ${val <= row.minStock ? 'text-red-500' : 'text-text-primary'}`}>{val}</span>
    )},
    { key: 'actions', title: 'Actions', align: 'right', render: (_, row) => (
      <Space size="small">
        <Button 
          type="text" 
          icon={<Edit3 size={14} />} 
          onClick={(e) => { e.stopPropagation(); openEdit(row); }} 
        />
        <Popconfirm
          title="Supprimer le produit"
          onConfirm={() => {
              deleteProduct(row.id);
              message.success('Produit supprimé');
          }}
          okText="Oui"
          cancelText="Non"
        >
          <Button type="text" danger icon={<Trash2 size={14} />} />
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-card p-4 rounded-2xl border border-black/5 dark:border-white/5">
        <SearchComponent
          placeholder="Rechercher dans le catalogue..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          width="100%"
          className="max-w-md"
        />
        <Button 
          type="primary" 
          icon={<Plus size={16} />} 
          onClick={openAdd} 
          className="h-10 px-6 rounded-xl font-bold uppercase tracking-wider"
        >
          Nouveau Produit
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-xl w-fit">
        {['Tous', ...categories].map(cat => (
          <button 
            key={cat} 
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterCat === cat ? 'bg-primary text-black' : 'text-text-muted hover:text-text-primary'}`} 
            onClick={() => setFilterCat(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-bg-card rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden shadow-xl">
        <DataTable columns={columns} data={filtered} />
      </div>

      {showModal && (
        <Modal
          title={editingProduct ? 'Modifier le Produit' : 'Ajouter au Catalogue'}
          onClose={() => setShowModal(false)}
          footer={<div className="flex justify-end gap-3">
            <Button onClick={() => setShowModal(false)}>Annuler</Button>
            <Button type="primary" onClick={handleSave} className="font-bold">Enregistrer</Button>
          </div>}
        >
          <div className="space-y-4 p-1">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Référence du Produit"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: REF001"
              />
              <Input
                label="Désignation"
                value={form.designation}
                onChange={e => setForm({ ...form, designation: e.target.value })}
                placeholder="Ex: Riz Basmati 5kg"
              />
            </div>
            
            {!isAddingNewCategory ? (
              <Select
                label="Catégorie"
                value={form.category}
                onChange={val => {
                  if (val === 'ADD_NEW') setIsAddingNewCategory(true);
                  else setForm({ ...form, category: val });
                }}
                options={[...categories, { label: '+ Nouveau...', value: 'ADD_NEW' }]}
              />
            ) : (
              <div className="space-y-2">
                <Input
                  label="Nouvelle Catégorie"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  autoFocus
                />
                <button className="text-primary text-[0.7rem] font-bold uppercase hover:underline" onClick={() => setIsAddingNewCategory(false)}>
                  Annuler
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                id="isNonInventory"
                checked={form.isNonInventory}
                onChange={e => setForm({ ...form, isNonInventory: e.target.checked, stock: e.target.checked ? 0 : form.stock, minStock: e.target.checked ? 0 : form.minStock })}
                className="w-4 h-4 rounded bg-black/20 border-white/10 text-primary focus:ring-primary focus:ring-offset-bg-secondary"
              />
              <label htmlFor="isNonInventory" className="text-sm text-text-heading font-semibold">
                Article hors-stock (Quantité illimitée, pas de suivi)
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Prix de Vente" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              <Input label="Prix d'Achat" type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Stock Initial" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} disabled={form.isNonInventory} />
              <Input label="Stock Minimum" type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} disabled={form.isNonInventory} />
            </div>
            <Input
                label="Image (URL)"
                value={form.image}
                onChange={e => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CatalogManagement;
