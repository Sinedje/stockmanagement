import React, { useState } from 'react';
import { formatPrice } from '../../context/StoreContext';
import { useProducts, useBreakages } from '../../hooks';
import DataTable from '../common/DataTable';
import Select from '../common/Select';
import Input from '../common/Input';
import { Button, message, Tabs, Alert } from 'antd';
import { AlertTriangle, PackageOpen, ArrowRight } from 'lucide-react';

const BreakagePanel = () => {
  const { products } = useProducts();
  const {
    breakages,
    repackagings,
    declareBreakage,
    createRepackaging
  } = useBreakages();

  const [activeTab, setActiveTab] = useState('declare');

  // État Déclaration de casse
  const [breakageProductId, setBreakageProductId] = useState('');
  const [breakageQuantity, setBreakageQuantity] = useState('');
  const [breakageReason, setBreakageReason] = useState('Manutention');

  // État Reconditionnement
  const [repackBrokenProductId, setRepackBrokenProductId] = useState('');
  const [repackBrokenQty, setRepackBrokenQty] = useState('');
  const [repackNewName, setRepackNewName] = useState('');
  const [repackNewQty, setRepackNewQty] = useState('');
  const [repackNewPrice, setRepackNewPrice] = useState('');

  // Options pour sélection
  const regularProducts = products.filter(p => !p.isNonInventory && !p.isBreakage && !p.isRepackaged && p.stock > 0);
  const brokenProducts = products.filter(p => p.isBreakage && p.stock > 0);

  const handleDeclareBreakage = () => {
    if (!breakageProductId || !breakageQuantity) {
      message.error('Veuillez sélectionner un produit et indiquer une quantité.');
      return;
    }
    const qty = parseInt(breakageQuantity, 10);
    const prod = products.find(p => p.id === parseInt(breakageProductId, 10));
    if (qty > prod.stock) {
      message.error(`Quantité supérieure au stock disponible (${prod.stock}).`);
      return;
    }

    declareBreakage(prod.id, qty, breakageReason);
    message.success(`${qty} carton(s) déclaré(s) en casse. Les cartons cassés sont désormais vendables ou reconditionnables.`);
    setBreakageProductId('');
    setBreakageQuantity('');
    setBreakageReason('Manutention');
  };

  const handleCreateRepackaging = () => {
    if (!repackBrokenProductId || !repackBrokenQty || !repackNewName || !repackNewQty || !repackNewPrice) {
      message.error('Veuillez remplir tous les champs du formulaire.');
      return;
    }
    const brokenQty = parseInt(repackBrokenQty, 10);
    const prod = products.find(p => p.id === parseInt(repackBrokenProductId, 10));
    if (brokenQty > prod.stock) {
      message.error(`Vous n'avez que ${prod.stock} cartons cassés disponibles.`);
      return;
    }

    createRepackaging(
      prod.id,
      brokenQty,
      repackNewName,
      parseInt(repackNewQty, 10),
      parseFloat(repackNewPrice)
    );
    message.success(`Reconditionnement réussi. Le produit "${repackNewName}" a été ajouté au catalogue.`);
    setRepackBrokenProductId('');
    setRepackBrokenQty('');
    setRepackNewName('');
    setRepackNewQty('');
    setRepackNewPrice('');
  };

  const breakageColumns = [
    { key: 'date', title: 'Date', render: (val) => new Date(val).toLocaleDateString('fr-FR') },
    { key: 'productName', title: 'Produit', render: (val) => <span className="font-semibold">{val}</span> },
    { key: 'quantity', title: 'Quantité Cassée', render: (val) => <span className="text-red-500 font-bold">{val}</span> },
    { key: 'reason', title: 'Motif', render: (val) => <span className="text-sm">{val}</span> },
    { key: 'costValue', title: 'Perte Estimée (Coût)', render: (val) => <span className="text-text-muted">{formatPrice(val)}</span> },
    { key: 'createdBy', title: 'Déclaré par' },
  ];

  const repackagingColumns = [
    { key: 'date', title: 'Date', render: (val) => new Date(val).toLocaleDateString('fr-FR') },
    { key: 'sourceProductName', title: 'Casses Utilisées', render: (val) => <span className="font-semibold text-orange-500">{val}</span> },
    { key: 'sourceQuantity', title: 'Qté Utilisée', render: (val) => <span className="font-bold">{val}</span> },
    { key: 'arrow', title: '', render: () => <ArrowRight size={14} className="text-text-muted mx-auto" /> },
    { key: 'targetProductName', title: 'Nouveau Produit (Sacs)', render: (val) => <span className="font-semibold text-emerald-500">{val}</span> },
    { key: 'targetQuantity', title: 'Qté Créée', render: (val) => <span className="font-bold text-emerald-500">{val}</span> },
    { key: 'createdBy', title: 'Opérateur' },
  ];

  const items = [
    {
      key: 'declare',
      label: <span className="font-bold uppercase tracking-wider flex items-center gap-2"><AlertTriangle size={16} /> Déclarer Casses</span>,
      children: (
        <div className="space-y-6">
          <Alert 
            message="Comment ça marche ?" 
            description="La déclaration de casse retire les cartons du stock normal et crée automatiquement un produit '[Casse]' dans le catalogue. Ces cartons cassés peuvent être vendus directement ou gardés pour être reconditionnés plus tard."
            type="info" 
            showIcon 
          />
          
          <div className="bg-bg-card border border-black/10 dark:border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-black text-text-heading mb-4">Nouvelle Déclaration de Casse</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <Select
                  label="Produit Endommagé"
                  value={breakageProductId}
                  onChange={setBreakageProductId}
                  options={regularProducts.map(p => ({ label: `${p.name} (Stock: ${p.stock})`, value: p.id }))}
                />
              </div>
              <Input
                label="Quantité"
                type="number"
                min="1"
                value={breakageQuantity}
                onChange={e => setBreakageQuantity(e.target.value)}
              />
              <Select
                label="Motif"
                value={breakageReason}
                onChange={setBreakageReason}
                options={[
                  { label: 'Manutention', value: 'Manutention' },
                  { label: 'Transport', value: 'Transport' },
                  { label: 'Stockage', value: 'Stockage' },
                  { label: 'Autre', value: 'Autre' },
                ]}
              />
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="primary" danger icon={<AlertTriangle size={16} />} className="font-bold" onClick={handleDeclareBreakage}>
                Déclarer la casse
              </Button>
            </div>
          </div>

          <div className="bg-bg-card border border-black/10 dark:border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-black text-text-heading mb-4">Historique des Casses</h3>
            <DataTable columns={breakageColumns} data={breakages} />
          </div>
        </div>
      )
    },
    {
      key: 'repack',
      label: <span className="font-bold uppercase tracking-wider flex items-center gap-2"><PackageOpen size={16} /> Reconditionnement</span>,
      children: (
        <div className="space-y-6">
          <Alert 
            message="Reconditionnement en Sacs" 
            description="Utilisez les cartons précédemment déclarés en casse pour constituer des sacs de casses vendables. Cette opération déduit le stock des cartons cassés et ajoute du stock au nouveau produit."
            type="info" 
            showIcon 
          />

          <div className="bg-bg-card border border-black/10 dark:border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-black text-text-heading mb-4">Nouveau Reconditionnement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* SOURCE */}
              <div className="space-y-4 p-5 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                <h4 className="font-bold text-orange-600 flex items-center gap-2"><AlertTriangle size={16}/> Source (Casses)</h4>
                <Select
                  label="Cartons cassés à utiliser"
                  value={repackBrokenProductId}
                  onChange={setRepackBrokenProductId}
                  options={brokenProducts.map(p => ({ label: `${p.name} (Dispo: ${p.stock})`, value: p.id }))}
                />
                <Input
                  label="Quantité à utiliser"
                  type="number"
                  min="1"
                  value={repackBrokenQty}
                  onChange={e => setRepackBrokenQty(e.target.value)}
                />
              </div>

              {/* DESTINATION */}
              <div className="space-y-4 p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <h4 className="font-bold text-emerald-600 flex items-center gap-2"><PackageOpen size={16}/> Résultat (Sacs)</h4>
                <Input
                  label="Nom du nouveau produit (ex: Sac de casses Roma)"
                  value={repackNewName}
                  onChange={e => setRepackNewName(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nb de sacs créés"
                    type="number"
                    min="1"
                    value={repackNewQty}
                    onChange={e => setRepackNewQty(e.target.value)}
                  />
                  <Input
                    label="Prix unitaire proposé"
                    type="number"
                    min="0"
                    value={repackNewPrice}
                    onChange={e => setRepackNewPrice(e.target.value)}
                  />
                </div>
              </div>

            </div>
            
            <div className="mt-6 flex justify-end">
              <Button type="primary" icon={<PackageOpen size={16} />} className="font-bold bg-emerald-500 hover:bg-emerald-600" onClick={handleCreateRepackaging}>
                Effectuer le reconditionnement
              </Button>
            </div>
          </div>

          <div className="bg-bg-card border border-black/10 dark:border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-black text-text-heading mb-4">Historique des Reconditionnements</h3>
            <DataTable columns={repackagingColumns} data={repackagings} />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-text-heading tracking-tight">Gestion des Casses & Reconditionnements</h1>
        <p className="text-sm text-text-muted mt-1">Déclarez les cartons endommagés et gérez leur revente sous forme de sacs de casses.</p>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        items={items}
        className="custom-tabs"
      />
    </div>
  );
};

export default BreakagePanel;
