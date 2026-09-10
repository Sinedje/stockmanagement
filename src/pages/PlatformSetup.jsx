import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { SafetyCertificateOutlined, CheckCircleOutlined, MailOutlined } from '@ant-design/icons';
import { Panel, Input, Button } from '../components/ui';
import { isSupabaseConfigured } from '../lib/supabase';
import { needsBootstrap, bootstrapSuperadmin } from '../services/companyService';

/**
 * Écran d'installation — création du tout premier superadmin.
 *
 * Il n'apparaît que tant qu'aucun superadmin n'existe : c'est la base qui le
 * dit (`needs_bootstrap`), pas un réglage local. Une fois le compte créé, la
 * politique RLS correspondante ne peut plus être satisfaite et cet écran
 * redirige définitivement vers la connexion.
 */
const PlatformSetup = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [needed, setNeeded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [missingMigration, setMissingMigration] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) { setChecking(false); return; }
    needsBootstrap()
      .then(setNeeded)
      .catch(err => {
        // PGRST202 / 404 : la fonction n'existe pas encore côté base.
        // On le dit explicitement plutôt que d'afficher un écran vide.
        if (err?.code === 'PGRST202' || /not find the function/i.test(err?.message || '')) {
          setMissingMigration(true);
        } else {
          setError(err.message);
        }
      })
      .finally(() => setChecking(false));
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim()) return setError('Votre nom est obligatoire.');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("L'adresse e-mail est invalide.");
    if (form.password.length < 8) return setError('Le mot de passe doit faire au moins 8 caractères.');
    if (form.password !== form.confirm) return setError('Les deux mots de passe diffèrent.');

    setError('');
    setSaving(true);
    try {
      const res = await bootstrapSuperadmin({
        email: form.email.trim(), password: form.password, name: form.name.trim(),
      });
      setDone(res);
      if (!res.pendingEmailConfirmation) {
        message.success('Compte superadmin créé.');
        setTimeout(() => navigate('/companies', { replace: true }), 900);
      }
    } catch (err) {
      setError(err.message || 'Création impossible');
    } finally {
      setSaving(false);
    }
  };

  const shell = (children) => (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary relative">
      <div className="app-ambient-bg" />
      <div className="relative z-10 w-full max-w-lg">{children}</div>
    </div>
  );

  if (checking) {
    return shell(
      <Panel><p className="py-6 text-center text-[0.85rem] text-text-muted">Vérification…</p></Panel>
    );
  }

  if (!isSupabaseConfigured) {
    return shell(
      <Panel title="Supabase non configuré" icon={SafetyCertificateOutlined}>
        <p className="text-[0.85rem] text-text-secondary">
          Renseignez <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.
        </p>
      </Panel>
    );
  }

  if (missingMigration) {
    return shell(
      <Panel title="Migration manquante" icon={SafetyCertificateOutlined}>
        <p className="text-[0.85rem] text-text-secondary leading-relaxed">
          La fonction <code>needs_bootstrap</code> est absente de la base. Exécutez
          <code> supabase/migrations/0004_bootstrap.sql</code> dans le SQL Editor,
          puis rechargez cette page.
        </p>
      </Panel>
    );
  }

  if (!needed) {
    return shell(
      <Panel title="Installation déjà effectuée" icon={CheckCircleOutlined}>
        <p className="text-[0.85rem] text-text-secondary mb-4">
          Un compte superadmin existe déjà. Cet écran n'est plus accessible.
        </p>
        <Button type="primary" onClick={() => navigate('/login', { replace: true })}>
          Aller à la connexion
        </Button>
      </Panel>
    );
  }

  if (done?.pendingEmailConfirmation) {
    return shell(
      <Panel title="Confirmez votre adresse" icon={MailOutlined}>
        <p className="text-[0.85rem] text-text-secondary leading-relaxed">
          Un e-mail de confirmation a été envoyé à <strong>{form.email}</strong>. Validez-le,
          puis revenez sur cette page pour terminer l'installation.
        </p>
        <p className="text-[0.78rem] text-text-muted mt-3">
          Pour éviter cette étape, désactivez « Confirm email » dans Authentication → Providers.
        </p>
      </Panel>
    );
  }

  return shell(
    <Panel title="Installation de la plateforme" icon={SafetyCertificateOutlined}
           subtitle="Création du compte superadmin">
      <p className="text-[0.82rem] text-text-secondary leading-relaxed mb-4">
        Ce compte administre les entreprises clientes. Il ne peut être créé qu'une seule fois :
        une fois enregistré, cet écran devient inaccessible.
      </p>

      <div className="space-y-3">
        <Input label="Votre nom" value={form.name} onChange={set('name')} placeholder="Ex : Christopher Nde" />
        <Input label="E-mail" type="email" value={form.email} onChange={set('email')} placeholder="vous@exemple.com" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Mot de passe" type="password" value={form.password} onChange={set('password')} hint="8 caractères minimum" />
          <Input label="Confirmation" type="password" value={form.confirm} onChange={set('confirm')} />
        </div>
      </div>

      {error && <p className="text-[0.8rem] text-red-500 mt-2">{error}</p>}

      <div className="mt-4 flex justify-end">
        <Button type="primary" loading={saving} onClick={submit}>Créer le compte superadmin</Button>
      </div>
    </Panel>
  );
};

export default PlatformSetup;
