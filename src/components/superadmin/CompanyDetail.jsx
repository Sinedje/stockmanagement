import { useT } from '../../i18n/I18nContext';
import React, { useCallback, useEffect, useState } from 'react';
import { Tabs, Switch, Tag, message, Popconfirm } from 'antd';
import {
  BankOutlined, AppstoreOutlined, TeamOutlined, WarningOutlined,
  ArrowLeftOutlined, MailOutlined, StopOutlined, CheckCircleOutlined, DeleteOutlined,
  FileTextOutlined, DownloadOutlined,
} from '@ant-design/icons';
import { Panel, Input, Select, Button, Table } from '../ui';
import { FEATURES, isFeatureEnabled } from '../../config/features';
import { LANGUAGES } from '../../i18n/translations';
import {
  updateCompany, setCompanyFeatures, fetchCompanyMembers,
  setMemberActive, setMemberRole, sendMemberPasswordReset,
  setCompanyStatus, deleteCompany,
} from '../../services/companyService';
import { recordAudit, exportCompany, downloadJson } from '../../services/operationsService';
import AuditTable from './AuditTable';
import { useAuth } from '../../context/AuthContext';

// Construit à l'appel : les libellés dépendent de la langue courante, qui
// n'est pas connue au chargement du module.
const billingOptions = (t) => [
  { value: 'trial',     label: t('s.essai') },
  { value: 'active',    label: t('s.a_jour') },
  { value: 'overdue',   label: t('s.impaye') },
  { value: 'cancelled', label: t('s.resilie') },
];

const roleOptions = (t) => [
  { value: 'ceo', label: t('role.ceo') },
  { value: 'manager', label: t('role.manager') },
  { value: 'accountant', label: t('role.accountant') },
  { value: 'cashier', label: t('role.cashier') },
  { value: 'storekeeper', label: t('role.storekeeper') },
];

/**
 * Fiche complète d'une entreprise : informations, modules, membres, et les
 * opérations sensibles. C'est depuis ici que l'exploitant intervient quand un
 * client est bloqué, sans avoir à ouvrir la console Supabase.
 */
const CompanyDetail = ({ company, onBack, onChanged }) => {
  const t = useT();
  const { currentUser } = useAuth();

  // Toute action sensible laisse une trace : c'est ce qui rend une
  // intervention de l'exploitant opposable en cas de contestation.
  const trace = (action, target, details) => recordAudit({
    actor: currentUser, companyId: company.id, companyName: company.name,
    action, target, details,
  });

  const [info, setInfo] = useState({ ...company });
  const [features, setFeatures] = useState(company.features || {});
  const [members, setMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [exporting, setExporting] = useState(false);

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
        plan: info.plan || 'standard',
        billing_status: info.billing_status || 'trial',
        renewal_date: info.renewal_date || null,
        monthly_amount: info.monthly_amount ? Number(info.monthly_amount) : null,
      });
      await trace('company.updated', company.name);
      message.success(t('s.entreprise_mise_a_jour'));
      onChanged?.();
    } catch (err) { message.error(err.message); }
    finally { setSaving(false); }
  };

  const saveFeatures = async (key, enabled) => {
    const next = { ...features, [key]: enabled };
    setFeatures(next);
    try {
      await setCompanyFeatures(company.id, next);
      await trace('company.feature_changed', key, { enabled });
      onChanged?.();
    }
    catch (err) { setFeatures(features); message.error(err.message); }
  };

  const memberColumns = [
    {
      key: 'name', title: t('s.membre'),
      render: (v, row) => (
        <div className="min-w-0">
          <div className="text-[0.82rem] font-medium text-text-heading truncate">{v}</div>
          <div className="text-[0.68rem] text-text-muted truncate">{row.username}</div>
        </div>
      ),
    },
    {
      key: 'role', title: t('s.role'),
      render: (v, row) => (
        <Select value={v} width={140} options={roleOptions(t)}
                onChange={async (role) => {
                  try {
                    await setMemberRole(row.id, role);
                    await trace('member.role_changed', row.name, { role });
                    message.success(t('s.role_modifie_2')); loadMembers();
                  }
                  catch (err) { message.error(err.message); }
                }} />
      ),
    },
    {
      key: 'is_active', title: t('s.statut'),
      render: (v) => <Tag color={v ? 'green' : 'red'} bordered={false}>{v ? 'Actif' : 'Suspendu'}</Tag>,
    },
    {
      key: 'id', title: t('s.actions'), align: 'right',
      render: (_v, row) => (
        <div className="flex items-center gap-2 justify-end">
          <Button icon={<MailOutlined />}
                  onClick={async () => {
                    try {
                      await sendMemberPasswordReset(row.email || '');
                      await trace('member.password_reset_sent', row.name);
                      message.success(t('s.lien_de_reinitialisation_envoye'));
                    } catch (err) { message.error(err.message); }
                  }}>
            {t('s.reinitialiser')}
          </Button>
          <Button danger={row.is_active} icon={row.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
                  onClick={async () => {
                    try {
                      await setMemberActive(row.id, !row.is_active);
                      await trace(row.is_active ? 'member.suspended' : 'member.reactivated', row.name);
                      loadMembers();
                    }
                    catch (err) { message.error(err.message); }
                  }}>
            {row.is_active ? 'Suspendre' : t('s.reactiver')}
          </Button>
        </div>
      ),
    },
  ];

  const tabs = [
    {
      key: 'info', label: <span className="flex items-center gap-1.5"><BankOutlined /> {t('s.informations')}</span>,
      children: (
        <Panel>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label={t('s.nom')} value={info.name || ''} onChange={e => setInfo(i => ({ ...i, name: e.target.value }))} />
              <Input label={t('s.activite')} value={info.activity || ''} onChange={e => setInfo(i => ({ ...i, activity: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label={t('s.telephones')} value={info.phones || ''} onChange={e => setInfo(i => ({ ...i, phones: e.target.value }))} />
              <Input label={t('s.niu')} value={info.ncc || ''} onChange={e => setInfo(i => ({ ...i, ncc: e.target.value }))} />
              <Input label={t('s.rccm')} value={info.rccm || ''} onChange={e => setInfo(i => ({ ...i, rccm: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="custom-input-label">{t('s.langue')}</label>
                <Select value={info.language} width="100%" options={LANGUAGES}
                        onChange={v => setInfo(i => ({ ...i, language: v }))} />
              </div>
              <Input label={t('s.magasins_max')} type="number" placeholder={t('s.illimite')}
                     value={info.max_stores ?? ''} onChange={e => setInfo(i => ({ ...i, max_stores: e.target.value }))} />
              <Input label={t('s.utilisateurs_max')} type="number" placeholder={t('s.illimite')}
                     value={info.max_users ?? ''} onChange={e => setInfo(i => ({ ...i, max_users: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-black/5 dark:border-white/10">
              <Input label={t('s.formule')} value={info.plan || ''}
                     onChange={e => setInfo(i => ({ ...i, plan: e.target.value }))} placeholder="standard" />
              <div>
                <label className="custom-input-label">{t('s.facturation')}</label>
                <Select value={info.billing_status} width="100%" options={billingOptions(t)}
                        onChange={v => setInfo(i => ({ ...i, billing_status: v }))} />
              </div>
              <Input label={t('s.echeance')} type="date" value={info.renewal_date || ''}
                     onChange={e => setInfo(i => ({ ...i, renewal_date: e.target.value }))} />
              <Input label={t('s.montant_mensuel')} type="number" value={info.monthly_amount ?? ''}
                     onChange={e => setInfo(i => ({ ...i, monthly_amount: e.target.value }))} placeholder="0" />
            </div>
            <Input label={t('s.notes_internes')} value={info.notes || ''}
                   onChange={e => setInfo(i => ({ ...i, notes: e.target.value }))}
                   hint={t('s.visible_du_superadmin_uniquement')} />
          </div>
          <div className="flex justify-end mt-3">
            <Button type="primary" loading={saving} onClick={saveInfo}>{t('s.enregistrer')}</Button>
          </div>
        </Panel>
      ),
    },
    {
      key: 'features', label: <span className="flex items-center gap-1.5"><AppstoreOutlined /> {t('s.modules')}</span>,
      children: (
        <Panel subtitle={t('s.couper_un_module_masque_ses_ecrans_les_donne')}>
          <ul className="divide-y divide-black/5 dark:divide-white/10 -my-2">
            {FEATURES.map(f => (
              <li key={f.key} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="text-[0.84rem] font-medium text-text-heading">{t(f.labelKey)}</div>
                  <div className="text-[0.74rem] text-text-muted">{t(f.descriptionKey)}</div>
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
                 emptyIcon={TeamOutlined} emptyTitle={t('s.aucun_membre')}
                 emptyDescription="L'administrateur de cette entreprise n'a encore créé personne." />
        </Panel>
      ),
    },
    {
      key: 'audit', label: <span className="flex items-center gap-1.5"><FileTextOutlined /> {t('s.journal')}</span>,
      children: <AuditTable companyId={company.id} />,
    },
    {
      key: 'danger', label: <span className="flex items-center gap-1.5"><WarningOutlined /> {t('s.zone_sensible')}</span>,
      children: (
        <div className="space-y-4">
          <Panel title="Suspendre l'accès" icon={StopOutlined}
                 subtitle={t('s.les_utilisateurs_ne_peuvent_plus_se_connecte')}>
            <Popconfirm
              title={company.status === 'active' ? "Suspendre l'entreprise ?" : t('s.reactiver_2')}
              onConfirm={async () => {
                try {
                  const next = company.status === 'active' ? 'suspended' : 'active';
                  await setCompanyStatus(company.id, next);
                  await trace(next === 'suspended' ? 'company.suspended' : 'company.reactivated', company.name);
                  message.success(t('s.statut_modifie')); onChanged?.(); onBack();
                } catch (err) { message.error(err.message); }
              }}
            >
              <Button danger={company.status === 'active'}>
                {company.status === 'active' ? "Suspendre l'entreprise" : "Réactiver l'entreprise"}
              </Button>
            </Popconfirm>
          </Panel>

          <Panel title={t('s.exporter_les_donnees')} icon={DownloadOutlined}
                 subtitle={t('s.restitution_complete_au_format_json_a_remett')}>
            <Button icon={<DownloadOutlined />} loading={exporting}
                    onClick={async () => {
                      setExporting(true);
                      try {
                        const dump = await exportCompany(company);
                        downloadJson(`${company.slug || 'entreprise'}-export.json`, dump);
                        await trace('company.exported', company.name);
                        message.success(t('s.export_telecharge'));
                      } catch (err) { message.error(err.message); }
                      finally { setExporting(false); }
                    }}>
              {t('s.telecharger_l_export')}
            </Button>
          </Panel>

          <Panel title={t('s.supprimer_definitivement')} icon={DeleteOutlined}
                 subtitle={t('s.magasins_produits_ventes_et_comptes_seront_e')}>
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
                          // La trace est écrite AVANT la suppression : ensuite
                          // l'entreprise n'existe plus, mais le nom copié dans
                          // la ligne d'audit conserve le souvenir de l'acte.
                          await trace('company.deleted', company.name,
                                      { slug: company.slug, status: company.status });
                          await deleteCompany(company.id);
                          message.success(t('s.entreprise_supprimee_2'));
                          onChanged?.(); onBack();
                        } catch (err) { message.error(err.message); }
                      }}>
                {t('s.supprimer_definitivement')}
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
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>{t('s.retour_2')}</Button>
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
