import { useT } from '../i18n/I18nContext';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { KeyOutlined, MailOutlined } from '@ant-design/icons';
import { Panel, Input, Button } from '../components/ui';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { requestPasswordReset, updatePassword, translateAuthError } from '../services/authService';

/**
 * Réinitialisation du mot de passe.
 *
 * Deux états dans une seule page :
 *  - sans session de récupération : on demande l'adresse et on envoie le lien ;
 *  - avec session (l'utilisateur arrive depuis l'e-mail) : on saisit le
 *    nouveau mot de passe.
 *
 * Cet écran est indispensable : une fois l'installation terminée, /setup se
 * ferme définitivement. Sans lui, un mot de passe perdu enfermerait dehors le
 * seul superadmin, sans autre recours que la console Supabase.
 */
const ResetPassword = () => {
  const t = useT();
  const navigate = useNavigate();
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState({ a: '', b: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) { setChecking(false); return; }

    // Supabase pose la session de récupération à partir du fragment d'URL ;
    // l'évènement peut arriver juste après le montage.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setHasRecoverySession(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) setHasRecoverySession(true);
      setChecking(false);
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  const send = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Adresse e-mail invalide.");
    setError(''); setBusy(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(translateAuthError(err.message));
    } finally { setBusy(false); }
  };

  const save = async () => {
    if (pwd.a.length < 8) return setError('Le mot de passe doit faire au moins 8 caractères.');
    if (pwd.a !== pwd.b) return setError('Les deux mots de passe diffèrent.');
    setError(''); setBusy(true);
    try {
      await updatePassword(pwd.a);
      message.success('Mot de passe modifié.');
      navigate('/', { replace: true });
    } catch (err) {
      setError(translateAuthError(err.message));
    } finally { setBusy(false); }
  };

  const shell = (children) => (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary relative">
      <div className="app-ambient-bg" />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );

  if (checking) return shell(<Panel><p className="py-6 text-center text-[0.85rem] text-text-muted">{t('s.verification')}</p></Panel>);

  if (hasRecoverySession) {
    return shell(
      <Panel title={t('s.nouveau_mot_de_passe')} icon={KeyOutlined}>
        <div className="space-y-3">
          <Input label={t('s.nouveau_mot_de_passe')} type="password" value={pwd.a}
                 onChange={e => setPwd(p => ({ ...p, a: e.target.value }))} hint={t('s.8_caracteres_minimum')} />
          <Input label={t('s.confirmation')} type="password" value={pwd.b}
                 onChange={e => setPwd(p => ({ ...p, b: e.target.value }))} />
        </div>
        {error && <p className="text-[0.8rem] text-red-500 mt-2">{error}</p>}
        <div className="mt-4 flex justify-end">
          <Button type="primary" loading={busy} onClick={save}>{t('s.enregistrer')}</Button>
        </div>
      </Panel>
    );
  }

  return shell(
    <Panel title={t('s.mot_de_passe_oublie')} icon={MailOutlined}>
      {sent ? (
        <>
          <p className="text-[0.85rem] text-text-secondary leading-relaxed">
            Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation
            vient d'être envoyé. Ouvrez-le depuis ce navigateur.
          </p>
          <p className="text-[0.78rem] text-text-muted mt-3">
            {t('s.pensez_a_verifier_les_indesirables')}
          </p>
        </>
      ) : (
        <>
          <p className="text-[0.82rem] text-text-secondary mb-3">
            {t('s.saisissez_l_adresse_de_votre_compte_nous_vou')}
          </p>
          <Input label={t('s.e_mail')} type="email" value={email}
                 onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" />
          {error && <p className="text-[0.8rem] text-red-500">{error}</p>}
          <div className="mt-3 flex justify-between items-center">
            <button type="button" onClick={() => navigate('/login')}
                    className="text-[0.78rem] text-text-muted hover:text-primary">
              {t('s.retour_a_la_connexion')}
            </button>
            <Button type="primary" loading={busy} onClick={send}>{t('s.envoyer_le_lien')}</Button>
          </div>
        </>
      )}
    </Panel>
  );
};

export default ResetPassword;
