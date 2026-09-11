import { useT } from '../../i18n/I18nContext';
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

const buildSteps = (t) => [
  { title: t('s.entreprise'),     icon: <BankOutlined /> },
  { title: t('s.modules'),        icon: <AppstoreOutlined /> },
  { title: t('s.administrateur'), icon: <UserOutlined /> },
  { title: t('s.recapitulatif'),  icon: <CheckCircleOutlined /> },
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
  const t = useT();
  const STEPS = buildSteps(t);
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
              <Input label={t('s.nom')} value={form.name} onChange={set('name')} placeholder={t('s.ex_feu_flamenco')} />
              <Input label="Identifiant d'URL" value={form.slug}
                     onChange={(e) => { setSlugTouched(true); setForm(f => ({ ...f, slug: toSlug(e.target.value) })); }}
                     hint={t('s.lettres_chiffres_et_tirets')} />
            </div>
            <Input label={t('s.activite')} value={form.activity} onChange={set('activity')}
                   placeholder={t('s.ex_vente_de_materiel_de_securite_incendie')} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label={t('s.telephones')} value={form.phones} onChange={set('phones')} />
              <Input label={t('s.niu')} value={form.ncc} onChange={set('ncc')} hint="Numéro d'identifiant unique" />
              <Input label={t('s.rccm')} value={form.rccm} onChange={set('rccm')} />
            </div>
            <div>
              <label className="custom-input-label">{t('s.langue_par_defaut')}</label>
              <Select value={form.language} onChange={set('language')} options={LANGUAGES} width={200} />
            </div>
          </div>
        </Panel>
      )}

      {step === 1 && (
        <>
          <Panel title={t('s.modules_actives')} icon={AppstoreOutlined}
                 subtitle={t('s.modifiables_a_tout_moment_apres_la_creation')}>
            <ul className="divide-y divide-black/5 dark:divide-white/10 -my-2">
              {FEATURES.map(f => (
                <li key={f.key} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="text-[0.84rem] font-medium text-text-heading">{t(f.labelKey)}</div>
                    <div className="text-[0.74rem] text-text-muted">{t(f.descriptionKey)}</div>
                  </div>
                  <Switch checked={isFeatureEnabled(form.features, f.key)}
                          onChange={(v) => setForm(fm => ({ ...fm, features: { ...fm.features, [f.key]: v } }))} />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title={t('s.quotas')} icon={AppstoreOutlined}
                 subtitle={t('s.laisser_vide_pour_ne_pas_limiter_appliques_p')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label={t('s.magasins_maximum')} type="number" min="1" value={form.maxStores}
                     onChange={set('maxStores')} placeholder={t('s.illimite')} />
              <Input label={t('s.utilisateurs_maximum')} type="number" min="1" value={form.maxUsers}
                     onChange={set('maxUsers')} placeholder={t('s.illimite')} />
            </div>
          </Panel>
        </>
      )}

      {step === 2 && (
        <Panel title={t('s.compte_administrateur')} icon={UserOutlined}
               subtitle={t('s.il_creera_ensuite_lui_meme_ses_magasins_et_s')}>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label={t('s.nom_complet_2')} value={form.adminName} onChange={set('adminName')}
                     placeholder={t('s.ex_jean_kouassi')} />
              <Input label={t('s.e_mail_identifiant_de_connexion')} type="email"
                     value={form.adminEmail} onChange={set('adminEmail')}
                     placeholder={t('s.admin_entreprise_com')} />
            </div>
            <Input label="Nom d'utilisateur" value={form.adminUsername} onChange={set('adminUsername')}
                   hint="Affiché dans l'application. Unique au sein de l'entreprise." />
            <Input label={t('s.notes_internes')} value={form.notes} onChange={set('notes')}
                   hint={t('s.visible_du_superadmin_uniquement')} />
          </div>
        </Panel>
      )}

      {step === 3 && (
        <Panel title={t('s.verifiez_avant_de_creer')} icon={CheckCircleOutlined}>
          <dl className="text-[0.82rem] divide-y divide-black/5 dark:divide-white/10">
            {[
              [t('s.entreprise'), form.name],
              [t('s.identifiant_d_url'), form.slug],
              [t('s.activite'), form.activity || '—'],
              [t('s.langue'), LANGUAGES.find(l => l.value === form.language)?.label],
              [t('s.modules'), disabledCount ? t('s.n_sur_total', { n: FEATURES.length - disabledCount, total: FEATURES.length }) : t('s.tous_actives')],
              [t('s.quotas'), [form.maxStores && t('s.n_magasins', { n: form.maxStores }),
                form.maxUsers && t('s.n_utilisateurs', { n: form.maxUsers })]
                .filter(Boolean).join(' · ') || t('s.illimites')],
              [t('s.administrateur'), `${form.adminName} · ${form.adminEmail}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2">
                <dt className="text-text-muted">{k}</dt>
                <dd className="text-text-heading font-medium text-right min-w-0 truncate">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[0.76rem] text-text-muted mt-3">
            {t('s.un_mot_de_passe_provisoire_sera_genere_trans')}
          </p>
        </Panel>
      )}

      {error && <p className="text-[0.8rem] text-red-500 px-1">{error}</p>}

      <div className="flex items-center justify-between gap-2">
        <Button onClick={step === 0 ? onCancel : back} icon={step === 0 ? null : <ArrowLeftOutlined />}>
          {step === 0 ? t('s.annuler') : t('s.precedent')}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="primary" onClick={next}>
            {t('s.suivant')} <ArrowRightOutlined />
          </Button>
        ) : (
          <Button type="primary" loading={saving} onClick={submit} icon={<CheckCircleOutlined />}>
            {t('s.creer_l_entreprise')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CompanyWizard;
