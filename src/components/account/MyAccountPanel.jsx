import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import { UserOutlined, KeyOutlined, MailOutlined } from '@ant-design/icons';
import { Panel, Input, Button } from '../ui';
import { useT } from '../../i18n/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { updateMyProfile, updateMyEmail, updateMyPassword } from '../../services/companyService';

/**
 * Nom, adresse de connexion et mot de passe du compte courant.
 *
 * Les trois appels visent `auth.getUser()` : ils conviennent à n'importe quel
 * rôle, du superadmin au magasinier. Ce panneau est donc partagé plutôt que
 * recopié dans chaque tableau de bord.
 */
const MyAccountPanel = () => {
  const t = useT();
  const { currentUser, setCurrentUser } = useAuth();

  const [profile, setProfile] = useState({ name: '', username: '' });
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState({ a: '', b: '' });
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (currentUser) {
      setProfile({ name: currentUser.name || '', username: currentUser.username || '' });
      setEmail(currentUser.email || '');
    }
  }, [currentUser]);

  const saveProfile = async () => {
    setSaving('profile');
    try {
      await updateMyProfile(profile);
      // Le nom s'affiche dans la barre latérale : le rafraîchir évite de
      // demander un rechargement pour voir sa propre modification.
      setCurrentUser((u) => (u ? { ...u, ...profile } : u));
      message.success(t('s.profil_mis_a_jour'));
    } catch (err) { message.error(err.message); }
    finally { setSaving(null); }
  };

  const saveEmail = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return message.error(t('s.adresse_invalide'));
    setSaving('email');
    try {
      await updateMyEmail(email);
      message.info(t('s.un_lien_de_confirmation_a_ete_envoye_a_email', { email }));
    } catch (err) { message.error(err.message); }
    finally { setSaving(null); }
  };

  const savePassword = async () => {
    if (pwd.a.length < 8) return message.error(t('s.8_caracteres_minimum_2'));
    if (pwd.a !== pwd.b) return message.error(t('s.les_deux_mots_de_passe_different'));
    setSaving('pwd');
    try {
      await updateMyPassword(pwd.a);
      setPwd({ a: '', b: '' });
      message.success(t('s.mot_de_passe_modifie'));
    } catch (err) { message.error(err.message); }
    finally { setSaving(null); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title={t('s.mon_profil')} icon={UserOutlined}>
          <div className="space-y-3">
            <Input label={t('s.nom')} value={profile.name}
                   onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
            <Input label={t('s.nom_d_utilisateur')} value={profile.username}
                   onChange={e => setProfile(p => ({ ...p, username: e.target.value }))} />
          </div>
          <div className="flex justify-end mt-3">
            <Button type="primary" loading={saving === 'profile'} onClick={saveProfile}>
              {t('s.enregistrer')}
            </Button>
          </div>
        </Panel>

        <Panel title={t('s.adresse_de_connexion')} icon={MailOutlined}>
          <Input label={t('s.e_mail')} type="email" value={email}
                 onChange={e => setEmail(e.target.value)}
                 hint={t('s.un_lien_de_confirmation_sera_envoye_a_la_nou')} />
          <div className="flex justify-end mt-3">
            <Button loading={saving === 'email'} onClick={saveEmail}>{t('s.changer_l_adresse')}</Button>
          </div>
        </Panel>
      </div>

      <Panel title={t('s.mot_de_passe')} icon={KeyOutlined}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label={t('s.nouveau_mot_de_passe')} type="password" value={pwd.a}
                 onChange={e => setPwd(p => ({ ...p, a: e.target.value }))}
                 hint={t('s.8_caracteres_minimum')} />
          <Input label={t('s.confirmation')} type="password" value={pwd.b}
                 onChange={e => setPwd(p => ({ ...p, b: e.target.value }))} />
        </div>
        <div className="flex justify-end mt-3">
          <Button type="primary" loading={saving === 'pwd'} onClick={savePassword}>
            {t('s.modifier')}
          </Button>
        </div>
      </Panel>
    </div>
  );
};

export default MyAccountPanel;
