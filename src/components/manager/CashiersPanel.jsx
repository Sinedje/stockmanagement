import React, { useState } from 'react';
import { useUsers, useStores } from '../../hooks';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import DataTable from '../common/DataTable';
import { Plus, Edit3, User, Shield, Power, Store } from 'lucide-react';
import { Button, Space, Switch, Tag } from 'antd';

const emptyUser = { username: '', password: '', name: '', role: 'cashier', storeId: '' };

const StaffPanel = () => {
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
    setForm({ ...u }); 
    setShowModal(true); 
  };

  const handleSave = () => {
    if (!form.username || !form.password || !form.name) return;
    if (editingUser) { 
      updateUser(editingUser.id, form); 
    } else { 
      addUser(form); 
    }
    setShowModal(false);
  };

  const columns = [
    { key: 'name', title: 'Nom Complet', render: (val, row) => (
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
        <span className="text-primary font-black text-sm">{row.staffCode}</span>
      </div>
    )},
    { key: 'username', title: 'Identifiant', render: (val) => <code className="bg-white/5 px-2 py-1 rounded text-primary text-xs">{val}</code> },
    { key: 'store', title: 'Magasin Assigné', render: (_, row) => {
      const store = stores.find(s => s.id === row.storeId);
      return (
        <div className="flex items-center gap-1.5 text-text-secondary">
          <Store size={12} />
          <span className="text-[0.75rem]">{store?.name || 'Inconnu'}</span>
        </div>
      );
    }},
    { key: 'status', title: 'Statut', render: (val, row) => (
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
    { key: 'actions', title: 'Actions', align: 'right', render: (_, row) => (
      <Button 
        type="text" 
        className="text-text-secondary hover:text-primary!"
        icon={<Edit3 size={14} />} 
        onClick={(e) => { e.stopPropagation(); openEdit(row); }} 
      />
    )},
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/5">
        <div>
          <h3 className="text-text-heading font-black tracking-tight text-lg">Gestion du Personnel</h3>
          <p className="text-text-muted text-sm mt-1">Créez et gérez les comptes des caissiers et des magasiniers.</p>
        </div>
        <Button 
          type="primary" 
          icon={<Plus size={16} />} 
          onClick={openAdd} 
          size="large"
          className="h-11 px-6 rounded-xl font-bold uppercase tracking-wider"
        >
          Ajouter Personnel
        </Button>
      </div>

      <div className="bg-bg-secondary rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
        <DataTable
          columns={columns}
          data={staff}
          emptyIcon={User}
          emptyTitle="Aucun personnel"
          emptyDescription="Commencez par créer un compte pour votre équipe."
        />
      </div>

      {showModal && (
        <Modal
          title={editingUser ? 'Modifier le Compte' : 'Nouveau Compte'}
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
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nom Complet"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Jean Dupont"
                icon={User}
              />
              <Select
                label="Rôle / Fonction"
                value={form.role}
                onChange={val => setForm({ ...form, role: val })}
                options={[
                  { label: 'Caissier', value: 'cashier' },
                  { label: 'Magasinier', value: 'storekeeper' }
                ]}
                icon={Shield}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Identifiant"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="nom_utilisateur"
              />
              <Input
                label="Mot de passe"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="********"
              />
            </div>
            <Select
              label="Magasin Assigné"
              value={form.storeId}
              onChange={val => setForm({ ...form, storeId: val })}
              options={stores.map(s => ({ label: s.name, value: s.id }))}
              placeholder="Sélectionner un magasin..."
              icon={Store}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StaffPanel;
