import { useT } from '../../i18n/I18nContext';
import { Table } from '../ui';
import React, { useState } from 'react';
import { useUsers, useStores } from '../../hooks';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import { message, Input as AntInput } from 'antd';
import { setMemberPassword } from '../../services/memberService';
import { hasSupabaseSession } from '../../services/supabaseData';
import { CheckCircleOutlined, EditOutlined, KeyOutlined, ExclamationCircleOutlined, LockOutlined, SafetyOutlined, ShopOutlined, StopOutlined, TeamOutlined, UserAddOutlined } from '@ant-design/icons';

const UserManagement = () => {
  const t = useT();
  const { users, addUser, updateUser, toggleUserStatus } = useUsers();
  const { stores } = useStores();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Réinitialisation d'un mot de passe employé : l'administrateur le choisit et
  // le transmet de vive voix. Aucun message ne peut atteindre une adresse .local.
  const [resetting, setResetting] = useState(null);   // profil visé
  const [newPwd, setNewPwd] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  const confirmReset = async () => {
    if (newPwd.length < 8) return message.error(t('s.8_caracteres_minimum_2'));
    setSavingPwd(true);
    try {
      await setMemberPassword(resetting.id, newPwd);
      message.success(t('s.mot_de_passe_modifie'));
      setResetting(null); setNewPwd('');
    } catch (err) { message.error(err.message); }
    finally { setSavingPwd(false); }
  };
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
    { value: 'ceo', label: t('s.directeur_general_pdg') },
    { value: 'manager', label: t('s.manager_gerant') },
    { value: 'accountant', label: 'Comptable' },
    { value: 'storekeeper', label: 'Magasinier' },
    { value: 'cashier', label: t('s.caissier') }
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
      title: t('s.nom_identifiant'), 
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm uppercase ${row.isActive ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
            {row.name.substring(0, 2)}
          </div>
          <div>
            <div className={`font-semibold text-sm text-gray-900 dark:text-text-heading ${!row.isActive && 'line-through opacity-40'}`}>{row.name}</div>
            <div className="text-[0.7rem] text-gray-500 dark:text-text-muted font-bold">@{row.username}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'role', 
      title: t('s.role'), 
      render: (val) => {
        const roleObj = roles.find(r => r.value === val);
        return (
          <span className={`px-3 py-1 rounded-full text-[0.65rem] font-semibold uppercase tracking-widest border ${roleColors[val] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
            {roleObj ? roleObj.label : val}
          </span>
        );
      }
    },
    { 
      key: 'storeId', 
      title: t('s.magasin_assigne'), 
      render: (val, row) => {
        if (row.role === 'ceo' || row.role === 'manager' || row.role === 'accountant') {
          return <span className="text-[0.75rem] font-bold text-gray-400 dark:text-text-muted italic">{t('s.tous_les_magasins')}</span>;
        }
        const store = stores.find(s => s.id === val);
        return (
          <div className="flex items-center gap-1.5 text-gray-700 dark:text-text-secondary text-sm font-bold">
            <ShopOutlined style={{ fontSize: 14 }} className="text-gray-400" />
            {store ? store.name : 'Non assigné'}
          </div>
        );
      }
    },
    { 
      key: 'status', 
      title: t('s.statut'), 
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${row.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
          <span className={`text-[0.75rem] font-semibold uppercase tracking-widest ${row.isActive ? 'text-emerald-500' : 'text-red-500'}`}>
            {row.isActive ? 'Actif' : 'Suspendu'}
          </span>
        </div>
      )
    },
    { 
      key: 'actions', 
      title: t('s.actions'), 
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          {row.id !== currentUser?.id ? (
            <>
              <button 
                onClick={() => handleOpenModal(row)}
                className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-colors"
                title={t('s.modifier')}
              >
                <EditOutlined style={{ fontSize: 16 }} />
              </button>
              <button
                onClick={async () => {
                  if (!(await hasSupabaseSession()))
                    return message.info(t('s.disponible_une_fois_l_entreprise_migree'));
                  setResetting(row); setNewPwd('');
                }}
                className="p-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg transition-colors"
                title={t('s.definir_un_nouveau_mot_de_passe')}
              >
                <KeyOutlined style={{ fontSize: 16 }} />
              </button>
              <button 
                onClick={() => toggleUserStatus(row.id)}
                className={`p-2 rounded-lg transition-colors ${row.isActive ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                title={row.isActive ? "Suspendre l'accès" : "Réactiver l'accès"}
              >
                {row.isActive ? <StopOutlined style={{ fontSize: 16 }} /> : <CheckCircleOutlined style={{ fontSize: 16 }} />}
              </button>
            </>
          ) : (
            <div className="flex items-center justify-end gap-2">
              <span className="text-[0.65rem] font-bold text-primary uppercase italic px-2">{t('s.vous_meme')}</span>
              <button 
                onClick={() => handleOpenModal(row)}
                className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-colors"
                title={t('s.modifier_vos_parametres')}
              >
                <EditOutlined style={{ fontSize: 16 }} />
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-white dark:bg-bg-card border border-gray-200 dark:border-white/5 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5">
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
            <div className="relative">
              <input 
                type="text"
                placeholder={t('s.rechercher_un_collaborateur')}
                className="w-full sm:w-64 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-[0.85rem] text-gray-800 dark:text-text-heading focus:outline-none focus:border-primary/50 transition-all font-bold placeholder:text-gray-400"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold uppercase tracking-widest text-[0.75rem] hover:scale-105 active:scale-95 transition-all shadow-sm shadow-primary/20"
            >
              <UserAddOutlined style={{ fontSize: 16 }} /> {t('s.ajouter_un_compte')}
            </button>
          </div>
        </div>

        <Table 
          columns={columns} 
          data={filteredUsers} 
          emptyIcon={TeamOutlined}
          emptyTitle={t('s.aucun_utilisateur_trouve')}
          emptyDescription={t('s.modifiez_votre_recherche_ou_ajoutez_un_nouve')}
        />
      </div>

      {resetting && (
        <Modal
          onClose={() => setResetting(null)}
          title={t('s.nouveau_mot_de_passe_pour_name', { name: resetting.name })}
          onOk={confirmReset}
          okText={t('s.modifier')}
          okDisabled={newPwd.length < 8}
          confirmLoading={savingPwd}
        >
          <AntInput.Password
            size="large"
            autoFocus
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            placeholder={t('s.8_caracteres_minimum')}
          />
          <p className="mt-3 text-[0.78rem] text-text-muted">
            {t('s.transmettez_ce_mot_de_passe_de_vive_voix_l_e')}
          </p>
        </Modal>
      )}

      {isModalOpen && (
        <Modal 
          title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              {editingUser ? <EditOutlined style={{ fontSize: 20 }} /> : <UserAddOutlined style={{ fontSize: 20 }} />}
            </div>
            <div>
              <div className="font-black text-xl tracking-tight text-text-heading">
                {editingUser ? 'Modifier le Collaborateur' : 'Nouveau Collaborateur'}
              </div>
              <div className="text-[0.65rem] text-text-muted font-bold uppercase tracking-widest">
                {t('s.parametres_du_compte')}
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
              <label className="text-[0.7rem] font-semibold text-gray-500 dark:text-text-muted uppercase tracking-widest mb-1.5 block">{t('s.nom_complet_2')}</label>
              <input 
                required
                className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-text-heading font-bold focus:outline-none focus:border-primary/50 placeholder:text-gray-400"
                placeholder={t('s.ex_jean_dupont')}
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[0.7rem] font-semibold text-gray-500 dark:text-text-muted uppercase tracking-widest mb-1.5 block">{t('s.identifiant_de_connexion')}</label>
              <input 
                required
                className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-text-heading font-bold focus:outline-none focus:border-primary/50 placeholder:text-gray-400"
                placeholder={t('s.ex_jdupont')}
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value.toLowerCase()})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[0.7rem] font-semibold text-gray-500 dark:text-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <SafetyOutlined style={{ fontSize: 12 }} className="text-primary" /> {t('s.role_d_acces')}
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
              <label className="text-[0.7rem] font-semibold text-gray-500 dark:text-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <ShopOutlined style={{ fontSize: 12 }} className="text-blue-500" /> {t('s.magasin_assigne_2')}
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
                <p className="text-[0.6rem] text-gray-400 dark:text-text-muted mt-1 italic">{t('s.ce_role_a_acces_a_tous_les_magasins')}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-[0.7rem] font-semibold text-gray-500 dark:text-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-2">
              <LockOutlined style={{ fontSize: 12 }} className="text-amber-500" /> {t('s.mot_de_passe')}
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
              <ExclamationCircleOutlined style={{ fontSize: 16 }} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[0.75rem] text-text-secondary leading-relaxed font-medium">
                {t('s.le_nouvel_utilisateur_sera_immediatement_act')}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-white/5 mt-6">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)} 
              className="flex-1 py-3.5 rounded-xl font-bold bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-text-secondary hover:bg-gray-200 dark:hover:bg-white/10 transition-colors border border-gray-300 dark:border-white/10"
            >
              {t('s.annuler')}
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3.5 rounded-xl font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
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
