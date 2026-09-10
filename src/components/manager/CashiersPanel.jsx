import { useT } from '../../i18n/I18nContext';
import { Table } from '../ui';
import React, { useState } from 'react';
import { useUsers, useStores } from '../../hooks';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import { EditOutlined, PlusOutlined, PoweroffOutlined, SafetyOutlined, ShopOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Space, Switch, Tag } from 'antd';

const emptyUser = { username: '', password: '', name: '', role: 'cashier', storeId: '' };

const StaffPanel = () => {
  const t = useT();
  const { staffWithCodes, addUser, updateUser, toggleUserStatus } = useUsers();
  const { stores, activeStoreId } = useStores();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyUser);

  const staff = staffWithCodes;

  const openAdd = () => { 
    setEditingUser(null); 
    setForm({ ...emptyUser, storeId: activeStoreId }); 
    setShowModal(true); 
  };

  const openEdit = (u) => { 
    setEditingUser(u); 
    // Ne pas pré-remplir le mot de passe (le serveur ne le renvoie jamais)
    // L'admin laisse vide = inchangé, ou entre un nouveau = changement
    setForm({ ...u, password: '' }); 
    setShowModal(true); 
  };

  const handleSave = () => {
    if (!form.username || !form.name) return;
    // Pour un nouvel utilisateur, le mot de passe est obligatoire
    if (!editingUser && !form.password) return;
    if (editingUser) { 
      updateUser(editingUser.id, form); 
    } else { 
      addUser(form); 
    }
    setShowModal(false);
  };

  const columns = [
    { key: 'name', title: t('s.nom_complet'), render: (val, row) => (
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${row.isActive ? 'bg-primary/20 text-primary' : 'bg-white/5 text-text-muted'}`}>
          {val.charAt(0)}
        </div>
        <span className={`font-semibold ${row.isActive ? 'text-text-heading' : 'text-text-muted italic'}`}>{val}</span>
      </div>
    )},
    { key: 'role', title: 'Fonction', render: (val) => (
      <Tag color={val === 'manager' ? 'gold' : val === 'accountant' ? 'blue' : val === 'storekeeper' ? 'purple' : 'cyan'} className="border-none font-bold uppercase text-[0.6rem]">
        {val === 'cashier' ? 'Caissier' : val === 'storekeeper' ? 'Magasinier' : val}
      </Tag>
    )},
    { key: 'staffCode', title: 'Code', render: (_, row) => (
      <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
        <span className="text-primary font-semibold text-sm">{row.staffCode}</span>
      </div>
    )},
    { key: 'username', title: t('s.identifiant'), render: (val) => <code className="bg-white/5 px-2 py-1 rounded text-primary text-xs">{val}</code> },
    { key: 'store', title: t('s.magasin_assigne'), render: (_, row) => {
      const store = stores.find(s => s.id === row.storeId);
      return (
        <div className="flex items-center gap-1.5 text-text-secondary">
          <ShopOutlined style={{ fontSize: 12 }} />
          <span className="text-[0.75rem]">{store?.name || 'Inconnu'}</span>
        </div>
      );
    }},
    { key: 'status', title: t('s.statut'), render: (val, row) => (
      <div className="flex items-center gap-2">
        <Switch 
          checked={row.isActive} 
          onChange={() => toggleUserStatus(row.id)} 
          size="small"
        />
        <Tag color={row.isActive ? 'success' : 'default'} className="border-none font-bold uppercase text-[0.6rem]">
          {row.isActive ? 'Actif' : 'Inactif'}
        </Tag>
      </div>
    )},
    { key: 'actions', title: t('s.actions'), align: 'right', render: (_, row) => (
      <Button type="text" className="text-text-secondary hover:text-primary!" icon={<EditOutlined style={{ fontSize: 14 }} />} onClick={(e) => { e.stopPropagation(); openEdit(row); }} />
    )},
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/5">
        <div>
          <h3 className="text-text-heading font-black tracking-tight text-lg">{t('s.gestion_du_personnel')}</h3>
          <p className="text-text-muted text-sm mt-1">{t('s.creez_et_gerez_les_comptes_des_caissiers_et_')}</p>
        </div>
        <Button type="primary" icon={<PlusOutlined style={{ fontSize: 16 }} />} onClick={openAdd} >
          {t('s.ajouter_personnel')}
        </Button>
      </div>

      <div className="bg-bg-secondary rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
        <Table
          columns={columns}
          data={staff}
          emptyIcon={UserOutlined}
          emptyTitle={t('s.aucun_personnel')}
          emptyDescription={t('s.commencez_par_creer_un_compte_pour_votre_equ')}
        />
      </div>

      {showModal && (
        <Modal
          title={editingUser ? 'Modifier le Compte' : 'Nouveau Compte'}
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
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('s.nom_complet')}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={t('s.ex_jean_dupont')}
                icon={UserOutlined}
              />
              <Select
                label={t('s.role_fonction')}
                value={form.role}
                onChange={val => setForm({ ...form, role: val })}
                options={[
                  { label: t('s.caissier'), value: 'cashier' },
                  { label: 'Magasinier', value: 'storekeeper' }
                ]}
                icon={SafetyOutlined}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('s.identifiant')}
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="nom_utilisateur"
              />
              <Input
                label={t('s.mot_de_passe')}
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder={editingUser ? "Laisser vide = inchangé" : "********"}
              />
            </div>
            <Select
              label={t('s.magasin_assigne')}
              value={form.storeId}
              onChange={val => setForm({ ...form, storeId: val })}
              options={stores.map(s => ({ label: s.name, value: s.id }))}
              placeholder={t('s.selectionner_un_magasin')}
              icon={ShopOutlined}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StaffPanel;
