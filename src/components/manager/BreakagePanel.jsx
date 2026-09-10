import { useT } from '../../i18n/I18nContext';
import { Panel, Table, Button } from '../ui';
import React, { useState } from 'react';
import OnlineOnly from '../../offline/OnlineOnly';
import { formatPrice } from '../../context/StoreContext';
import { useProducts, useBreakages } from '../../hooks';
import Select from '../common/Select';
import Input from '../common/Input';
import { message, Tabs, Alert } from 'antd';
import { ArrowRightOutlined, DropboxOutlined, HistoryOutlined, InboxOutlined, WarningOutlined } from '@ant-design/icons';

const BreakagePanel = () => {
  const t = useT();
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
    { key: 'date', title: t('s.date'), render: (val) => new Date(val).toLocaleDateString('fr-FR') },
    { key: 'productName', title: t('s.produit'), render: (val) => <span className="font-semibold">{val}</span> },
    { key: 'quantity', title: t('s.quantite_cassee'), render: (val) => <span className="text-red-500 font-bold">{val}</span> },
    { key: 'reason', title: t('s.motif'), render: (val) => <span className="text-sm">{val}</span> },
    { key: 'costValue', title: t('s.perte_estimee_cout'), render: (val) => <span className="text-text-muted">{formatPrice(val)}</span> },
    { key: 'createdBy', title: t('s.declare_par') },
  ];

  const repackagingColumns = [
    { key: 'date', title: t('s.date'), render: (val) => new Date(val).toLocaleDateString('fr-FR') },
    { key: 'sourceProductName', title: t('s.casses_utilisees'), render: (val) => <span className="font-semibold text-orange-500">{val}</span> },
    { key: 'sourceQuantity', title: t('s.qte_utilisee'), render: (val) => <span className="font-bold">{val}</span> },
    { key: 'arrow', title: '', render: () => <ArrowRightOutlined style={{ fontSize: 14 }} className="text-text-muted mx-auto" /> },
    { key: 'targetProductName', title: t('s.nouveau_produit_sacs'), render: (val) => <span className="font-semibold text-emerald-500">{val}</span> },
    { key: 'targetQuantity', title: t('s.qte_creee'), render: (val) => <span className="font-bold text-emerald-500">{val}</span> },
    { key: 'createdBy', title: t('s.operateur') },
  ];

  const items = [
    {
      key: 'declare',
      label: <span className="flex items-center gap-1.5"><WarningOutlined /> {t('s.declarer_une_casse')}</span>,
      children: (
        <div className="space-y-4">
          <Alert 
            title={t('s.comment_ca_marche')} 
            description={t('s.la_declaration_de_casse_retire_les_cartons_d')}
            type="info" 
            showIcon 
          />
          
          <Panel title={t('s.nouvelle_declaration_de_casse')} icon={WarningOutlined}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <Select
                  label={t('s.produit_endommage')}
                  value={breakageProductId}
                  onChange={setBreakageProductId}
                  options={regularProducts.map(p => ({ label: `${p.name} (Stock: ${p.stock})`, value: p.id }))}
                />
              </div>
              <Input
                label={t('s.quantite')}
                type="number"
                min="1"
                value={breakageQuantity}
                onChange={e => setBreakageQuantity(e.target.value)}
              />
              <Select
                label={t('s.motif')}
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
            <div className="mt-4 flex justify-end">
              <OnlineOnly reason="Indisponible hors connexion : déclarer une casse retire des cartons du stock partagé.">
              <Button type="primary" danger icon={<WarningOutlined />} onClick={handleDeclareBreakage}>
                {t('s.declarer_la_casse')}
              </Button>
              </OnlineOnly>
            </div>
          </Panel>

          <Panel title={t('s.historique_des_casses')} icon={HistoryOutlined} noPadding>
            <Table columns={breakageColumns} data={breakages}
              emptyIcon={InboxOutlined} emptyTitle={t('s.aucune_casse')}
              emptyDescription={t('s.aucune_casse_declaree_pour_le_moment')} />
          </Panel>
        </div>
      )
    },
    {
      key: 'repack',
      label: <span className="flex items-center gap-1.5"><DropboxOutlined /> {t('s.reconditionnement')}</span>,
      children: (
        <div className="space-y-4">
          <Alert 
            title={t('s.reconditionnement_en_sacs')} 
            description={t('s.utilisez_les_cartons_precedemment_declares_e')}
            type="info" 
            showIcon 
          />

          <Panel title={t('s.nouveau_reconditionnement')} icon={DropboxOutlined}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* SOURCE */}
              <div className="space-y-3 p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                <h4 className="text-[0.8rem] font-semibold text-orange-600 flex items-center gap-2"><WarningOutlined style={{ fontSize: 16 }}/> {t('s.source_casses')}</h4>
                <Select
                  label={t('s.cartons_casses_a_utiliser')}
                  value={repackBrokenProductId}
                  onChange={setRepackBrokenProductId}
                  options={brokenProducts.map(p => ({ label: `${p.name} (Dispo: ${p.stock})`, value: p.id }))}
                />
                <Input
                  label={t('s.quantite_a_utiliser')}
                  type="number"
                  min="1"
                  value={repackBrokenQty}
                  onChange={e => setRepackBrokenQty(e.target.value)}
                />
              </div>

              {/* DESTINATION */}
              <div className="space-y-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                <h4 className="text-[0.8rem] font-semibold text-emerald-600 flex items-center gap-2"><DropboxOutlined style={{ fontSize: 16 }}/> {t('s.resultat_sacs')}</h4>
                <Input
                  label={t('s.nom_du_nouveau_produit_ex_sac_de_casses_roma')}
                  value={repackNewName}
                  onChange={e => setRepackNewName(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t('s.nb_de_sacs_crees')}
                    type="number"
                    min="1"
                    value={repackNewQty}
                    onChange={e => setRepackNewQty(e.target.value)}
                  />
                  <Input
                    label={t('s.prix_unitaire_propose')}
                    type="number"
                    min="0"
                    value={repackNewPrice}
                    onChange={e => setRepackNewPrice(e.target.value)}
                  />
                </div>
              </div>

            </div>
            
            <div className="mt-4 flex justify-end">
              <OnlineOnly reason="Indisponible hors connexion : le reconditionnement déduit puis crée du stock.">
              <Button type="primary" icon={<DropboxOutlined />} onClick={handleCreateRepackaging}>
                {t('s.effectuer_le_reconditionnement')}
              </Button>
              </OnlineOnly>
            </div>
          </Panel>

          <Panel title={t('s.historique_des_reconditionnements')} icon={HistoryOutlined} noPadding>
            <Table columns={repackagingColumns} data={repackagings}
              emptyIcon={InboxOutlined} emptyTitle={t('s.aucun_reconditionnement')}
              emptyDescription={t('s.aucun_reconditionnement_enregistre')} />
          </Panel>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in space-y-4">
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
