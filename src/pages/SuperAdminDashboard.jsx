import { useT } from '../i18n/I18nContext';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { message, Tag } from 'antd';
import { AppstoreOutlined, BankOutlined, CheckCircleOutlined, DashboardOutlined, FileTextOutlined, GlobalOutlined, PlusOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { Toolbar, Panel, Table, SearchInput, Button } from '../components/ui';
import CompanyWizard from '../components/superadmin/CompanyWizard';
import CompanyDetail from '../components/superadmin/CompanyDetail';
import PlatformOverview from '../components/superadmin/PlatformOverview';
import PlatformSettingsPanel from '../components/superadmin/PlatformSettingsPanel';
import UserSearch from '../components/superadmin/UserSearch';
import AuditTable from '../components/superadmin/AuditTable';
import { useSectionRoute } from '../routes/sections';
import { isSupabaseConfigured } from '../lib/supabase';
import { recordAudit } from '../services/operationsService';
import { useAuth } from '../context/AuthContext';
import { fetchCompanies, createCompany } from '../services/companyService';

// Les identifiants restent figés (ils servent d'URL) ; seuls les libellés
// sont résolus au rendu, donc dans la langue courante.
const SECTION_DEFS = [
  { id: 'dashboard', key: 's.tableau_de_bord_2', icon: DashboardOutlined },
  { id: 'companies', key: 's.entreprises',       icon: BankOutlined },
  { id: 'users',     key: 's.utilisateurs',      icon: TeamOutlined },
  { id: 'audit',     key: 's.journal',           icon: FileTextOutlined },
  { id: 'settings',  key: 's.parametres',        icon: SettingOutlined },
];

const SECTIONS = SECTION_DEFS.map(i => i.id);





/**
 * Console de l'exploitant de la plateforme.
 *
 * Le superadmin crée les entreprises et suit le parc ; il ne saisit pas de
 * données métier à leur place. La RLS lui donne d'ailleurs un accès en lecture
 * seule aux écritures des entreprises clientes.
 */
const SuperAdminDashboard = () => {
  const t = useT();
  const { currentUser } = useAuth();
  const sidebarItems = SECTION_DEFS.map(({ key, ...rest }) => ({ ...rest, label: t(key) }));
  const TITLES = Object.fromEntries(SECTION_DEFS.map(d => [d.id, t(d.key)]));
  const SUBTITLES = {
    dashboard: t('s.vue_d_ensemble_du_parc'),
    companies: t('s.creez_et_supervisez_les_entreprises_clientes'),
    users: t('s.rechercher_un_compte_dans_toutes_les_entrepr'),
    audit: t('s.trace_des_actions_sensibles_en_ajout_seul'),
    settings: t('s.modules_par_defaut_et_votre_compte'),
  };
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [selected, setSelected] = useState(null);
  const [created, setCreated] = useState(null);
  const [activeTab, setActiveTab] = useSectionRoute(SECTIONS, 'dashboard');
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCompanies(await fetchCompanies());
      setLoadError('');
    } catch (err) {
      setLoadError(err.message || 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isSupabaseConfigured) load(); else setLoading(false); }, [load]);

  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      const res = await createCompany(payload);
      // Le mot de passe provisoire n'est affiché qu'une fois : il faut le
      // transmettre à l'administrateur, on le laisse donc à l'écran sans délai.
      await recordAudit({
        actor: currentUser, companyName: payload.name,
        action: 'company.created', target: payload.name,
        details: { slug: payload.slug, admin: payload.admin.email },
      });
      setCreated({
        name: payload.name,
        email: res?.adminEmail || payload.admin.email,
        password: res?.tempPassword,
        viaFallback: Boolean(res?.viaFallback),
      });
      setShowWizard(false);
      await load();
    } catch (err) {
      message.error(err.message || t('s.creation_impossible'));
    } finally {
      setSaving(false);
    }
  };


  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(c =>
      c.name.toLowerCase().includes(q) || (c.slug || '').toLowerCase().includes(q)
    );
  }, [companies, search]);


  const columns = [
    {
      key: 'name', title: t('s.entreprise'),
      render: (v, row) => (
        <div className="min-w-0">
          <div className="text-[0.82rem] font-medium text-text-heading truncate">{v}</div>
          <div className="text-[0.68rem] text-text-muted truncate">{row.slug}</div>
        </div>
      ),
    },
    { key: 'activity', title: t('s.activite'), render: (v) => <span className="text-[0.75rem] text-text-secondary">{v || '—'}</span> },
    {
      key: 'storeCount', title: t('s.magasins'), align: 'right',
      render: (v) => <span className="tabular-nums">{v}</span>,
    },
    {
      key: 'memberCount', title: t('s.membres'), align: 'right',
      render: (v) => <span className="tabular-nums">{v}</span>,
    },
    {
      key: 'language', title: t('s.langue'),
      render: (v) => <span className="text-[0.72rem] uppercase text-text-muted">{v}</span>,
    },
    {
      key: 'status', title: t('s.statut'),
      render: (v) => (
        <Tag color={v === 'active' ? 'green' : 'red'} bordered={false}>
          {v === 'active' ? 'Active' : 'Suspendue'}
        </Tag>
      ),
    },
    {
      key: 'features', title: t('s.modules'), align: 'right',
      render: (v) => {
        const off = Object.values(v || {}).filter(x => x === false).length;
        return <span className="text-[0.75rem] text-text-muted">{off ? `${off} coupé${off > 1 ? 's' : ''}` : 'Tous'}</span>;
      },
    },
    {
      key: 'id', title: '', align: 'right',
      render: (_v, row) => (
        <Button icon={<AppstoreOutlined />} onClick={() => setSelected(row)}>{t('s.gerer')}</Button>
      ),
    },
  ];

  return (
    <DashboardLayout
      items={sidebarItems}
      activeItem={activeTab}
      onItemClick={setActiveTab}
      title={TITLES[activeTab]}
      subtitle={SUBTITLES[activeTab]}
    >
      {!isSupabaseConfigured ? (
        <Panel title={t('s.supabase_non_configure')} icon={GlobalOutlined}>
          <p className="text-[0.82rem] text-text-secondary leading-relaxed">
            Renseignez <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> dans
            votre fichier <code>.env</code>, puis appliquez les migrations SQL du dossier{' '}
            <code>supabase/migrations</code>.
          </p>
        </Panel>
      ) : activeTab === 'dashboard' ? (
        <PlatformOverview
          companies={companies}
          loading={loading}
          onGoToCompanies={() => setActiveTab('companies')}
        />
      ) : activeTab === 'users' ? (
        <UserSearch />
      ) : activeTab === 'audit' ? (
        <AuditTable />
      ) : activeTab === 'settings' ? (
        <PlatformSettingsPanel />
      ) : showWizard ? (
        <CompanyWizard
          saving={saving}
          onCancel={() => setShowWizard(false)}
          onSubmit={handleCreate}
        />
      ) : selected ? (
        <CompanyDetail
          company={selected}
          onBack={() => setSelected(null)}
          onChanged={load}
        />
      ) : (
        <div className="animate-fade-in space-y-4">
          {created && (
            <Panel title={t('s.name_creee', { name: created.name })} icon={CheckCircleOutlined}>
              <p className="text-[0.84rem] text-text-secondary">
                {t('s.transmettez_ces_identifiants_a_l_administrat')}
              </p>
              <dl className="mt-3 text-[0.84rem] space-y-1">
                <div className="flex gap-3"><dt className="text-text-muted w-32">{t('s.e_mail')}</dt>
                  <dd className="font-medium text-text-heading">{created.email}</dd></div>
                <div className="flex gap-3"><dt className="text-text-muted w-32">{t('s.mot_de_passe')}</dt>
                  <dd className="font-mono font-semibold text-primary">{created.password || '—'}</dd></div>
              </dl>
              {created.viaFallback && (
                <p className="text-[0.76rem] text-text-muted mt-3">
                  Créée sans la fonction serveur. Déployez <code>create-company</code> pour
                  ne plus dépendre des inscriptions publiques.
                </p>
              )}
              <div className="flex justify-end mt-3">
                <Button onClick={() => setCreated(null)}>{t('s.j_ai_note')}</Button>
              </div>
            </Panel>
          )}

          <Toolbar right={<Button type="primary" icon={<PlusOutlined />} onClick={() => setShowWizard(true)}>{t('s.nouvelle_entreprise')}</Button>}>
            <SearchInput value={search} onChange={setSearch} placeholder={t('s.rechercher_une_entreprise')} width={260} />
            <span className="text-[0.72rem] text-text-muted tabular-nums pl-1">{filtered.length} entreprises</span>
          </Toolbar>

          {loadError && (
            <div className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[0.78rem] text-red-600 dark:text-red-400">
              {loadError}
            </div>
          )}

          <Panel noPadding>
            <Table
              columns={columns}
              data={filtered}
              loading={loading}
              rowKey="id"
              emptyIcon={BankOutlined}
              emptyTitle={t('s.aucune_entreprise')}
              emptyDescription={t('s.creez_la_premiere_entreprise_pour_demarrer')}
            />
          </Panel>
        </div>
      )}

    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
