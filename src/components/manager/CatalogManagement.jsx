import { useT } from '../../i18n/I18nContext';
import { Toolbar, Panel, Table, Button, SearchInput, Select } from '../ui';
import React, { useState, useRef } from 'react';
import { formatPrice } from '../../context/StoreContext';
import { useProducts } from '../../hooks';
import Modal from '../common/Modal';
import Input from '../common/Input';
import ImageUploader from '../common/ImageUploader';
import { parseProductsExcel } from '../../utils/excelImport';
import { CheckCircleOutlined, CopyOutlined, DeleteOutlined, EditOutlined, FileExcelOutlined, InboxOutlined, PlusOutlined } from '@ant-design/icons';
import { Space, Popconfirm, message } from 'antd';

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
  const t = useT();
  const { products, categories, addProduct, importProducts, updateProduct, deleteProduct, addCategory } = useProducts();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('Tous');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [newCategory, setNewCategory] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);

  // State for Excel Import
  const [importingExcel, setImportingExcel] = useState(false);
  const [excelPreview, setExcelPreview] = useState(null);
  const [savingImport, setSavingImport] = useState(false);
  const excelInputRef = useRef(null);

  const filtered = products.filter(p => {
    const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
                        (p.designation || '').toLowerCase().includes(search.toLowerCase());
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
      name: p.name || '',
      designation: p.designation || p.name || '',
      price: String(p.price || 0), 
      cost: String(p.cost || 0), 
      stock: String(p.stock || 0), 
      minStock: String(p.minStock || 0),
      image: p.image || '',
      isNonInventory: !!p.isNonInventory
    }); 
    setIsAddingNewCategory(false);
    setShowModal(true); 
  };

  const openDuplicate = (p) => {
    setEditingProduct(null);
    setForm({
      ...p,
      name: `${p.name}_COPY`,
      designation: `${p.designation || p.name} (Copie)`,
      price: String(p.price || 0),
      cost: String(p.cost || 0),
      stock: String(p.stock || 0),
      minStock: String(p.minStock || 0),
      image: p.image || '',
      isNonInventory: !!p.isNonInventory
    });
    setIsAddingNewCategory(false);
    setShowModal(true);
    message.info('Veuillez ajuster la référence et enregistrer la copie.');
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
      designation: form.designation || form.name,
      price: Number(form.price), 
      cost: Number(form.cost), 
      stock: Number(form.stock) || 0, 
      minStock: Number(form.minStock) || 0,
      isNonInventory: !!form.isNonInventory
    };
    if (!data.name || !data.price || !data.category) {
        message.error('Veuillez remplir les champs obligatoires (Référence, Prix, Catégorie)');
        return;
    }
    if (editingProduct) { 
        updateProduct(editingProduct.id, data); 
        message.success('Produit et image mis à jour');
    }
    else { 
        addProduct(data); 
        message.success('Produit ajouté au catalogue');
    }
    setShowModal(false);
  };

  // Excel File Parsing & Handling
  const handleExcelFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingExcel(true);
    try {
      const parsedProducts = await parseProductsExcel(file);
      if (!parsedProducts || parsedProducts.length === 0) {
        message.warning('Aucun produit n\'a été trouvé dans le fichier Excel.');
      } else {
        setExcelPreview(parsedProducts);
        message.success(`${parsedProducts.length} produit(s) analysé(s) avec succès !`);
      }
    } catch (err) {
      console.error(err);
      message.error(`Erreur d'analyse du fichier Excel: ${err.message}`);
    } finally {
      setImportingExcel(false);
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async () => {
    if (!excelPreview || excelPreview.length === 0) return;
    setSavingImport(true);

    try {
      // Create new categories if they don't exist
      const newCategories = new Set();
      for (const prod of excelPreview) {
        if (prod.category && !categories.includes(prod.category)) {
          newCategories.add(prod.category);
        }
      }
      for (const cat of newCategories) {
        addCategory(cat);
      }

      await importProducts(excelPreview);
      
      message.success(`${excelPreview.length} produit(s) avec image(s) importé(s) ou mis à jour dans le catalogue !`);
      setExcelPreview(null);
    } catch (err) {
      console.error(err);
      message.error(`Erreur lors de l'importation: ${err.message}`);
    } finally {
      setSavingImport(false);
    }
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
    { key: 'name', title: t('s.reference'), render: (val) => <span className="font-semibold text-text-heading">{val}</span> },
    { key: 'designation', title: t('s.designation'), render: (val, row) => <span className="text-sm font-medium">{val || row.name}</span> },
    { key: 'category', title: t('s.categorie'), render: (val) => <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[0.65rem] font-bold uppercase">{val}</span> },
    { key: 'price', title: t('s.prix'), render: (val) => <span className="font-bold text-primary">{formatPrice(val)}</span> },
    { key: 'cost', title: t('s.cout'), render: (val) => formatPrice(val) },
    { key: 'stock', title: t('s.stock'), render: (val, row) => (
      row.isNonInventory ? <span className="text-xs text-text-muted italic">{t('s.hors_stock')}</span> :
      <span className={`font-black ${val <= row.minStock ? 'text-red-500' : 'text-text-primary'}`}>{val}</span>
    )},
    { key: 'actions', title: t('s.actions'), align: 'right', render: (_, row) => (
      <Space size="small">
        <Button type="text" icon={<EditOutlined style={{ fontSize: 14 }} />} title={t('s.modifier_le_produit_et_l_image')} onClick={(e) => { e.stopPropagation(); openEdit(row); }} />
        <Button type="text" icon={<CopyOutlined style={{ fontSize: 14 }} className="text-blue-500" />} title={t('s.dupliquer_l_article')} onClick={(e) => { e.stopPropagation(); openDuplicate(row); }} />
        <Popconfirm
          title={t('s.supprimer_le_produit')}
          onConfirm={() => {
              deleteProduct(row.id);
              message.success('Produit supprimé');
          }}
          okText={t('s.oui')}
          cancelText={t('s.non')}
        >
          <Button type="text" danger icon={<DeleteOutlined style={{ fontSize: 14 }} />} />
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div className="animate-fade-in space-y-4">
      {/* Commandes — carte distincte du tableau */}
      <Toolbar
        right={
          <>
            <Button icon={<FileExcelOutlined />} loading={importingExcel} onClick={() => excelInputRef.current?.click()}>
              Importer Excel
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>{t('s.nouveau_produit')}</Button>
          </>
        }
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('s.rechercher_par_designation_ou_reference_2')}
          width={260}
        />
        <Select
          value={filterCat}
          onChange={setFilterCat}
          options={['Tous', ...categories].map(c => ({ value: c, label: c }))}
          width={170}
        />
        <span className="text-[0.72rem] text-text-muted tabular-nums pl-1">{filtered.length} produits</span>

        <input ref={excelInputRef} type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelFileSelect} />
      </Toolbar>

      {/* Données */}
      <Panel noPadding>
        <Table
          columns={columns}
          data={filtered}
          emptyIcon={InboxOutlined}
          emptyTitle={t('s.aucun_produit')}
          emptyDescription={t('s.aucun_produit_ne_correspond_a_cette_recherch')}
        />
      </Panel>

      {/* Modal Ajout / Modification Produit */}
      {showModal && (
        <Modal
          title={editingProduct ? 'Modifier le Produit & Image' : 'Ajouter au Catalogue'}
          onClose={() => setShowModal(false)}
          footer={<div className="flex justify-end gap-3">
            <Button onClick={() => setShowModal(false)}>{t('s.annuler')}</Button>
            <Button type="primary" onClick={handleSave}>{t('s.enregistrer')}</Button>
          </div>}
        >
          <div className="space-y-4 p-1">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('s.reference_code')}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={t('s.ex_ref001')}
              />
              <Input
                label={t('s.designation_nom_complet')}
                value={form.designation}
                onChange={e => setForm({ ...form, designation: e.target.value })}
                placeholder={t('s.ex_riz_basmati_5kg')}
              />
            </div>
            
            {!isAddingNewCategory ? (
              <Select
                label={t('s.categorie')}
                value={form.category}
                onChange={val => {
                  if (val === 'ADD_NEW') setIsAddingNewCategory(true);
                  else setForm({ ...form, category: val });
                }}
                options={[...categories, { label: t('s.nouveau'), value: 'ADD_NEW' }]}
              />
            ) : (
              <div className="space-y-2">
                <Input
                  label={t('s.nouvelle_categorie')}
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  autoFocus
                />
                <button className="text-primary text-[0.7rem] font-bold uppercase hover:underline" onClick={() => setIsAddingNewCategory(false)}>
                  {t('s.annuler')}
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
                {t('s.article_hors_stock_echantillon_quantite_illi')}
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label={t('s.prix_de_vente')} type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              <Input label={t('s.prix_d_achat')} type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label={t('s.stock_initial')} type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} disabled={form.isNonInventory} />
              <Input label={t('s.stock_minimum')} type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} disabled={form.isNonInventory} />
            </div>
            
            {/* ImageUploader (Glisser-Déposer & Compression Auto & URL) */}
            <ImageUploader
              value={form.image}
              onChange={val => setForm({ ...form, image: val })}
            />
          </div>
        </Modal>
      )}

      {/* Modal Aperçu Importation Excel */}
      {excelPreview && (
        <Modal
          title={`Prévisualisation des produits Excel (${excelPreview.length} détecté(s))`}
          onClose={() => setExcelPreview(null)}
          footer={<div className="flex justify-end gap-3">
            <Button onClick={() => setExcelPreview(null)}>{t('s.annuler')}</Button>
            <Button type="primary" loading={savingImport} icon={<CheckCircleOutlined style={{ fontSize: 16 }} />} onClick={handleConfirmImport} className="bg-green-600 border-green-600 hover:bg-green-500" >
              {t('s.valider_et_importer_tout')}
            </Button>
          </div>}
        >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <p className="text-xs text-text-muted">
              {t('s.verifiez_ci_dessous_les_articles_extraits_de')}
            </p>
            <div className="space-y-2">
              {excelPreview.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/10 dark:bg-white/10 flex items-center justify-center shrink-0">
                    {item.image ? (
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <InboxOutlined style={{ fontSize: 20 }} className="opacity-30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-text-heading truncate">{item.designation || item.name}</span>
                      <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">{item.category}</span>
                    </div>
                    <div className="text-[0.7rem] text-text-muted flex gap-3 mt-0.5">
                      <span>Réf: {item.name}</span>
                      <span>Prix: {formatPrice(item.price)}</span>
                      <span>Stock: {item.stock}</span>
                    </div>
                  </div>
                  {item.image && (
                    <span className="text-[0.65rem] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full font-bold">
                      Image OK
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CatalogManagement;
