import React, { useState } from 'react';
import { Modal, Input, Select } from '../ui';
import { LANGUAGES } from '../../i18n/translations';

/** Dérive un identifiant d'URL lisible à partir du nom saisi. */
const toSlug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
   .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

/**
 * Création d'une entreprise et de son premier administrateur, en une étape.
 * Séparer les deux laisserait une entreprise sans moyen de connexion.
 */
const CompanyFormModal = ({ onClose, onSubmit, saving }) => {
  const [form, setForm] = useState({
    name: '', slug: '', activity: '', phones: '', ncc: '', rccm: '', language: 'fr',
    adminName: '', adminEmail: '', adminUsername: 'admin',
  });
  const [error, setError] = useState('');

  const set = (k) => (e) => {
    const v = e?.target ? e.target.value : e;
    setForm(f => ({
      ...f,
      [k]: v,
      // Le slug suit le nom tant que l'utilisateur ne l'a pas édité lui-même.
      ...(k === 'name' && !f.slugTouched ? { slug: toSlug(v) } : {}),
    }));
  };

  const submit = () => {
    if (!form.name.trim()) return setError("Le nom de l'entreprise est obligatoire.");
    if (!form.slug.trim()) return setError("L'identifiant d'URL est obligatoire.");
    if (!form.adminName.trim()) return setError("Le nom de l'administrateur est obligatoire.");
    if (!/^\S+@\S+\.\S+$/.test(form.adminEmail)) return setError("L'e-mail de l'administrateur est invalide.");
    setError('');
    onSubmit({
      name: form.name.trim(), slug: form.slug.trim(), activity: form.activity.trim(),
      phones: form.phones.trim(), ncc: form.ncc.trim(), rccm: form.rccm.trim(),
      language: form.language,
      admin: { name: form.adminName.trim(), email: form.adminEmail.trim(), username: form.adminUsername.trim() || 'admin' },
    });
  };

  return (
    <Modal
      title="Nouvelle entreprise"
      onClose={onClose}
      onOk={submit}
      okText="Créer l'entreprise"
      confirmLoading={saving}
      width={620}
    >
      <div className="space-y-4">
        <section className="space-y-3">
          <h4 className="text-[0.7rem] font-semibold uppercase tracking-wide text-text-muted">Entreprise</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Nom" value={form.name} onChange={set('name')} placeholder="Ex : FEU FLAMENCO" />
            <Input
              label="Identifiant d'URL"
              value={form.slug}
              onChange={(e) => setForm(f => ({ ...f, slug: toSlug(e.target.value), slugTouched: true }))}
              hint="Sert à identifier l'entreprise. Lettres, chiffres et tirets."
            />
          </div>
          <Input label="Activité" value={form.activity} onChange={set('activity')} placeholder="Ex : Vente de matériel…" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Téléphones" value={form.phones} onChange={set('phones')} />
            <Input label="NCC" value={form.ncc} onChange={set('ncc')} />
            <Input label="RCCM" value={form.rccm} onChange={set('rccm')} />
          </div>
          <div>
            <label className="custom-input-label">Langue par défaut</label>
            <Select value={form.language} onChange={set('language')} options={LANGUAGES} width={200} />
          </div>
        </section>

        <section className="space-y-3 pt-3 border-t border-black/5 dark:border-white/10">
          <h4 className="text-[0.7rem] font-semibold uppercase tracking-wide text-text-muted">
            Administrateur de l'entreprise
          </h4>
          <p className="text-[0.75rem] text-text-muted -mt-1">
            Ce compte pourra ensuite créer les magasins et les autres membres.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Nom complet" value={form.adminName} onChange={set('adminName')} placeholder="Ex : Jean Kouassi" />
            <Input label="E-mail (identifiant de connexion)" type="email" value={form.adminEmail} onChange={set('adminEmail')} placeholder="admin@entreprise.com" />
          </div>
          <Input label="Nom d'utilisateur" value={form.adminUsername} onChange={set('adminUsername')} hint="Affiché dans l'application. Unique au sein de l'entreprise." />
        </section>

        {error && <p className="text-[0.78rem] text-red-500">{error}</p>}
      </div>
    </Modal>
  );
};

export default CompanyFormModal;
