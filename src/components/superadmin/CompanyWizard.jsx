import React, { useEffect, useMemo, useState } from 'react';
import { Steps, Switch } from 'antd';
import {
  BankOutlined, AppstoreOutlined, UserOutlined, CheckCircleOutlined,
  ArrowLeftOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import { Panel, Input, Select, Button } from '../ui';
import { LANGUAGES } from '../../i18n/translations';
import { FEATURES, isFeatureEnabled } from '../../config/features';
import { fetchPlatformSettings } from '../../services/companyService';

/** Identifiant d'URL lisible dérivé du nom. */
const toSlug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
   .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

const STEPS = [
  { title: 'Entreprise',     icon: <BankOutlined /> },
  { title: 'Modules',        icon: <AppstoreOutlined /> },
  { title: 'Administrateur', icon: <UserOutlined /> },
  { title: 'Récapitulatif',  icon: <CheckCircleOutlined /> },
];

/**
 * Création d'une entreprise, en quatre étapes.
 *
 * Un assistant plutôt qu'une fenêtre unique : il y a quatre sujets distincts
 * (identité, modules, quotas, compte d'accès) et les valider un par un évite
 * un formulaire décourageant où l'on ne sait plus ce qui reste à remplir.
 * Chaque étape est vérifiée avant de passer à la suivante.
 */
const CompanyWizard = ({ onCancel, onSubmit, saving }) => {
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', activity: '', phones: '', ncc: '', rccm: '',
    language: 'fr', maxStores: '', maxUsers: '', notes: '',
    features: {},
    adminName: '', adminEmail: '', adminUsername: 'admin',
  });

  // Les modules partent des valeurs par défaut de la plateforme.
  useEffect(() => {
    fetchPlatformSettings()
      .then(s => setForm(f => ({ ...f, features: s.default_features || {} })))
      .catch(() => { /* valeurs par défaut : tout activé */ });
  }, []);

  const set = (k) => (e) => {
    const v = e?.target ? e.target.value : e;
    setForm(f => ({
      ...f,
      [k]: v,
      ...(k === 'name' && !slugTouched ? { slug: toSlug(v) } : {}),
    }));
  };

  const problems = useMemo(() => ({
    0: !form.name.trim() ? "Le nom de l'entreprise est obligatoire."
       : !form.slug.trim() ? "L'identifiant d'URL est obligatoire." : '',
    1: '',
    2: !form.adminName.trim() ? "Le nom de l'administrateur est obligatoire."
       : !/^\S+@\S+\.\S+$/.test(form.adminEmail) ? "L'e-mail de l'administrateur est invalide." : '',
    3: '',
  }), [form, slugTouched]);

  const next = () => {
    const p = problems[step];
    if (p) return setError(p);
    setError('');
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => { setError(''); setStep(s => Math.max(s - 1, 0)); };

  const submit = () => {
    for (const i of [0, 2]) {
      if (problems[i]) { setStep(i); return setError(problems[i]); }
    }
    onSubmit({
      name: form.name.trim(), slug: form.slug.trim(), activity: form.activity.trim(),
      phones: form.phones.trim(), ncc: form.ncc.trim(), rccm: form.rccm.trim(),
      language: form.language,
      features: form.features,
      max_stores: form.maxStores ? Number(form.maxStores) : null,
      max_users: form.maxUsers ? Number(form.maxUsers) : null,
      notes: form.notes.trim(),
      admin: {
        name: form.adminName.trim(),
        email: form.adminEmail.trim(),
        username: form.adminUsername.trim() || 'admin',
      },
    });
  };

  const disabledCount = Object.values(form.features).filter(v => v === false).length;

  return (
    <div className="animate-fade-in space-y-4">
      <Panel>
        <Steps current={step} items={STEPS} size="small" />
      </Panel>

      {step === 0 && (
        <Panel title="Identité de l'entreprise" icon={BankOutlined}>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Nom" value={form.name} onChange={set('name')} placeholder="Ex : FEU FLAMENCO" />
              <Input label="Identifiant d'URL" value={form.slug}
                     onChange={(e) => { setSlugTouched(true); setForm(f => ({ ...f, slug: toSlug(e.target.value) })); }}
                     hint="Lettres, chiffres et tirets." />
            </div>
            <Input label="Activité" value={form.activity} onChange={set('activity')}
                   placeholder="Ex : Vente de matériel de sécurité incendie" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label="Téléphones" value={form.phones} onChange={set('phones')} />
              <Input label="NCC" value={form.ncc} onChange={set('ncc')} />
              <Input label="RCCM" value={form.rccm} onChange={set('rccm')} />
            </div>
            <div>
              <label className="custom-input-label">Langue par défaut</label>
              <Select value={form.language} onChange={set('language')} options={LANGUAGES} width={200} />
            </div>
          </div>
        </Panel>
      )}

      {step === 1 && (
        <>
          <Panel title="Modules activés" icon={AppstoreOutlined}
                 subtitle="Modifiables à tout moment après la création">
            <ul className="divide-y divide-black/5 dark:divide-white/10 -my-2">
              {FEATURES.map(f => (
                <li key={f.key} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="text-[0.84rem] font-medium text-text-heading">{f.label}</div>
                    <div className="text-[0.74rem] text-text-muted">{f.description}</div>
                  </div>
                  <Switch checked={isFeatureEnabled(form.features, f.key)}
                          onChange={(v) => setForm(fm => ({ ...fm, features: { ...fm.features, [f.key]: v } }))} />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Quotas" icon={AppstoreOutlined}
                 subtitle="Laisser vide pour ne pas limiter. Appliqués par la base de données.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Magasins maximum" type="number" min="1" value={form.maxStores}
                     onChange={set('maxStores')} placeholder="Illimité" />
              <Input label="Utilisateurs maximum" type="number" min="1" value={form.maxUsers}
                     onChange={set('maxUsers')} placeholder="Illimité" />
            </div>
          </Panel>
        </>
      )}

      {step === 2 && (
        <Panel title="Compte administrateur" icon={UserOutlined}
               subtitle="Il créera ensuite lui-même ses magasins et ses collaborateurs">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Nom complet" value={form.adminName} onChange={set('adminName')}
                     placeholder="Ex : Jean Kouassi" />
              <Input label="E-mail (identifiant de connexion)" type="email"
                     value={form.adminEmail} onChange={set('adminEmail')}
                     placeholder="admin@entreprise.com" />
            </div>
            <Input label="Nom d'utilisateur" value={form.adminUsername} onChange={set('adminUsername')}
                   hint="Affiché dans l'application. Unique au sein de l'entreprise." />
            <Input label="Notes internes" value={form.notes} onChange={set('notes')}
                   hint="Visible du superadmin uniquement." />
          </div>
        </Panel>
      )}

      {step === 3 && (
        <Panel title="Vérifiez avant de créer" icon={CheckCircleOutlined}>
          <dl className="text-[0.82rem] divide-y divide-black/5 dark:divide-white/10">
            {[
              ['Entreprise', form.name],
              ["Identifiant d'URL", form.slug],
              ['Activité', form.activity || '—'],
              ['Langue', LANGUAGES.find(l => l.value === form.language)?.label],
              ['Modules', disabledCount ? `${FEATURES.length - disabledCount} sur ${FEATURES.length}` : 'Tous activés'],
              ['Quotas', [form.maxStores && `${form.maxStores} magasins`, form.maxUsers && `${form.maxUsers} utilisateurs`]
                .filter(Boolean).join(' · ') || 'Illimités'],
              ['Administrateur', `${form.adminName} · ${form.adminEmail}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2">
                <dt className="text-text-muted">{k}</dt>
                <dd className="text-text-heading font-medium text-right min-w-0 truncate">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[0.76rem] text-text-muted mt-3">
            Un mot de passe provisoire sera généré : transmettez-le à l'administrateur,
            il le changera à sa première connexion.
          </p>
        </Panel>
      )}

      {error && <p className="text-[0.8rem] text-red-500 px-1">{error}</p>}

      <div className="flex items-center justify-between gap-2">
        <Button onClick={step === 0 ? onCancel : back} icon={step === 0 ? null : <ArrowLeftOutlined />}>
          {step === 0 ? 'Annuler' : 'Précédent'}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="primary" onClick={next}>
            Suivant <ArrowRightOutlined />
          </Button>
        ) : (
          <Button type="primary" loading={saving} onClick={submit} icon={<CheckCircleOutlined />}>
            Créer l'entreprise
          </Button>
        )}
      </div>
    </div>
  );
};

export default CompanyWizard;
