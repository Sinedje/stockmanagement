import React, { useEffect, useState } from 'react';
import { Switch, message } from 'antd';
import { AppstoreOutlined, UserOutlined, KeyOutlined, MailOutlined } from '@ant-design/icons';
import { Panel, Input, Button } from '../ui';
import { useAuth } from '../../context/AuthContext';
import { FEATURES, isFeatureEnabled } from '../../config/features';
import {
  fetchPlatformSettings, updatePlatformSettings,
  updateMyProfile, updateMyEmail, updateMyPassword,
} from '../../services/companyService';

/**
 * Réglages de l'exploitant : modules proposés par défaut, et son propre compte.
 *
 * Les bascules ci-dessous ne touchent PAS les entreprises existantes — elles
 * définissent l'état initial des prochaines. Modifier après coup ce qui a déjà
 * été vendu à un client serait une mauvaise surprise ; cela se fait entreprise
 * par entreprise depuis la liste.
 */
const PlatformSettingsPanel = () => {
  const { currentUser } = useAuth();
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingFeature, setSavingFeature] = useState(null);

  const [profile, setProfile] = useState({ name: '', username: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [email, setEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [pwd, setPwd] = useState({ a: '', b: '' });
  const [savingPwd, setSavingPwd] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlatformSettings()
      .then(s => setFeatures(s.default_features || {}))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (currentUser) {
      setProfile({ name: currentUser.name || '', username: currentUser.username || '' });
      setEmail(currentUser.email || '');
    }
  }, [currentUser]);

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

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateMyProfile(profile);
      message.success('Profil mis à jour. Rechargez pour voir le changement partout.');
    } catch (err) { message.error(err.message); }
    finally { setSavingProfile(false); }
  };

  const saveEmail = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return message.error('Adresse invalide.');
    setSavingEmail(true);
    try {
      await updateMyEmail(email);
      message.info(`Un lien de confirmation a été envoyé à ${email}. Le changement prendra effet ensuite.`);
    } catch (err) { message.error(err.message); }
    finally { setSavingEmail(false); }
  };

  const savePassword = async () => {
    if (pwd.a.length < 8) return message.error('8 caractères minimum.');
    if (pwd.a !== pwd.b) return message.error('Les deux mots de passe diffèrent.');
    setSavingPwd(true);
    try {
      await updateMyPassword(pwd.a);
      setPwd({ a: '', b: '' });
      message.success('Mot de passe modifié.');
    } catch (err) { message.error(err.message); }
    finally { setSavingPwd(false); }
  };

  return (
    <div className="animate-fade-in space-y-4">
      <Panel
        title="Modules activés par défaut" icon={AppstoreOutlined}
        subtitle="S'appliquent aux entreprises créées ensuite, pas aux existantes"
      >
        {error && <p className="text-[0.8rem] text-red-500 mb-3">{error}</p>}
        {loading ? (
          <p className="py-4 text-[0.82rem] text-text-muted">Chargement…</p>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10 -my-2">
            {FEATURES.map(f => (
              <li key={f.key} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="text-[0.84rem] font-medium text-text-heading">{f.label}</div>
                  <div className="text-[0.74rem] text-text-muted">{f.description}</div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Mon profil" icon={UserOutlined}>
          <div className="space-y-3">
            <Input label="Nom" value={profile.name}
                   onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
            <Input label="Nom d'utilisateur" value={profile.username}
                   onChange={e => setProfile(p => ({ ...p, username: e.target.value }))} />
          </div>
          <div className="flex justify-end mt-3">
            <Button type="primary" loading={savingProfile} onClick={saveProfile}>Enregistrer</Button>
          </div>
        </Panel>

        <Panel title="Adresse de connexion" icon={MailOutlined}>
          <Input label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)}
                 hint="Un lien de confirmation sera envoyé à la nouvelle adresse." />
          <div className="flex justify-end mt-3">
            <Button loading={savingEmail} onClick={saveEmail}>Changer l'adresse</Button>
          </div>
        </Panel>
      </div>

      <Panel title="Mot de passe" icon={KeyOutlined}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Nouveau mot de passe" type="password" value={pwd.a}
                 onChange={e => setPwd(p => ({ ...p, a: e.target.value }))} hint="8 caractères minimum" />
          <Input label="Confirmation" type="password" value={pwd.b}
                 onChange={e => setPwd(p => ({ ...p, b: e.target.value }))} />
        </div>
        <div className="flex justify-end mt-3">
          <Button type="primary" loading={savingPwd} onClick={savePassword}>Modifier</Button>
        </div>
      </Panel>
    </div>
  );
};

export default PlatformSettingsPanel;
