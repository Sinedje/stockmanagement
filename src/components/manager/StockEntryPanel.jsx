import { useT } from '../../i18n/I18nContext';
import { Toolbar, Panel, SearchInput } from '../ui';
import React, { useState, useMemo } from 'react';
import Pagination from '../common/Pagination';
import { usePagination } from '../../hooks';
import { formatPrice } from '../../context/StoreContext';
import { useProducts, useStores, useSettings } from '../../hooks';
import Modal from '../common/Modal';
import Input from '../common/Input';
import MySelect from '../common/Select';
import { CheckCircleOutlined, DeleteOutlined, EyeOutlined, FileTextOutlined, HistoryOutlined, InboxOutlined, PlusCircleOutlined, PlusOutlined, PrinterOutlined, SaveOutlined, SearchOutlined, ShopOutlined, UnorderedListOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Segmented, message } from 'antd';
import CatalogManagement from './CatalogManagement';

const StockEntryPanel = () => {
  const t = useT();
  const { products, allProducts, categories, bulkUpdateStock, receiveStock, addProduct, addCategory } = useProducts();
  const { stores, activeStoreId, stockEntries } = useStores();
  const { companySettings } = useSettings();
  const [supplier, setSupplier] = useState('');
  const [noteNumber, setNoteNumber] = useState('');
  const [entryItems, setEntryItems] = useState([]); // { productId, name, quantity, cost }
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickForm, setQuickForm] = useState({ name: '', designation: '', category: '', price: '', cost: '', image: '' });
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [activeMode, setActiveMode] = useState('reception'); // 'reception', 'catalog', 'history'
  
  // States for History
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [selectedPastEntry, setSelectedPastEntry] = useState(null);

  const currentStore = stores.find(s => s.id === activeStoreId);

  const availableProducts = useMemo(() => {
    const uniqueMap = new Map();
    allProducts.forEach(p => {
      const nameKey = p.name.toLowerCase().trim();
      const existing = uniqueMap.get(nameKey);
      // Prefer the product from the current store if there are duplicates across stores
      if (!existing || p.storeId === activeStoreId) {
        uniqueMap.set(nameKey, p);
      }
    });
    return Array.from(uniqueMap.values());
  }, [allProducts, activeStoreId]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm || isSaved) return [];
    return availableProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.designation && p.designation.toLowerCase().includes(searchTerm.toLowerCase()))
    ).slice(0, 5);
  }, [availableProducts, searchTerm, isSaved]);

  const filteredHistory = useMemo(() => {
    return stockEntries
      .map(entry => ({
        ...entry,
        reference: entry.reference || entry.noteNumber || entry.id,
        totalCost: entry.totalCost ?? entry.items?.reduce((s, i) => s + (i.quantity * (i.cost || 0)), 0) ?? 0,
      }))
      .filter(entry =>
        (entry.reference?.toLowerCase() || '').includes(historySearchTerm.toLowerCase()) ||
        (entry.supplier?.toLowerCase() || '').includes(historySearchTerm.toLowerCase()) ||
        (entry.noteNumber?.toLowerCase() || '').includes(historySearchTerm.toLowerCase())
      )
      .filter(entry => String(entry.storeId) === String(activeStoreId));
  }, [stockEntries, historySearchTerm, activeStoreId]);

  const addRow = (product) => {
    if (isSaved) return;
    if (entryItems.find(item => item.productId === product.id)) {
      message.warning('Ce produit est déjà dans la liste');
      return;
    }
    setEntryItems([...entryItems, { 
      productId: product.id, 
      name: product.name, 
      quantity: 1, 
      cost: product.cost 
    }]);
    setSearchTerm('');
  };

  const resetForm = () => {
    setEntryItems([]);
    setSupplier('');
    setNoteNumber('');
    setIsSaved(false);
    setSearchTerm('');
  };

  const handleQuickAdd = () => {
    let finalCategory = quickForm.category;
    
    if (isAddingNewCategory && newCategory.trim()) {
      addCategory(newCategory.trim());
      finalCategory = newCategory.trim();
    }

    if (!quickForm.name || !finalCategory || !quickForm.price) {
      message.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    // Create product in global state
    const newProd = {
      ...quickForm,
      category: finalCategory,
      price: Number(quickForm.price),
      cost: Number(quickForm.cost || 0),
      stock: 0, 
      minStock: 5,
      image: quickForm.image
    };

    addProduct(newProd);
    
    setShowQuickAdd(false);
    setQuickForm({ name: '', designation: '', category: '', price: '', cost: '', image: '' });
    setNewCategory('');
    setIsAddingNewCategory(false);
    message.success('Produit créé avec succès !');
  };

  const removeRow = (productId) => {
    setEntryItems(entryItems.filter(item => item.productId !== productId));
  };

  const updateItem = (productId, field, value) => {
    setEntryItems(entryItems.map(item => 
      item.productId === productId ? { ...item, [field]: value } : item
    ));
  };

  const handleSave = async () => {
    if (!supplier || !noteNumber || entryItems.length === 0) {
      message.error('Veuillez remplir les informations du fournisseur et ajouter des articles.');
      return;
    }

    try {
      await receiveStock(entryItems, {
        supplier,
        noteNumber,
        storeId: activeStoreId,
        reference: noteNumber || undefined,
        createdBy: currentStore?.name || 'Manager',
      });
      setIsSaved(true);
      message.success('Entrée de stock enregistrée avec succès ! Vous pouvez maintenant imprimer le bon.');
    } catch (err) {
      message.error(`Erreur lors de l'enregistrement : ${err.message}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintPastEntry = (entry) => {
    setSelectedPastEntry(entry);
    // Short delay to allow modal rendering then trigger print
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const totalAmount = entryItems.reduce((sum, item) => sum + (item.quantity * item.cost), 0);

  // Pagination : le tableau n'affiche que 20 lignes à la fois.
  const { page, setPage, pageCount, total, pageSize, pageItems } = usePagination(filteredHistory);

  return (
    <div className="animate-fade-in space-y-4">
      {/* Bascule de mode — même Toolbar que les autres écrans */}
      <Toolbar>
        <Segmented
          value={activeMode}
          onChange={setActiveMode}
          options={[
            { value: 'reception', label: <span className="flex items-center gap-1.5"><PlusCircleOutlined /> {t('s.reception')}</span> },
            { value: 'catalog', label: <span className="flex items-center gap-1.5"><UnorderedListOutlined /> {t('s.catalogue')}</span> },
            { value: 'history', label: <span className="flex items-center gap-1.5"><HistoryOutlined /> {t('s.historique')}</span> },
          ]}
        />
      </Toolbar>

      {activeMode === 'catalog' ? (
        <CatalogManagement />
      ) : activeMode === 'history' ? (
        <div className="space-y-4 animate-fade-in">
          <Toolbar className="no-print">
            <SearchInput
              value={historySearchTerm}
              onChange={setHistorySearchTerm}
              placeholder={t('s.rechercher_fournisseur_ou_n')}
              width={260}
            />
          </Toolbar>

          <Panel title={t('s.historique_des_bons_d_entree')} icon={HistoryOutlined} noPadding className="no-print">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[640px] text-left text-[0.8rem]">
                <thead className="bg-black/5 dark:bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-[0.65rem] font-semibold uppercase tracking-widest text-text-muted">{t('s.date_n')}</th>
                    <th className="px-6 py-4 text-[0.65rem] font-semibold uppercase tracking-widest text-text-muted">{t('s.fournisseur_ref')}</th>
                    <th className="px-6 py-4 text-[0.65rem] font-semibold uppercase tracking-widest text-text-muted text-right">{t('s.articles')}</th>
                    <th className="px-6 py-4 text-[0.65rem] font-semibold uppercase tracking-widest text-text-muted text-right">{t('s.montant_total')}</th>
                    <th className="px-6 py-4 text-[0.65rem] font-semibold uppercase tracking-widest text-text-muted text-right">{t('s.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pageItems.map(entry => (
                    <tr key={entry.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <div className="font-bold text-text-heading">{new Date(entry.date).toLocaleDateString('fr-FR')}</div>
                        <div className="text-[0.65rem] font-bold text-text-muted uppercase mt-0.5">{entry.reference}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-text-heading">{entry.supplier}</div>
                        <div className="text-[0.65rem] text-text-muted font-medium mt-0.5">BL: {entry.noteNumber}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-text-heading">
                        {entry.items.length} article(s)
                      </td>
                      <td className="px-6 py-4 text-right font-black text-primary">
                        {formatPrice(entry.totalCost)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button icon={<EyeOutlined style={{ fontSize: 14 }} />} onClick={() => setSelectedPastEntry(entry)} className="bg-primary/10 text-primary border-none hover:bg-primary hover:text-white mr-2" >
                          Voir
                        </Button>
                        <Button icon={<PrinterOutlined style={{ fontSize: 14 }} />} onClick={() => handlePrintPastEntry(entry)} className="bg-white/5 text-text-heading border-none hover:bg-white/10" />
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center opacity-30 italic text-sm">
                        {t('s.aucun_bon_d_entree_trouve')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} label={t('s.entrees')} />
          </Panel>
        </div>
      ) : (
        <div className="space-y-6">
      <style>
        {`
          .print-only { display: none; }
          @media print {
            body * { visibility: hidden; }
            #reception-note, #reception-note * { visibility: visible; }
            #reception-note {
              display: block !important;
              position: absolute; left: 0; top: 0; width: 100%;
              color: black !important; background: white !important;
              padding: 40px;
            }
            .no-print { display: none !important; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; color: black !important; }
            th, td { border: 1px solid #000; padding: 10px; text-align: left; }
            th { background-color: #f2f2f2 !important; -webkit-print-color-adjust: exact; }
          }
        `}
      </style>

      {/* Header Info */}
      <div className="glass-panel rounded-xl p-4 sm:p-5 shadow-sm no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest px-1">{t('s.fournisseur_2')}</label>
            <div className="relative">
              <UserOutlined style={{ fontSize: 16 }} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                className="w-full bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50"
                placeholder={t('s.nom_du_fournisseur_2')}
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                disabled={isSaved}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest px-1">{t('s.n_bon_de_livraison')}</label>
            <div className="relative">
              <FileTextOutlined style={{ fontSize: 16 }} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                className="w-full bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50"
                placeholder={t('s.ex_bl_2024_x')}
                value={noteNumber}
                onChange={e => setNoteNumber(e.target.value)}
                disabled={isSaved}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest px-1">{t('s.magasin_de_reception')}</label>
            <div className="relative">
              <ShopOutlined style={{ fontSize: 16 }} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                className="w-full bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm opacity-50 cursor-not-allowed"
                value={currentStore?.name || ''}
                disabled
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product Selection */}
      <div className="glass-panel rounded-xl p-4 sm:p-5 shadow-sm no-print">
        <div className="flex flex-col md:flex-row gap-4 md:gap-4 items-stretch md:items-end">
          <div className="w-full md:flex-1 space-y-2 relative">
            <label className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest px-1">{t('s.rechercher_un_article_a_ajouter')}</label>
            <div className="relative">
              <SearchOutlined style={{ fontSize: 18 }} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                className="w-full bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50"
                placeholder={t('s.taper_le_nom_du_produit')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            {filteredProducts.length > 0 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                {filteredProducts.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => addRow(p)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-primary/10 transition-colors border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary"><InboxOutlined style={{ fontSize: 14 }} /></div>
                      <span className="font-bold text-text-heading">{p.name}</span>
                    </div>
                    <span className="text-[0.7rem] font-semibold text-primary uppercase">{formatPrice(p.cost)}</span>
                  </button>
                ))}
              </div>
            )}
            
            {searchTerm && filteredProducts.length === 0 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-bg-card border border-white/10 rounded-2xl p-4 shadow-2xl text-center">
                <p className="text-sm text-text-muted mb-3">Aucun produit ne correspond à "{searchTerm}"</p>
                <Button type="primary" icon={<PlusCircleOutlined style={{ fontSize: 14 }} />} onClick={() => { setQuickForm({ ...quickForm, name: searchTerm }); setShowQuickAdd(true); }} className="bg-primary text-white border-none" >
                  Créer "{searchTerm}"
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {!isSaved ? (
              <>
                <Button icon={<PlusOutlined style={{ fontSize: 18 }} />} onClick={() => setShowQuickAdd(true)} className="bg-white/5 border-white/10 text-text-heading hover:bg-white/10" >
                  {t('s.nouveau_produit_2')}
                </Button>
                <Popconfirm 
                  title={t('s.voulez_vous_vraiment_enregistrer_cette_entre')} 
                  onConfirm={handleSave}
                  disabled={entryItems.length === 0}
                >
                  <Button type="primary" icon={<SaveOutlined style={{ fontSize: 18 }} />} className="bg-green-600 border-none" disabled={entryItems.length === 0} >
                    {t('s.valider_l_entree')}
                  </Button>
                </Popconfirm>
              </>
            ) : (
              <Button icon={<PlusCircleOutlined style={{ fontSize: 18 }} />} onClick={resetForm} className="bg-primary text-white border-none" >
                {t('s.nouveau_bon_de_reception')}
              </Button>
            )}
            
            <Button icon={<PrinterOutlined style={{ fontSize: 18 }} />} onClick={handlePrint} disabled={entryItems.length === 0} className={isSaved ? 'bg-blue-600 border-none text-white' : ''} >
              {t('s.imprimer_bon')}
            </Button>
          </div>
        </div>

        {isSaved && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 animate-bounce-subtle">
            <CheckCircleOutlined style={{ fontSize: 20 }} className="text-green-500" />
            <span className="text-green-500 font-bold text-sm uppercase tracking-widest">{t('s.entree_enregistree_avec_succes_pret_pour_l_i')}</span>
          </div>
        )}

        {/* Entry Table */}
        <div className="mt-8 overflow-x-auto custom-scrollbar rounded-2xl border border-white/5">
          <table className="w-full min-w-[600px] text-left">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr>
                <th className="px-6 py-4 text-[0.65rem] font-semibold uppercase tracking-widest text-text-muted">{t('s.article')}</th>
                <th className="px-6 py-4 text-[0.65rem] font-semibold uppercase tracking-widest text-text-muted w-32">{t('s.quantite')}</th>
                <th className="px-6 py-4 text-[0.65rem] font-semibold uppercase tracking-widest text-text-muted w-48">{t('s.prix_d_achat_unitaire')}</th>
                <th className="px-6 py-4 text-[0.65rem] font-semibold uppercase tracking-widest text-text-muted">{t('s.total')}</th>
                <th className="px-6 py-4 text-[0.65rem] font-semibold uppercase tracking-widest text-text-muted w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {entryItems.map(item => (
                <tr key={item.productId} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-bold text-text-heading">{item.name}</td>
                  <td className="px-6 py-4">
                    <input 
                      type="number"
                      min="1"
                      className="w-20 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold text-primary focus:outline-none focus:border-primary/50 disabled:opacity-50"
                      value={item.quantity}
                      onChange={e => updateItem(item.productId, 'quantity', parseInt(e.target.value) || 0)}
                      disabled={isSaved}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <input 
                        type="number"
                        className="w-32 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold text-text-heading focus:outline-none focus:border-primary/50 disabled:opacity-50"
                        value={item.cost}
                        onChange={e => updateItem(item.productId, 'cost', parseInt(e.target.value) || 0)}
                        disabled={isSaved}
                      />
                      <span className="text-[0.6rem] opacity-30 font-bold uppercase">{t('s.fcfa')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-text-heading">
                    {formatPrice(item.quantity * item.cost)}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => removeRow(item.productId)}
                      className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <DeleteOutlined style={{ fontSize: 16 }} />
                    </button>
                  </td>
                </tr>
              ))}
              {entryItems.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center opacity-30 italic text-sm">
                    {t('s.aucun_article_ajoute_recherchez_un_produit_c')}
                  </td>
                </tr>
              )}
            </tbody>
            {entryItems.length > 0 && (
              <tfoot className="bg-primary/5">
                <tr>
                  <td colSpan="3" className="px-6 py-5 text-right font-semibold text-text-muted uppercase tracking-widest text-[0.7rem]">{t('s.montant_total_du_bon')}</td>
                  <td colSpan="2" className="px-6 py-5 text-xl font-black text-primary">{formatPrice(totalAmount)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* END Reception Mode Content */}
      </div>
      )}

      {showQuickAdd && (
        <Modal
          title={t('s.creation_rapide_de_produit')}
          onClose={() => setShowQuickAdd(false)}
          footer={<div className="flex justify-end gap-3">
            <Button onClick={() => setShowQuickAdd(false)}>{t('s.annuler')}</Button>
            <Button type="primary" onClick={handleQuickAdd} className="bg-primary text-white border-none">{t('s.creer_le_produit')}</Button>
          </div>}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('s.reference_du_produit')}
                value={quickForm.name}
                onChange={e => setQuickForm({ ...quickForm, name: e.target.value })}
                placeholder={t('s.ex_ref001')}
              />
              <Input
                label={t('s.designation')}
                value={quickForm.designation}
                onChange={e => setQuickForm({ ...quickForm, designation: e.target.value })}
                placeholder={t('s.ex_riz_50kg')}
              />
            </div>
            {!isAddingNewCategory ? (
              <MySelect
                label={t('s.categorie')}
                value={quickForm.category}
                onChange={val => {
                  if (val === 'ADD_NEW') {
                    setIsAddingNewCategory(true);
                  } else {
                    setQuickForm({ ...quickForm, category: val });
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
                label={t('s.prix_de_vente_pv')}
                type="number"
                value={quickForm.price}
                onChange={e => setQuickForm({ ...quickForm, price: e.target.value })}
                placeholder="0"
              />
              <Input
                label={t('s.prix_d_achat_pa')}
                type="number"
                value={quickForm.cost}
                onChange={e => setQuickForm({ ...quickForm, cost: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5">
              <label className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest px-1">{t('s.image_du_produit')}</label>
              <div className="flex items-center gap-4 p-4 bg-black/5 dark:bg-white/5 border border-dashed border-black/20 dark:border-white/20 rounded-2xl">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center flex-shrink-0">
                  {quickForm.image ? (
                    <img src={quickForm.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <InboxOutlined style={{ fontSize: 20 }} className="opacity-20" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <input
                    type="file"
                    accept="image/*"
                    id="quick-product-image"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setQuickForm({ ...quickForm, image: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label 
                    htmlFor="quick-product-image"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-[0.6rem] font-semibold rounded-lg cursor-pointer hover:bg-primary/90 transition-all uppercase tracking-tighter"
                  >
                    {t('s.selectionner_image')}
                  </label>
                </div>
                {quickForm.image && (
                  <button 
                    onClick={() => setQuickForm({ ...quickForm, image: '' })}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <DeleteOutlined style={{ fontSize: 14 }} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {selectedPastEntry && activeMode === 'history' && (
        <Modal
          title={`Détails du Bon d'Entrée - ${selectedPastEntry.reference}`}
          onClose={() => setSelectedPastEntry(null)}
          footer={
            <div className="flex justify-end gap-3">
              <Button onClick={() => setSelectedPastEntry(null)}>{t('s.fermer')}</Button>
              <Button type="primary" icon={<PrinterOutlined style={{ fontSize: 16 }} />} onClick={() => window.print()} className="bg-primary text-white border-none" >
                {t('s.imprimer_ce_bon')}
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-5 p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 shadow-inner">
              <div>
                <p className="text-[0.7rem] font-semibold text-primary/80 uppercase tracking-widest mb-1">{t('s.fournisseur_2')}</p>
                <p className="font-black text-lg text-text-heading drop-shadow-sm">{selectedPastEntry.supplier}</p>
              </div>
              <div>
                <p className="text-[0.7rem] font-semibold text-primary/80 uppercase tracking-widest mb-1">{t('s.date')}</p>
                <p className="font-bold text-text-heading">{new Date(selectedPastEntry.date).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-[0.7rem] font-semibold text-primary/80 uppercase tracking-widest mb-1">{t('s.n_bl_reference')}</p>
                <p className="font-bold text-text-heading">{selectedPastEntry.noteNumber || selectedPastEntry.reference}</p>
              </div>
              <div>
                <p className="text-[0.7rem] font-semibold text-primary/80 uppercase tracking-widest mb-1">{t('s.magasin')}</p>
                <p className="font-bold text-text-heading">{stores.find(s => s.id === selectedPastEntry.storeId)?.name}</p>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar rounded-xl border border-primary/20 bg-white/5 shadow-sm">
              <table className="w-full min-w-[500px] text-left">
                <thead className="bg-primary/10 border-b border-primary/20">
                  <tr>
                    <th className="px-5 py-4 text-[0.7rem] font-semibold uppercase tracking-widest text-primary">{t('s.article')}</th>
                    <th className="px-5 py-4 text-[0.7rem] font-semibold uppercase tracking-widest text-primary text-center">{t('s.qte')}</th>
                    <th className="px-5 py-4 text-[0.7rem] font-semibold uppercase tracking-widest text-primary text-right">{t('s.prix_achat')}</th>
                    <th className="px-5 py-4 text-[0.7rem] font-semibold uppercase tracking-widest text-primary text-right">{t('s.total')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {selectedPastEntry.items.map(item => (
                    <tr key={item.productId} className="hover:bg-primary/5 transition-colors">
                      <td className="px-5 py-4 font-bold text-sm text-text-heading">{item.name}</td>
                      <td className="px-5 py-4 text-center font-bold text-sm bg-primary/5">{item.quantity}</td>
                      <td className="px-5 py-4 text-right font-medium text-sm text-text-heading">{formatPrice(item.cost)}</td>
                      <td className="px-5 py-4 text-right font-semibold text-sm text-primary">{formatPrice(item.quantity * item.cost)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gradient-to-r from-primary/10 to-primary/20 border-t border-primary/20">
                  <tr>
                    <td colSpan="3" className="px-5 py-5 text-right font-semibold text-primary/80 uppercase tracking-widest text-[0.7rem]">{t('s.montant_total_2')}</td>
                    <td className="px-5 py-5 text-right font-black text-primary text-xl drop-shadow-md">{formatPrice(selectedPastEntry.totalCost)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {/* Hidden Reception Note for Printing - Always rendered in the DOM but hidden */}
      <style>
        {`
          .print-only { display: none; }
          @media print {
            body * { visibility: hidden; }
            #reception-note, #reception-note * { visibility: visible; }
            #reception-note {
              display: block !important;
              position: absolute; left: 0; top: 0; width: 100%;
              color: black !important; background: white !important;
              padding: 40px;
            }
            .no-print { display: none !important; }
            #reception-note table { width: 100%; border-collapse: collapse; margin-top: 20px; color: black !important; }
            #reception-note th, #reception-note td { border: 1px solid #000; padding: 10px; text-align: left; }
            #reception-note th { background-color: #f2f2f2 !important; -webkit-print-color-adjust: exact; }
          }
        `}
      </style>
      <div id="reception-note" className="print-only">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ margin: 0, fontSize: '28pt', textTransform: 'uppercase' }}>
            {((activeMode === 'history' && selectedPastEntry) 
              ? stores.find(s => s.id === selectedPastEntry.storeId)?.name 
              : currentStore?.name) || 'STOCK EXPERT'}
          </h1>
          <h2 style={{ margin: '10px 0', fontSize: '18pt' }}>{t('s.bon_d_entree_de_marchandise')}</h2>
          <p style={{ fontSize: '10pt', color: '#666' }}>{t('s.document_de_reception_de_stock')}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
          <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '8pt', fontWeight: 'bold', color: '#888' }}>{t('s.fournisseur')}</p>
            <p style={{ margin: 0, fontSize: '14pt', fontWeight: 'bold' }}>{(activeMode === 'history' && selectedPastEntry) ? selectedPastEntry.supplier : (supplier || 'Non spécifié')}</p>
          </div>
          <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '8pt', fontWeight: 'bold', color: '#888' }}>{t('s.informations_bon')}</p>
            <p style={{ margin: '0 0 5px 0' }}><strong>{t('s.n_bon_livraison')}</strong> {(activeMode === 'history' && selectedPastEntry) ? selectedPastEntry.noteNumber : (noteNumber || 'N/A')}</p>
            <p style={{ margin: '0 0 5px 0' }}><strong>{t('s.date_2')}</strong> {(activeMode === 'history' && selectedPastEntry) ? new Date(selectedPastEntry.date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</p>
            <p style={{ margin: 0 }}><strong>{t('s.magasin_2')}</strong> {(activeMode === 'history' && selectedPastEntry) ? stores.find(s => s.id === selectedPastEntry.storeId)?.name : currentStore?.name}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>{t('s.designation_de_l_article')}</th>
              <th>{t('s.quantite')}</th>
              <th>{t('s.prix_d_achat_unit')}</th>
              <th>{t('s.total_ligne')}</th>
            </tr>
          </thead>
          <tbody>
            {((activeMode === 'history' && selectedPastEntry) ? selectedPastEntry.items : entryItems).map(item => (
              <tr key={item.productId}>
                <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{formatPrice(item.cost)}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatPrice(item.quantity * item.cost)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '12pt' }}>{t('s.montant_total_general')}</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '14pt' }}>{formatPrice((activeMode === 'history' && selectedPastEntry) ? selectedPastEntry.totalCost : totalAmount)}</td>
            </tr>
          </tfoot>
        </table>

        <div style={{ marginTop: '80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '100px', textAlign: 'center' }}>
          <div>
            <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{t('s.le_chef_d_agence')}</p>
            <p style={{ fontSize: '8pt', color: '#aaa', marginTop: '60px' }}>(Signature et Cachet)</p>
          </div>
          <div>
            <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{t('s.le_chef_magasinier')}</p>
            <p style={{ fontSize: '8pt', color: '#aaa', marginTop: '60px' }}>(Signature et Cachet)</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StockEntryPanel;
