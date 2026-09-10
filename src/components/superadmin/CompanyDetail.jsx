import React, { useCallback, useEffect, useState } from 'react';
import { Tabs, Switch, Tag, message, Popconfirm } from 'antd';
import {
  BankOutlined, AppstoreOutlined, TeamOutlined, WarningOutlined,
  ArrowLeftOutlined, MailOutlined, StopOutlined, CheckCircleOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { Panel, Input, Select, Button, Table } from '../ui';
import { FEATURES, isFeatureEnabled } from '../../config/features';
import { LANGUAGES } from '../../i18n/translations';
import {
  updateCompany, setCompanyFeatures, fetchCompanyMembers,
  setMemberActive, setMemberRole, sendMemberPasswordReset,
  setCompanyStatus, deleteCompany,
} from '../../services/companyService';

const ROLES = [
  { value: 'ceo', label: 'Direction' },
  { value: 'manager', label: 'Gestionnaire' },
  { value: 'accountant', label: 'Comptable' },
  { value: 'cashier', label: 'Caissier' },
  { value: 'storekeeper', label: 'Magasinier' },
];

/**
 * Fiche complète d'une entreprise : informations, modules, membres, et les
 * opérations sensibles. C'est depuis ici que l'exploitant intervient quand un
 * client est bloqué, sans avoir à ouvrir la console Supabase.
 */
const CompanyDetail = ({ company, onBack, onChanged }) => {
  const [info, setInfo] = useState({ ...company });
  const [features, setFeatures] = useState(company.features || {});
  const [members, setMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirmName, setConfirmName] = useState('');

  const loadMembers = useCallback(async () => {
    try { setMembers(await fetchCompanyMembers(company.id)); }
    catch (err) { message.error(err.message); }
  }, [company.id]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const saveInfo = async () => {
    setSaving(true);
    try {
      await updateCompany(company.id, {
        name: info.name, activity: info.activity, phones: info.phones,
        ncc: info.ncc, rccm: info.rccm, language: info.language,
        max_stores: info.max_stores ? Number(info.max_stores) : null,
        max_users: info.max_users ? Number(info.max_users) : null,
        notes: info.notes || '',
      });
      message.success('Entreprise mise à jour.');
      onChanged?.();
    } catch (err) { message.error(err.message); }
    finally { setSaving(false); }
  };

  const saveFeatures = async (key, enabled) => {
    const next = { ...features, [key]: enabled };
    setFeatures(next);
    try { await setCompanyFeatures(company.id, next); onChanged?.(); }
    catch (err) { setFeatures(features); message.error(err.message); }
  };

  const memberColumns = [
    {
      key: 'name', title: 'Membre',
      render: (v, row) => (
        <div className="min-w-0">
          <div className="text-[0.82rem] font-medium text-text-heading truncate">{v}</div>
          <div className="text-[0.68rem] text-text-muted truncate">{row.username}</div>
        </div>
      ),
    },
    {
      key: 'role', title: 'Rôle',
      render: (v, row) => (
        <Select value={v} width={140} options={ROLES}
                onChange={async (role) => {
                  try { await setMemberRole(row.id, role); message.success('Rôle modifié.'); loadMembers(); }
                  catch (err) { message.error(err.message); }
                }} />
      ),
    },
    {
      key: 'is_active', title: 'Statut',
      render: (v) => <Tag color={v ? 'green' : 'red'} bordered={false}>{v ? 'Actif' : 'Suspendu'}</Tag>,
    },
    {
      key: 'id', title: 'Actions', align: 'right',
      render: (_v, row) => (
        <div className="flex items-center gap-2 justify-end">
          <Button icon={<MailOutlined />}
                  onClick={async () => {
                    try {
                      await sendMemberPasswordReset(row.email || '');
                      message.success('Lien de réinitialisation envoyé.');
                    } catch (err) { message.error(err.message); }
                  }}>
            Réinitialiser
          </Button>
          <Button danger={row.is_active} icon={row.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
                  onClick={async () => {
                    try { await setMemberActive(row.id, !row.is_active); loadMembers(); }
                    catch (err) { message.error(err.message); }
                  }}>
            {row.is_active ? 'Suspendre' : 'Réactiver'}
          </Button>
        </div>
      ),
    },
  ];

  const tabs = [
    {
      key: 'info', label: <span className="flex items-center gap-1.5"><BankOutlined /> Informations</span>,
      children: (
        <Panel>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Nom" value={info.name || ''} onChange={e => setInfo(i => ({ ...i, name: e.target.value }))} />
              <Input label="Activité" value={info.activity || ''} onChange={e => setInfo(i => ({ ...i, activity: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label="Téléphones" value={info.phones || ''} onChange={e => setInfo(i => ({ ...i, phones: e.target.value }))} />
              <Input label="NCC" value={info.ncc || ''} onChange={e => setInfo(i => ({ ...i, ncc: e.target.value }))} />
              <Input label="RCCM" value={info.rccm || ''} onChange={e => setInfo(i => ({ ...i, rccm: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="custom-input-label">Langue</label>
                <Select value={info.language} width="100%" options={LANGUAGES}
                        onChange={v => setInfo(i => ({ ...i, language: v }))} />
              </div>
              <Input label="Magasins max." type="number" placeholder="Illimité"
                     value={info.max_stores ?? ''} onChange={e => setInfo(i => ({ ...i, max_stores: e.target.value }))} />
              <Input label="Utilisateurs max." type="number" placeholder="Illimité"
                     value={info.max_users ?? ''} onChange={e => setInfo(i => ({ ...i, max_users: e.target.value }))} />
            </div>
            <Input label="Notes internes" value={info.notes || ''}
                   onChange={e => setInfo(i => ({ ...i, notes: e.target.value }))}
                   hint="Visible du superadmin uniquement." />
          </div>
          <div className="flex justify-end mt-3">
            <Button type="primary" loading={saving} onClick={saveInfo}>Enregistrer</Button>
          </div>
        </Panel>
      ),
    },
    {
      key: 'features', label: <span className="flex items-center gap-1.5"><AppstoreOutlined /> Modules</span>,
      children: (
        <Panel subtitle="Couper un module masque ses écrans. Les données sont conservées.">
          <ul className="divide-y divide-black/5 dark:divide-white/10 -my-2">
            {FEATURES.map(f => (
              <li key={f.key} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="text-[0.84rem] font-medium text-text-heading">{f.label}</div>
                  <div className="text-[0.74rem] text-text-muted">{f.description}</div>
                </div>
                <Switch checked={isFeatureEnabled(features, f.key)}
                        onChange={(v) => saveFeatures(f.key, v)} />
              </li>
            ))}
          </ul>
        </Panel>
      ),
    },
    {
      key: 'members', label: <span className="flex items-center gap-1.5"><TeamOutlined /> Membres ({members.length})</span>,
      children: (
        <Panel noPadding>
          <Table columns={memberColumns} data={members} rowKey="id"
                 emptyIcon={TeamOutlined} emptyTitle="Aucun membre"
                 emptyDescription="L'administrateur de cette entreprise n'a encore créé personne." />
        </Panel>
      ),
    },
    {
      key: 'danger', label: <span className="flex items-center gap-1.5"><WarningOutlined /> Zone sensible</span>,
      children: (
        <div className="space-y-4">
          <Panel title="Suspendre l'accès" icon={StopOutlined}
                 subtitle="Les utilisateurs ne peuvent plus se connecter. Les données sont conservées.">
            <Popconfirm
              title={company.status === 'active' ? "Suspendre l'entreprise ?" : 'Réactiver ?'}
              onConfirm={async () => {
                try {
                  await setCompanyStatus(company.id, company.status === 'active' ? 'suspended' : 'active');
                  message.success('Statut modifié.'); onChanged?.(); onBack();
                } catch (err) { message.error(err.message); }
              }}
            >
              <Button danger={company.status === 'active'}>
                {company.status === 'active' ? "Suspendre l'entreprise" : "Réactiver l'entreprise"}
              </Button>
            </Popconfirm>
          </Panel>

          <Panel title="Supprimer définitivement" icon={DeleteOutlined}
                 subtitle="Magasins, produits, ventes et comptes seront effacés. Sans retour possible.">
            <p className="text-[0.8rem] text-text-secondary mb-3">
              Pour confirmer, saisissez le nom exact de l'entreprise :{' '}
              <strong className="text-text-heading">{company.name}</strong>
            </p>
            <Input value={confirmName} onChange={e => setConfirmName(e.target.value)}
                   placeholder={company.name} />
            <div className="flex justify-end mt-3">
              <Button danger type="primary" icon={<DeleteOutlined />}
                      disabled={confirmName !== company.name}
                      onClick={async () => {
                        try {
                          await deleteCompany(company.id);
                          message.success('Entreprise supprimée.');
                          onChanged?.(); onBack();
                        } catch (err) { message.error(err.message); }
                      }}>
                Supprimer définitivement
              </Button>
            </div>
          </Panel>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>Retour</Button>
        <h2 className="text-[0.95rem] font-semibold text-text-heading">{company.name}</h2>
        <Tag color={company.status === 'active' ? 'green' : 'red'} bordered={false}>
          {company.status === 'active' ? 'Active' : 'Suspendue'}
        </Tag>
        <span className="text-[0.72rem] text-text-muted">{company.slug}</span>
      </div>
      <Tabs items={tabs} />
    </div>
  );
};

export default CompanyDetail;
