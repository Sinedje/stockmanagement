import { useI18n } from '../../i18n/I18nContext';
import { LANGUAGES } from '../../i18n/translations';
import React, { useEffect, useState } from 'react';
import { Tabs, Switch, message } from 'antd';
import { AppstoreOutlined, GlobalOutlined, UserOutlined } from '@ant-design/icons';
import { Panel, Select } from '../ui';
import MyAccountPanel from '../account/MyAccountPanel';
import { FEATURES, isFeatureEnabled } from '../../config/features';
import { fetchPlatformSettings, updatePlatformSettings } from '../../services/companyService';

/**
 * Réglages de l'exploitant : modules proposés par défaut, et son propre compte.
 *
 * Les bascules ci-dessous ne touchent PAS les entreprises existantes — elles
 * définissent l'état initial des prochaines. Modifier après coup ce qui a déjà
 * été vendu à un client serait une mauvaise surprise ; cela se fait entreprise
 * par entreprise depuis la liste.
 */
const PlatformSettingsPanel = () => {
  const { language, setLanguage, t } = useI18n();
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingFeature, setSavingFeature] = useState(null);

  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlatformSettings()
      .then(s => setFeatures(s.default_features || {}))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);


  const toggleFeature = async (key, enabled) => {
    const next = { ...features, [key]: enabled };
    setFeatures(next);
    setSavingFeature(key);
    try {
      await updatePlatformSettings({ default_features: next });
    } catch (err) {
      setFeatures(features);           // rétablir l'état affiché si l'écriture échoue
      message.error(err.message);
    } finally { setSavingFeature(null); }
  };




  // Le réglage de la plateforme et le compte de la personne qui l'exploite
  // n'ont rien à voir : les séparer évite de chercher son mot de passe sous la
  // liste des modules vendus.
  const tabs = [
    {
      key: 'platform',
      label: <span className="flex items-center gap-1.5"><AppstoreOutlined /> {t('s.plateforme')}</span>,
      children: (
        <Panel
          title={t('s.modules_actives_par_defaut')} icon={AppstoreOutlined}
          subtitle={t('s.s_appliquent_aux_entreprises_creees_ensuite_')}
        >
          {error && <p className="text-[0.8rem] text-red-500 mb-3">{error}</p>}
          {loading ? (
            <p className="py-4 text-[0.82rem] text-text-muted">{t('s.chargement')}</p>
          ) : (
            <ul className="divide-y divide-black/5 dark:divide-white/10 -my-2">
              {FEATURES.map(f => (
                <li key={f.key} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="text-[0.84rem] font-medium text-text-heading">{t(f.labelKey)}</div>
                    <div className="text-[0.74rem] text-text-muted">{t(f.descriptionKey)}</div>
                  </div>
                  <Switch
                    checked={isFeatureEnabled(features, f.key)}
                    loading={savingFeature === f.key}
                    onChange={(v) => toggleFeature(f.key, v)}
                  />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ),
    },
    {
      key: 'account',
      label: <span className="flex items-center gap-1.5"><UserOutlined /> {t('s.mon_compte')}</span>,
      children: (
        <div className="space-y-4">
          <MyAccountPanel />
          <Panel icon={GlobalOutlined} title={t('common.language')} subtitle={t('common.languageHint')}>
            <Select value={language} onChange={setLanguage} options={LANGUAGES} width={200} />
          </Panel>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <Tabs items={tabs} />
    </div>
  );
};

export default PlatformSettingsPanel;
