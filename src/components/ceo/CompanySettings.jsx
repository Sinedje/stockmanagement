import React, { useState } from 'react';
import { useSettings } from '../../hooks';
import { useI18n } from '../../i18n/I18nContext';
import { LANGUAGES } from '../../i18n/translations';
import { Panel, Select } from '../ui';
import MyAccountPanel from '../account/MyAccountPanel';
import { CheckCircleOutlined, FileTextOutlined, GlobalOutlined, NumberOutlined, PhoneOutlined, SettingOutlined, ShopOutlined } from '@ant-design/icons';
import { message } from 'antd';

const CompanySettings = () => {
  const { companySettings, updateCompanySettings } = useSettings();
  const { language, setLanguage, t } = useI18n();
  const [formData, setFormData] = useState({ ...companySettings });

  // `formData` est figé au montage. Sans ce recalage, enregistrer le formulaire
  // réécrivait `language` avec la valeur d'origine et annulait un changement de
  // langue fait entre-temps. La langue a son propre sélecteur : on l'exclut de
  // la charge utile du formulaire.
  const { language: _ignoredLanguage, ...companyFields } = formData;
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate slight delay for UX
    setTimeout(() => {
      updateCompanySettings(companyFields);
      setIsSaving(false);
      message.success(t('common.settingsSaved'));
    }, 500);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <MyAccountPanel />

      <Panel icon={GlobalOutlined} title={t('common.language')} subtitle={t('common.languageHint')}>
        <Select
          value={language}
          onChange={setLanguage}
          options={LANGUAGES}
          width={200}
        />
      </Panel>

      <div className="glass-panel rounded-xl p-5">
        
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[0.75rem] font-semibold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <ShopOutlined style={{ fontSize: 14 }} className="text-primary" />
                {t('s.nom_de_l_entreprise')}
              </label>
              <input 
                required
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-text-heading font-bold focus:outline-none focus:border-primary/50 transition-colors"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder={t('s.ex_groupe_t_grand_zao')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.75rem] font-semibold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <FileTextOutlined style={{ fontSize: 14 }} className="text-primary" />
                {t('s.activite_sous_titre')}
              </label>
              <input 
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-text-heading font-bold focus:outline-none focus:border-primary/50 transition-colors"
                value={formData.activity}
                onChange={e => setFormData({...formData, activity: e.target.value})}
                placeholder={t('s.ex_commerce_general')}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[0.75rem] font-semibold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <PhoneOutlined style={{ fontSize: 14 }} className="text-primary" />
                {t('s.telephones_separes_par_des')}
              </label>
              <input 
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-text-heading font-bold focus:outline-none focus:border-primary/50 transition-colors"
                value={formData.phones}
                onChange={e => setFormData({...formData, phones: e.target.value})}
                placeholder={t('s.ex_659_146_882_672_126_507')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.75rem] font-semibold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <NumberOutlined style={{ fontSize: 14 }} className="text-primary" />
                {t('s.numero_de_compte_contribuable_ncc')}
              </label>
              <input 
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-text-heading font-bold focus:outline-none focus:border-primary/50 transition-colors"
                value={formData.ncc}
                onChange={e => setFormData({...formData, ncc: e.target.value})}
                placeholder={t('s.ex_m042318164160w')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.75rem] font-semibold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <NumberOutlined style={{ fontSize: 14 }} className="text-primary" />
                {t('s.registre_de_commerce_rccm')}
              </label>
              <input 
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-text-heading font-bold focus:outline-none focus:border-primary/50 transition-colors"
                value={formData.rccm}
                onChange={e => setFormData({...formData, rccm: e.target.value})}
                placeholder={t('s.ex_1391ch_n94c1175_71994')}
              />
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-black/5 dark:border-white/5 flex items-center gap-4">
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-8 py-4 bg-primary text-white rounded-xl font-semibold uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-sm shadow-primary/20 flex items-center gap-2 disabled:opacity-70 disabled:scale-100"
            >
              {isSaving ? (
                <>{t('s.sauvegarde_en_cours')}</>
              ) : (
                <>
                  <CheckCircleOutlined style={{ fontSize: 18 }} />
                  {t('s.enregistrer_les_modifications')}
                </>
              )}
            </button>
            <p className="text-xs text-text-muted font-medium">
              {t('s.les_modifications_seront_immediatement_reper')}
            </p>
          </div>
        </form>
        
      </div>
    </div>
  );
};

export default CompanySettings;
