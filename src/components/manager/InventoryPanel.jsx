import { useT } from '../../i18n/I18nContext';
import { Table } from '../ui';
import React, { useState } from 'react';
import { formatPrice } from '../../context/StoreContext';
import { useProducts } from '../../hooks';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import SearchComponent from '../common/SearchComponent';
import { DeleteOutlined, EditOutlined, InboxOutlined, PlusOutlined } from '@ant-design/icons';
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
  const t = useT();
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
          <InboxOutlined style={{ fontSize: 16 }} className="opacity-20" />
        )}
      </div>
    )},
    { key: 'name', title: t('s.produit'), render: (val) => <span className="font-semibold text-text-heading">{val}</span> },
    { key: 'category', title: t('s.categorie'), render: (val) => <span className="badge badge-info">{val}</span> },
    { key: 'price', title: t('s.prix'), render: (val) => <span className="font-bold text-primary">{formatPrice(val)}</span> },
    { key: 'cost', title: t('s.cout'), render: (val) => formatPrice(val) },
    { key: 'stock', title: t('s.stock_vente'), render: (val, row) => (
      <div className="flex flex-col">
        <span className={`font-black ${val <= row.minStock ? 'text-red-500' : 'text-text-primary'}`}>{val}</span>
        <span className="text-[0.6rem] text-text-muted uppercase font-bold tracking-tighter">{t('s.theorique')}</span>
      </div>
    )},
    { key: 'physicalStock', title: t('s.stock_magasin'), render: (val, row) => (
      <div className="flex flex-col">
        <span className={`font-black ${val <= row.minStock ? 'text-purple-500' : 'text-text-primary'}`}>{val}</span>
        <span className="text-[0.6rem] text-text-muted uppercase font-bold tracking-tighter">{t('s.physique')}</span>
      </div>
    )},
    { key: 'minStock', title: 'Min' },
    { key: 'status', title: t('s.etat'), render: (_, row) => (
      <span className={`badge ${row.physicalStock <= 5 ? 'badge-danger' : row.physicalStock <= row.minStock ? 'badge-warning' : 'badge-success'}`}>
        {row.physicalStock <= 5 ? 'Critique' : row.physicalStock <= row.minStock ? 'Bas' : 'OK'}
      </span>
    )},
    { key: 'actions', title: t('s.actions'), align: 'right', render: (_, row) => (
      <Space size="small">
        <Button type="text" className="text-text-secondary hover:text-primary!" icon={<EditOutlined style={{ fontSize: 14 }} />} onClick={(e) => { e.stopPropagation(); openEdit(row); }} />
        <Popconfirm
          title={t('s.supprimer_le_produit')}
          description={t('s.etes_vous_sur_de_vouloir_supprimer_ce_produi')}
          onConfirm={() => deleteProduct(row.id)}
          okText={t('s.oui')}
          cancelText={t('s.non')}
        >
          <Button type="text" danger className="hover:bg-red-500/10!" icon={<DeleteOutlined style={{ fontSize: 14 }} />} onClick={(e) => e.stopPropagation()} />
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-card p-6 rounded-2xl border border-black/5 dark:border-white/5">
        <SearchComponent
          placeholder={t('s.rechercher_un_produit')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          width="100%"
          className="max-w-md"
        />
        <Button type="primary" icon={<PlusOutlined style={{ fontSize: 16 }} />} onClick={openAdd} >
          {t('s.ajouter_produit')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 bg-black/5 dark:bg-black/20 rounded-xl w-fit border border-black/5 dark:border-white/5">
        {['Tous', ...categories].map(cat => (
          <button 
            key={cat} 
            className={`
              px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
              ${filterCat === cat 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'}
            `} 
            onClick={() => setFilterCat(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-bg-secondary rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden shadow-2xl">
        <Table
          columns={columns}
          data={filtered}
          emptyIcon={InboxOutlined}
          emptyTitle={t('s.aucun_produit_trouve')}
          emptyDescription={t('s.essayez_de_modifier_vos_filtres_ou_ajoutez_u')}
        />
      </div>

      {showModal && (
        <Modal
          title={editingProduct ? 'Modifier le Produit' : 'Nouveau Produit'}
          onClose={() => setShowModal(false)}
          footer={<div className="flex justify-end gap-3">
            <Button onClick={() => setShowModal(false)} >
              {t('s.annuler')}
            </Button>
            <Button type="primary" onClick={handleSave} >
              {t('s.enregistrer')}
            </Button>
          </div>}
        >
          <div className="space-y-4 p-1">
            <Input
              label={t('s.nom_du_produit')}
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder={t('s.ex_riz_basmati_5kg')}
            />
            
            {!isAddingNewCategory ? (
              <Select
                label={t('s.categorie')}
                value={form.category}
                onChange={val => {
                  if (val === 'ADD_NEW') {
                    setIsAddingNewCategory(true);
                  } else {
                    setForm({ ...form, category: val });
                  }
                }}
                options={[...categories, { label: t('s.nouveau'), value: 'ADD_NEW' }]}
                placeholder={t('s.selectionner')}
              />
            ) : (
              <div className="space-y-2">
                <Input
                  label={t('s.nouvelle_categorie')}
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder={t('s.ex_surgeles_electronique')}
                  autoFocus
                />
                <button 
                  className="text-primary text-[0.7rem] font-bold uppercase tracking-wider hover:underline"
                  onClick={() => setIsAddingNewCategory(false)}
                >
                  {t('s.choisir_une_categorie_existante')}
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('s.prix_de_vente')}
                type="number"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder="0"
              />
              <Input
                label={t('s.prix_d_achat')}
                type="number"
                value={form.cost}
                onChange={e => setForm({ ...form, cost: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('s.stock')}
                type="number"
                value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })}
                placeholder="0"
              />
              <Input
                label={t('s.stock_minimum')}
                type="number"
                value={form.minStock}
                onChange={e => setForm({ ...form, minStock: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-black/5 dark:border-white/5 pt-4">
              <Input
                label={t('s.fournisseur_2')}
                value={form.supplier || ''}
                onChange={e => setForm({ ...form, supplier: e.target.value })}
                placeholder={t('s.nom_du_fournisseur')}
              />
              <Input
                label={t('s.n_bon_livraison_commande')}
                value={form.deliveryNote || ''}
                onChange={e => setForm({ ...form, deliveryNote: e.target.value })}
                placeholder={t('s.ex_bl_2024_001')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest px-1">{t('s.image_du_produit')}</label>
              <div className="flex items-center gap-4 p-4 bg-black/5 dark:bg-white/5 border border-dashed border-black/20 dark:border-white/20 rounded-2xl transition-all hover:border-primary/50">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center flex-shrink-0">
                  {form.image ? (
                    <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <InboxOutlined style={{ fontSize: 24 }} className="opacity-20" />
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
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-primary/90 transition-all uppercase tracking-tighter"
                  >
                    {t('s.choisir_une_image')}
                  </label>
                  <p className="text-[0.6rem] text-text-muted">{t('s.png_jpg_ou_gif_max_2mb_recommande')}</p>
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
