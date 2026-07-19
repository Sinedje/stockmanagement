import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import { Users, UserPlus, Shield, Store, Edit2, Ban, CheckCircle, Lock, AlertCircle } from 'lucide-react';

const UserManagement = () => {
  const { users, stores, addUser, updateUser, toggleUserStatus, currentUser } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'cashier',
    storeId: 1
  });

  const roles = [
    { value: 'ceo', label: 'Directeur Général (PDG)' },
    { value: 'manager', label: 'Manager / Gérant' },
    { value: 'accountant', label: 'Comptable' },
    { value: 'storekeeper', label: 'Magasinier' },
    { value: 'cashier', label: 'Caissier' }
  ];

  const roleColors = {
    ceo: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    manager: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    accountant: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    storekeeper: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    cashier: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        username: user.username,
        password: user.password,
        role: user.role,
        storeId: user.storeId || 1
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        username: '',
        password: '',
        role: 'cashier',
        storeId: stores[0]?.id || 1
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      updateUser(editingUser.id, formData);
    } else {
      addUser(formData);
    }
    setIsModalOpen(false);
  };

  const columns = [
    { 
      key: 'name', 
      title: 'Nom / Identifiant', 
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm uppercase ${row.isActive ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
            {row.name.substring(0, 2)}
          </div>
          <div>
            <div className={`font-black text-sm text-gray-900 dark:text-text-heading ${!row.isActive && 'line-through opacity-40'}`}>{row.name}</div>
            <div className="text-[0.7rem] text-gray-500 dark:text-text-muted font-bold">@{row.username}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'role', 
      title: 'Rôle', 
      render: (val) => {
        const roleObj = roles.find(r => r.value === val);
        return (
          <span className={`px-3 py-1 rounded-full text-[0.65rem] font-black uppercase tracking-widest border ${roleColors[val] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
            {roleObj ? roleObj.label : val}
          </span>
        );
      }
    },
    { 
      key: 'storeId', 
      title: 'Magasin Assigné', 
      render: (val, row) => {
        if (row.role === 'ceo' || row.role === 'manager' || row.role === 'accountant') {
          return <span className="text-[0.75rem] font-bold text-gray-400 dark:text-text-muted italic">Tous les magasins</span>;
        }
        const store = stores.find(s => s.id === val);
        return (
          <div className="flex items-center gap-1.5 text-gray-700 dark:text-text-secondary text-sm font-bold">
            <Store size={14} className="text-gray-400" />
            {store ? store.name : 'Non assigné'}
          </div>
        );
      }
    },
    { 
      key: 'status', 
      title: 'Statut', 
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${row.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
          <span className={`text-[0.75rem] font-black uppercase tracking-widest ${row.isActive ? 'text-emerald-500' : 'text-red-500'}`}>
            {row.isActive ? 'Actif' : 'Suspendu'}
          </span>
        </div>
      )
    },
    { 
      key: 'actions', 
      title: 'Actions', 
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          {row.id !== currentUser?.id ? (
            <>
              <button 
                onClick={() => handleOpenModal(row)}
                className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-colors"
                title="Modifier"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => toggleUserStatus(row.id)}
                className={`p-2 rounded-lg transition-colors ${row.isActive ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                title={row.isActive ? "Suspendre l'accès" : "Réactiver l'accès"}
              >
                {row.isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
              </button>
            </>
          ) : (
            <div className="flex items-center justify-end gap-2">
              <span className="text-[0.65rem] font-bold text-primary uppercase italic px-2">Vous-même</span>
              <button 
                onClick={() => handleOpenModal(row)}
                className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-colors"
                title="Modifier vos paramètres"
              >
                <Edit2 size={16} />
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-white dark:bg-bg-card border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
              <Users size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-text-heading tracking-tight">Gestion du Personnel</h2>
              <p className="text-[0.7rem] text-gray-500 dark:text-text-muted font-bold uppercase tracking-widest mt-1">
                Gérez les accès, les rôles et les affectations
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
            <div className="relative">
              <input 
                type="text"
                placeholder="Rechercher un collaborateur..."
                className="w-full sm:w-64 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-[0.85rem] text-gray-800 dark:text-text-heading focus:outline-none focus:border-primary/50 transition-all font-bold placeholder:text-gray-400"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black rounded-xl font-black uppercase tracking-widest text-[0.75rem] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
            >
              <UserPlus size={16} /> Ajouter un compte
            </button>
          </div>
        </div>

        <DataTable 
          columns={columns} 
          data={filteredUsers} 
          emptyIcon={Users}
          emptyTitle="Aucun utilisateur trouvé"
          emptyDescription="Modifiez votre recherche ou ajoutez un nouveau collaborateur."
        />
      </div>

      {isModalOpen && (
        <Modal 
          title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              {editingUser ? <Edit2 size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <div className="font-black text-xl tracking-tight text-text-heading">
                {editingUser ? 'Modifier le Collaborateur' : 'Nouveau Collaborateur'}
              </div>
              <div className="text-[0.65rem] text-text-muted font-bold uppercase tracking-widest">
                Paramètres du compte
              </div>
            </div>
          </div>
        }
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        footer={null}
      >
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[0.7rem] font-black text-gray-500 dark:text-text-muted uppercase tracking-widest mb-1.5 block">Nom complet</label>
              <input 
                required
                className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-text-heading font-bold focus:outline-none focus:border-primary/50 placeholder:text-gray-400"
                placeholder="Ex: Jean Dupont"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[0.7rem] font-black text-gray-500 dark:text-text-muted uppercase tracking-widest mb-1.5 block">Identifiant de connexion</label>
              <input 
                required
                className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-text-heading font-bold focus:outline-none focus:border-primary/50 placeholder:text-gray-400"
                placeholder="Ex: jdupont"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value.toLowerCase()})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[0.7rem] font-black text-gray-500 dark:text-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <Shield size={12} className="text-primary" /> Rôle d'accès
              </label>
              <select 
                className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-text-heading font-bold focus:outline-none focus:border-primary/50 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                disabled={editingUser?.id === currentUser?.id}
              >
                {roles.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[0.7rem] font-black text-gray-500 dark:text-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <Store size={12} className="text-blue-500" /> Magasin assigné
              </label>
              <select 
                className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-text-heading font-bold focus:outline-none focus:border-primary/50 appearance-none disabled:opacity-50"
                value={formData.storeId}
                onChange={e => setFormData({...formData, storeId: parseInt(e.target.value)})}
                disabled={['ceo', 'manager', 'accountant'].includes(formData.role)}
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {['ceo', 'manager', 'accountant'].includes(formData.role) && (
                <p className="text-[0.6rem] text-gray-400 dark:text-text-muted mt-1 italic">Ce rôle a accès à tous les magasins.</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-[0.7rem] font-black text-gray-500 dark:text-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-2">
              <Lock size={12} className="text-amber-500" /> Mot de passe
            </label>
            <input 
              required={!editingUser}
              type="text"
              className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-text-heading font-bold focus:outline-none focus:border-primary/50 placeholder:text-gray-400"
              placeholder={editingUser ? "Laisser vide pour ne pas changer" : "Saisissez un mot de passe"}
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {!editingUser && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-3 items-start mt-6">
              <AlertCircle size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[0.75rem] text-text-secondary leading-relaxed font-medium">
                Le nouvel utilisateur sera immédiatement actif. Vous pourrez suspendre son accès à tout moment depuis la liste.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-white/5 mt-6">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)} 
              className="flex-1 py-3.5 rounded-xl font-bold bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-text-secondary hover:bg-gray-200 dark:hover:bg-white/10 transition-colors border border-gray-300 dark:border-white/10"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3.5 rounded-xl font-black uppercase tracking-widest bg-primary text-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {editingUser ? 'Enregistrer les modifications' : 'Créer le compte'}
            </button>
          </div>
        </form>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;
