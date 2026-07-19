import React, { useState } from 'react';
import { useStores } from '../../hooks';
import Modal from '../common/Modal';
import Input from '../common/Input';
import DataTable from '../common/DataTable';
import { Plus, Edit3, Trash2, Home, MapPin, CheckCircle2 } from 'lucide-react';
import { Button, Space, Popconfirm } from 'antd';

const emptyStore = { name: '', location: '' };

const StoresPanel = () => {
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
      row.id === activeStoreId ? <CheckCircle2 size={18} className="text-primary animate-pulse" /> : null
    )},
    { key: 'name', title: 'Nom du Magasin', render: (val, row) => (
      <div className="flex flex-col">
        <span className={`font-bold ${row.id === activeStoreId ? 'text-primary' : 'text-text-heading'}`}>{val}</span>
        {row.id === activeStoreId && <span className="text-[0.6rem] text-primary/70 font-black uppercase tracking-widest">Actif</span>}
      </div>
    )},
    { key: 'location', title: 'Emplacement', render: (val) => (
      <div className="flex items-center gap-2 text-text-secondary">
        <MapPin size={12} />
        <span className="text-[0.8rem] font-semibold">{val || 'Non spécifié'}</span>
      </div>
    )},
    { key: 'actions', title: 'Actions', align: 'right', render: (_, row) => (
      <Space size="small">
        {row.id === activeStoreId ? (
          <div className="h-8 px-4 rounded-lg flex items-center justify-center font-black text-[0.7rem] uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
            Actif
          </div>
        ) : (
          <Button 
            type="primary" 
            size="small"
            className="h-8 rounded-lg font-bold text-[0.7rem] uppercase tracking-wider"
            onClick={(e) => { e.stopPropagation(); switchStore(row.id); }}
          >
            Sélectionner
          </Button>
        )}
        <Button 
          type="text" 
          className="text-text-secondary hover:text-primary!"
          icon={<Edit3 size={14} />} 
          onClick={(e) => { e.stopPropagation(); openEdit(row); }} 
        />
        <Popconfirm
          title="Supprimer le magasin"
          description="Attention: Tous les produits et ventes liés à ce magasin seront supprimés."
          onConfirm={() => deleteStore(row.id)}
          okText="Oui"
          cancelText="Non"
          disabled={stores.length <= 1}
        >
          <Button 
            type="text" 
            danger 
            disabled={stores.length <= 1}
            className="hover:bg-red-500/10!"
            icon={<Trash2 size={14} />} 
            onClick={(e) => e.stopPropagation()}
          />
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/5">
        <div>
          <h3 className="text-text-heading font-black tracking-tight text-lg">Gestion des Magasins</h3>
          <p className="text-text-muted text-sm mt-1">Gérez vos différents points de vente et leur stock distinct.</p>
        </div>
        <Button 
          type="primary" 
          icon={<Plus size={16} />} 
          onClick={openAdd} 
          size="large"
          className="h-11 px-6 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-primary/20"
        >
          Nouveau Magasin
        </Button>
      </div>

      <div className="bg-bg-secondary rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
        <DataTable
          columns={columns}
          data={stores}
          emptyIcon={Home}
          emptyTitle="Aucun magasin"
          emptyDescription="Commencez par créer votre premier point de vente."
        />
      </div>

      {showModal && (
        <Modal
          title={editingStore ? 'Modifier le Magasin' : 'Nouveau Magasin'}
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
            <Input
              label="Nom du Magasin"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Magasin Nord, Entrepôt Principal..."
            />
            <Input
              label="Emplacement / Adresse"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              placeholder="Ex: Quartier Plateau, 123 Rue de la Gare..."
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StoresPanel;
