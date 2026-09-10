import { useT } from '../../i18n/I18nContext';
import { Table } from '../ui';
import React, { useState } from 'react';
import { useStores } from '../../hooks';
import Modal from '../common/Modal';
import Input from '../common/Input';
import { CheckCircleOutlined, DeleteOutlined, EditOutlined, EnvironmentOutlined, HomeOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Space, Popconfirm } from 'antd';

const emptyStore = { name: '', location: '' };

const StoresPanel = () => {
  const t = useT();
  const { stores, activeStoreId, addStore, updateStore, deleteStore, switchStore } = useStores();
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [form, setForm] = useState(emptyStore);

  const openAdd = () => { setEditingStore(null); setForm(emptyStore); setShowModal(true); };
  const openEdit = (s) => { 
    setEditingStore(s); 
    setForm({ ...s }); 
    setShowModal(true); 
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editingStore) { updateStore(editingStore.id, form); }
    else { addStore(form); }
    setShowModal(false);
  };

  const columns = [
    { key: 'status', title: '', width: 50, render: (_, row) => (
      row.id === activeStoreId ? <CheckCircleOutlined style={{ fontSize: 18 }} className="text-primary animate-pulse" /> : null
    )},
    { key: 'name', title: t('s.nom_du_magasin'), render: (val, row) => (
      <div className="flex flex-col">
        <span className={`font-bold ${row.id === activeStoreId ? 'text-primary' : 'text-text-heading'}`}>{val}</span>
        {row.id === activeStoreId && <span className="text-[0.6rem] text-primary/70 font-semibold uppercase tracking-widest">{t('s.actif')}</span>}
      </div>
    )},
    { key: 'location', title: 'Emplacement', render: (val) => (
      <div className="flex items-center gap-2 text-text-secondary">
        <EnvironmentOutlined style={{ fontSize: 12 }} />
        <span className="text-[0.8rem] font-semibold">{val || 'Non spécifié'}</span>
      </div>
    )},
    { key: 'actions', title: t('s.actions'), align: 'right', render: (_, row) => (
      <Space size="small">
        {row.id === activeStoreId ? (
          <div className="h-8 px-4 rounded-lg flex items-center justify-center font-semibold text-[0.7rem] uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
            {t('s.actif')}
          </div>
        ) : (
          <Button type="primary" onClick={(e) => { e.stopPropagation(); switchStore(row.id); }} >
            {t('s.selectionner_2')}
          </Button>
        )}
        <Button type="text" className="text-text-secondary hover:text-primary!" icon={<EditOutlined style={{ fontSize: 14 }} />} onClick={(e) => { e.stopPropagation(); openEdit(row); }} />
        <Popconfirm
          title={t('s.supprimer_le_magasin')}
          description={t('s.attention_tous_les_produits_et_ventes_lies_a')}
          onConfirm={() => deleteStore(row.id)}
          okText={t('s.oui')}
          cancelText={t('s.non')}
          disabled={stores.length <= 1}
        >
          <Button type="text" danger disabled={stores.length <= 1} className="hover:bg-red-500/10!" icon={<DeleteOutlined style={{ fontSize: 14 }} />} onClick={(e) => e.stopPropagation()} />
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/5">
        <div>
          <h3 className="text-text-heading font-black tracking-tight text-lg">{t('s.gestion_des_magasins')}</h3>
          <p className="text-text-muted text-sm mt-1">{t('s.gerez_vos_differents_points_de_vente_et_leur')}</p>
        </div>
        <Button type="primary" icon={<PlusOutlined style={{ fontSize: 16 }} />} onClick={openAdd} >
          {t('s.nouveau_magasin')}
        </Button>
      </div>

      <div className="bg-bg-secondary rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
        <Table
          columns={columns}
          data={stores}
          emptyIcon={HomeOutlined}
          emptyTitle={t('s.aucun_magasin')}
          emptyDescription={t('s.commencez_par_creer_votre_premier_point_de_v')}
        />
      </div>

      {showModal && (
        <Modal
          title={editingStore ? 'Modifier le Magasin' : 'Nouveau Magasin'}
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
              label={t('s.nom_du_magasin')}
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder={t('s.ex_magasin_nord_entrepot_principal')}
            />
            <Input
              label={t('s.emplacement_adresse')}
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              placeholder={t('s.ex_quartier_plateau_123_rue_de_la_gare')}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StoresPanel;
