import React, { useState, useMemo } from 'react';
import { formatPrice } from '../../context/StoreContext';
import { useProducts, useStores, useSettings } from '../../hooks';
import Modal from '../common/Modal';
import Input from '../common/Input';
import MySelect from '../common/Select';
import { Plus, Trash2, Save, Printer, Package, User, FileText, Search, Store, PlusCircle, CheckCircle, List, History, Eye } from 'lucide-react';
import { Button, message, Popconfirm } from 'antd';
import CatalogManagement from './CatalogManagement';

const StockEntryPanel = () => {
  const { products, categories, bulkUpdateStock, addProduct, addCategory } = useProducts();
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

  const availableProducts = products;

  const filteredProducts = useMemo(() => {
    if (!searchTerm || isSaved) return [];
    return availableProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  }, [availableProducts, searchTerm, isSaved]);

  const filteredHistory = useMemo(() => {
    return stockEntries.filter(entry => 
      entry.reference.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      entry.supplier.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      entry.noteNumber.toLowerCase().includes(historySearchTerm.toLowerCase())
    ).filter(entry => entry.storeId === activeStoreId);
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

  const handleSave = () => {
    if (!supplier || !noteNumber || entryItems.length === 0) {
      message.error('Veuillez remplir les informations du fournisseur et ajouter des articles.');
      return;
    }

    bulkUpdateStock(entryItems, {
      supplier,
      noteNumber,
      reference: noteNumber || undefined,
      createdBy: currentStore?.name || 'Manager',
    });
    setIsSaved(true);
    message.success('Entrée de stock enregistrée avec succès ! Vous pouvez maintenant imprimer le bon.');
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

  return (
    <div className="animate-fade-in space-y-8">
      {/* Tab Switcher */}
      <div className="flex gap-1 p-1.5 bg-black/5 dark:bg-white/5 rounded-2xl w-fit border border-black/5 dark:border-white/5">
        <button 
          onClick={() => setActiveMode('reception')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeMode === 'reception' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text-primary'}`}
        >
          <PlusCircle size={18} />
          Réception de Marchandises
        </button>
        <button 
          onClick={() => setActiveMode('catalog')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeMode === 'catalog' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text-primary'}`}
        >
          <List size={18} />
          Gestion du Catalogue
        </button>
        <button 
          onClick={() => setActiveMode('history')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeMode === 'history' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text-primary'}`}
        >
          <History size={18} />
          Historique des Réceptions
        </button>
      </div>

      {activeMode === 'catalog' ? (
        <CatalogManagement />
      ) : activeMode === 'history' ? (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-bg-card border border-white/5 rounded-3xl p-8 shadow-xl no-print">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-text-heading tracking-tight">Historique des Bons d'Entrée</h3>
                <p className="text-text-muted text-sm mt-1">Consultez ou imprimez à nouveau les bons de réception passés.</p>
              </div>
              <div className="relative w-full md:w-64">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  className="w-full bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50"
                  placeholder="Rechercher fournisseur ou n°..."
                  value={historySearchTerm}
                  onChange={e => setHistorySearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/5">
              <table className="w-full text-left">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted">Date & N°</th>
                    <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted">Fournisseur / Réf</th>
                    <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted text-right">Articles</th>
                    <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted text-right">Montant Total</th>
                    <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredHistory.map(entry => (
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
                        <Button 
                          size="small" 
                          icon={<Eye size={14} />} 
                          onClick={() => setSelectedPastEntry(entry)}
                          className="rounded-lg bg-primary/10 text-primary border-none hover:bg-primary hover:text-black font-bold text-[0.7rem] uppercase tracking-widest mr-2"
                        >
                          Voir
                        </Button>
                        <Button 
                          size="small" 
                          icon={<Printer size={14} />} 
                          onClick={() => handlePrintPastEntry(entry)}
                          className="rounded-lg bg-white/5 text-text-heading border-none hover:bg-white/10 font-bold"
                        />
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center opacity-30 italic text-sm">
                        Aucun bon d'entrée trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
      <div className="bg-bg-card border border-white/5 rounded-3xl p-8 shadow-xl no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[0.65rem] font-black text-text-muted uppercase tracking-widest px-1">Fournisseur</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                className="w-full bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50"
                placeholder="Nom du fournisseur..."
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                disabled={isSaved}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[0.65rem] font-black text-text-muted uppercase tracking-widest px-1">N° Bon de Livraison</label>
            <div className="relative">
              <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                className="w-full bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50"
                placeholder="Ex: BL-2024-X"
                value={noteNumber}
                onChange={e => setNoteNumber(e.target.value)}
                disabled={isSaved}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[0.65rem] font-black text-text-muted uppercase tracking-widest px-1">Magasin de Réception</label>
            <div className="relative">
              <Store size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
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
      <div className="bg-bg-card border border-white/5 rounded-3xl p-8 shadow-xl no-print">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 space-y-2 relative">
            <label className="text-[0.65rem] font-black text-text-muted uppercase tracking-widest px-1">Rechercher un article à ajouter</label>
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                className="w-full bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50"
                placeholder="Taper le nom du produit..."
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
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary"><Package size={14} /></div>
                      <span className="font-bold text-text-heading">{p.name}</span>
                    </div>
                    <span className="text-[0.7rem] font-black text-primary uppercase">{formatPrice(p.cost)}</span>
                  </button>
                ))}
              </div>
            )}
            
            {searchTerm && filteredProducts.length === 0 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-bg-card border border-white/10 rounded-2xl p-4 shadow-2xl text-center">
                <p className="text-sm text-text-muted mb-3">Aucun produit ne correspond à "{searchTerm}"</p>
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<PlusCircle size={14} />}
                  onClick={() => {
                    setQuickForm({ ...quickForm, name: searchTerm });
                    setShowQuickAdd(true);
                  }}
                  className="rounded-lg bg-primary text-black border-none font-bold"
                >
                  Créer "{searchTerm}"
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            {!isSaved ? (
              <>
                <Button 
                  icon={<Plus size={18} />}
                  onClick={() => setShowQuickAdd(true)}
                  className="h-12 px-6 rounded-xl font-bold bg-white/5 border-white/10 text-text-heading hover:bg-white/10"
                >
                  Nouveau Produit
                </Button>
                <Popconfirm 
                  title="Voulez-vous vraiment enregistrer cette entrée ?" 
                  onConfirm={handleSave}
                  disabled={entryItems.length === 0}
                >
                  <Button 
                    type="primary" 
                    size="large" 
                    icon={<Save size={18} />}
                    className="h-12 px-8 rounded-xl font-bold bg-green-600 border-none"
                    disabled={entryItems.length === 0}
                  >
                    Valider l'Entrée
                  </Button>
                </Popconfirm>
              </>
            ) : (
              <Button 
                size="large" 
                icon={<PlusCircle size={18} />}
                onClick={resetForm}
                className="h-12 px-8 rounded-xl font-bold bg-primary text-black border-none"
              >
                Nouveau Bon de Réception
              </Button>
            )}
            
            <Button 
              size="large" 
              icon={<Printer size={18} />}
              onClick={handlePrint}
              disabled={entryItems.length === 0}
              className={`h-12 px-8 rounded-xl font-bold border-white/10 text-text-heading ${isSaved ? 'bg-blue-600 border-none' : 'bg-white/5 hover:bg-white/10'}`}
            >
              Imprimer Bon
            </Button>
          </div>
        </div>

        {isSaved && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 animate-bounce-subtle">
            <CheckCircle size={20} className="text-green-500" />
            <span className="text-green-500 font-bold text-sm uppercase tracking-widest">Entrée enregistrée avec succès - Prêt pour l'impression</span>
          </div>
        )}

        {/* Entry Table */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/5">
          <table className="w-full text-left">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted">Article</th>
                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted w-32">Quantité</th>
                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted w-48">Prix d'Achat Unitaire</th>
                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted">Total</th>
                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted w-16"></th>
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
                      <span className="text-[0.6rem] opacity-30 font-bold uppercase">FCFA</span>
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
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {entryItems.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center opacity-30 italic text-sm">
                    Aucun article ajouté. Recherchez un produit ci-dessus pour commencer.
                  </td>
                </tr>
              )}
            </tbody>
            {entryItems.length > 0 && (
              <tfoot className="bg-primary/5">
                <tr>
                  <td colSpan="3" className="px-6 py-5 text-right font-black text-text-muted uppercase tracking-widest text-[0.7rem]">Montant Total du Bon :</td>
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
          title="Création Rapide de Produit"
          onClose={() => setShowQuickAdd(false)}
          footer={<div className="flex justify-end gap-3">
            <Button onClick={() => setShowQuickAdd(false)}>Annuler</Button>
            <Button type="primary" onClick={handleQuickAdd} className="bg-primary text-black border-none font-bold">Créer le Produit</Button>
          </div>}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Référence du Produit"
                value={quickForm.name}
                onChange={e => setQuickForm({ ...quickForm, name: e.target.value })}
                placeholder="Ex: REF001"
              />
              <Input
                label="Désignation"
                value={quickForm.designation}
                onChange={e => setQuickForm({ ...quickForm, designation: e.target.value })}
                placeholder="Ex: Riz 50kg"
              />
            </div>
            {!isAddingNewCategory ? (
              <MySelect
                label="Catégorie"
                value={quickForm.category}
                onChange={val => {
                  if (val === 'ADD_NEW') {
                    setIsAddingNewCategory(true);
                  } else {
                    setQuickForm({ ...quickForm, category: val });
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
                label="Prix de Vente (PV)"
                type="number"
                value={quickForm.price}
                onChange={e => setQuickForm({ ...quickForm, price: e.target.value })}
                placeholder="0"
              />
              <Input
                label="Prix d'Achat (PA)"
                type="number"
                value={quickForm.cost}
                onChange={e => setQuickForm({ ...quickForm, cost: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5">
              <label className="text-[0.65rem] font-black text-text-muted uppercase tracking-widest px-1">Image du Produit</label>
              <div className="flex items-center gap-4 p-4 bg-black/5 dark:bg-white/5 border border-dashed border-black/20 dark:border-white/20 rounded-2xl">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center flex-shrink-0">
                  {quickForm.image ? (
                    <img src={quickForm.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Package size={20} className="opacity-20" />
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
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-black text-[0.6rem] font-black rounded-lg cursor-pointer hover:bg-primary/90 transition-all uppercase tracking-tighter"
                  >
                    Sélectionner Image
                  </label>
                </div>
                {quickForm.image && (
                  <button 
                    onClick={() => setQuickForm({ ...quickForm, image: '' })}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
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
              <Button onClick={() => setSelectedPastEntry(null)}>Fermer</Button>
              <Button 
                type="primary" 
                icon={<Printer size={16} />} 
                onClick={() => window.print()}
                className="bg-primary text-black border-none font-bold"
              >
                Imprimer ce Bon
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-5 p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 shadow-inner">
              <div>
                <p className="text-[0.7rem] font-black text-primary/80 uppercase tracking-widest mb-1">Fournisseur</p>
                <p className="font-black text-lg text-text-heading drop-shadow-sm">{selectedPastEntry.supplier}</p>
              </div>
              <div>
                <p className="text-[0.7rem] font-black text-primary/80 uppercase tracking-widest mb-1">Date</p>
                <p className="font-bold text-text-heading">{new Date(selectedPastEntry.date).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-[0.7rem] font-black text-primary/80 uppercase tracking-widest mb-1">N° BL / Référence</p>
                <p className="font-bold text-text-heading">{selectedPastEntry.noteNumber || selectedPastEntry.reference}</p>
              </div>
              <div>
                <p className="text-[0.7rem] font-black text-primary/80 uppercase tracking-widest mb-1">Magasin</p>
                <p className="font-bold text-text-heading">{stores.find(s => s.id === selectedPastEntry.storeId)?.name}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-primary/20 bg-white/5 shadow-xl">
              <table className="w-full text-left">
                <thead className="bg-primary/10 border-b border-primary/20">
                  <tr>
                    <th className="px-5 py-4 text-[0.7rem] font-black uppercase tracking-widest text-primary">Article</th>
                    <th className="px-5 py-4 text-[0.7rem] font-black uppercase tracking-widest text-primary text-center">Qté</th>
                    <th className="px-5 py-4 text-[0.7rem] font-black uppercase tracking-widest text-primary text-right">Prix Achat</th>
                    <th className="px-5 py-4 text-[0.7rem] font-black uppercase tracking-widest text-primary text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {selectedPastEntry.items.map(item => (
                    <tr key={item.productId} className="hover:bg-primary/5 transition-colors">
                      <td className="px-5 py-4 font-bold text-sm text-text-heading">{item.name}</td>
                      <td className="px-5 py-4 text-center font-bold text-sm bg-primary/5">{item.quantity}</td>
                      <td className="px-5 py-4 text-right font-medium text-sm text-text-heading">{formatPrice(item.cost)}</td>
                      <td className="px-5 py-4 text-right font-black text-sm text-primary">{formatPrice(item.quantity * item.cost)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gradient-to-r from-primary/10 to-primary/20 border-t border-primary/20">
                  <tr>
                    <td colSpan="3" className="px-5 py-5 text-right font-black text-primary/80 uppercase tracking-widest text-[0.7rem]">Montant Total :</td>
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
          <h1 style={{ margin: 0, fontSize: '28pt' }}>{companySettings?.name || 'STOCK EXPERT'}</h1>
          <h2 style={{ margin: '10px 0', fontSize: '18pt' }}>BON D'ENTRÉE DE MARCHANDISE</h2>
          <p style={{ fontSize: '10pt', color: '#666' }}>Document de réception de stock</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
          <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '8pt', fontWeight: 'bold', color: '#888' }}>FOURNISSEUR</p>
            <p style={{ margin: 0, fontSize: '14pt', fontWeight: 'bold' }}>{(activeMode === 'history' && selectedPastEntry) ? selectedPastEntry.supplier : (supplier || 'Non spécifié')}</p>
          </div>
          <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '8pt', fontWeight: 'bold', color: '#888' }}>INFORMATIONS BON</p>
            <p style={{ margin: '0 0 5px 0' }}><strong>N° Bon Livraison :</strong> {(activeMode === 'history' && selectedPastEntry) ? selectedPastEntry.noteNumber : (noteNumber || 'N/A')}</p>
            <p style={{ margin: '0 0 5px 0' }}><strong>Date :</strong> {(activeMode === 'history' && selectedPastEntry) ? new Date(selectedPastEntry.date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</p>
            <p style={{ margin: 0 }}><strong>Magasin :</strong> {(activeMode === 'history' && selectedPastEntry) ? stores.find(s => s.id === selectedPastEntry.storeId)?.name : currentStore?.name}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Désignation de l'Article</th>
              <th>Quantité</th>
              <th>Prix d'Achat Unit.</th>
              <th>Total Ligne</th>
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
              <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '12pt' }}>MONTANT TOTAL GÉNÉRAL :</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '14pt' }}>{formatPrice((activeMode === 'history' && selectedPastEntry) ? selectedPastEntry.totalCost : totalAmount)}</td>
            </tr>
          </tfoot>
        </table>

        <div style={{ marginTop: '80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '100px', textAlign: 'center' }}>
          <div>
            <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Le Chef d'Agence</p>
            <p style={{ fontSize: '8pt', color: '#aaa', marginTop: '60px' }}>(Signature et Cachet)</p>
          </div>
          <div>
            <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Le Chef Magasinier</p>
            <p style={{ fontSize: '8pt', color: '#aaa', marginTop: '60px' }}>(Signature et Cachet)</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StockEntryPanel;
