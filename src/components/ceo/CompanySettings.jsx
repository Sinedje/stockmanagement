import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Settings, Building, Phone, Hash, FileText, CheckCircle } from 'lucide-react';
import { message } from 'antd';

const CompanySettings = () => {
  const { companySettings, updateCompanySettings } = useStore();
  const [formData, setFormData] = useState({ ...companySettings });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate slight delay for UX
    setTimeout(() => {
      updateCompanySettings(formData);
      setIsSaving(false);
      message.success('Les paramètres de l\'entreprise ont été mis à jour avec succès.');
    }, 500);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-bg-card border border-black/5 dark:border-white/5 rounded-3xl p-8 shadow-xl">
        
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-black/5 dark:border-white/5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
            <Building size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-text-heading tracking-tight">Paramètres de l'Entreprise</h2>
            <p className="text-[0.7rem] text-text-muted font-bold uppercase tracking-widest mt-1">
              Informations affichées sur les factures et reçus
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[0.75rem] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Building size={14} className="text-primary" />
                Nom de l'entreprise
              </label>
              <input 
                required
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-text-heading font-bold focus:outline-none focus:border-primary/50 transition-colors"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: GROUPE T. GRAND ZAO..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.75rem] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} className="text-primary" />
                Activité / Sous-titre
              </label>
              <input 
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-text-heading font-bold focus:outline-none focus:border-primary/50 transition-colors"
                value={formData.activity}
                onChange={e => setFormData({...formData, activity: e.target.value})}
                placeholder="Ex: COMMERCE GENERAL..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[0.75rem] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Phone size={14} className="text-primary" />
                Téléphones (Séparés par des /)
              </label>
              <input 
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-text-heading font-bold focus:outline-none focus:border-primary/50 transition-colors"
                value={formData.phones}
                onChange={e => setFormData({...formData, phones: e.target.value})}
                placeholder="Ex: 659 146 882 / 672 126 507"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.75rem] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Hash size={14} className="text-primary" />
                Numéro de Compte Contribuable (NCC)
              </label>
              <input 
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-text-heading font-bold focus:outline-none focus:border-primary/50 transition-colors"
                value={formData.ncc}
                onChange={e => setFormData({...formData, ncc: e.target.value})}
                placeholder="Ex: M042318164160W"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.75rem] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Hash size={14} className="text-primary" />
                Registre de Commerce (RCCM)
              </label>
              <input 
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-text-heading font-bold focus:outline-none focus:border-primary/50 transition-colors"
                value={formData.rccm}
                onChange={e => setFormData({...formData, rccm: e.target.value})}
                placeholder="Ex: 1391CH/N°94C1175/71994"
              />
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-black/5 dark:border-white/5 flex items-center gap-4">
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-8 py-4 bg-primary text-black rounded-xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 disabled:opacity-70 disabled:scale-100"
            >
              {isSaving ? (
                <>Sauvegarde en cours...</>
              ) : (
                <>
                  <CheckCircle size={18} strokeWidth={2.5} />
                  Enregistrer les modifications
                </>
              )}
            </button>
            <p className="text-xs text-text-muted font-medium">
              Les modifications seront immédiatement répercutées sur les nouvelles factures.
            </p>
          </div>
        </form>
        
      </div>
    </div>
  );
};

export default CompanySettings;
