import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { message, Tag } from 'antd';
import {
  BankOutlined, PlusOutlined, GlobalOutlined, DashboardOutlined, SettingOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { Toolbar, Panel, Table, SearchInput, Button } from '../components/ui';
import CompanyWizard from '../components/superadmin/CompanyWizard';
import CompanyDetail from '../components/superadmin/CompanyDetail';
import PlatformOverview from '../components/superadmin/PlatformOverview';
import PlatformSettingsPanel from '../components/superadmin/PlatformSettingsPanel';
import { useSectionRoute } from '../routes/sections';
import { isSupabaseConfigured } from '../lib/supabase';
import { fetchCompanies, createCompany } from '../services/companyService';

const sidebarItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: DashboardOutlined },
  { id: 'companies', label: 'Entreprises', icon: BankOutlined },
  { id: 'settings',  label: 'Paramètres', icon: SettingOutlined },
];

const SECTIONS = sidebarItems.map(i => i.id);

const TITLES = {
  dashboard: 'Tableau de bord',
  companies: 'Entreprises',
  settings: 'Paramètres de la plateforme',
};

const SUBTITLES = {
  dashboard: "Vue d'ensemble du parc",
  companies: 'Créez et supervisez les entreprises clientes',
  settings: 'Modules par défaut et votre compte',
};

/**
 * Console de l'exploitant de la plateforme.
 *
 * Le superadmin crée les entreprises et suit le parc ; il ne saisit pas de
 * données métier à leur place. La RLS lui donne d'ailleurs un accès en lecture
 * seule aux écritures des entreprises clientes.
 */
const SuperAdminDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [selected, setSelected] = useState(null);
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
      message.success(
        res?.tempPassword
          ? `Entreprise créée. Mot de passe provisoire : ${res.tempPassword}`
          : 'Entreprise créée. Un e-mail d\'invitation a été envoyé.'
      );
      setShowWizard(false);
      await load();
    } catch (err) {
      message.error(err.message || 'Création impossible');
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
      key: 'name', title: 'Entreprise',
      render: (v, row) => (
        <div className="min-w-0">
          <div className="text-[0.82rem] font-medium text-text-heading truncate">{v}</div>
          <div className="text-[0.68rem] text-text-muted truncate">{row.slug}</div>
        </div>
      ),
    },
    { key: 'activity', title: 'Activité', render: (v) => <span className="text-[0.75rem] text-text-secondary">{v || '—'}</span> },
    {
      key: 'storeCount', title: 'Magasins', align: 'right',
      render: (v) => <span className="tabular-nums">{v}</span>,
    },
    {
      key: 'memberCount', title: 'Membres', align: 'right',
      render: (v) => <span className="tabular-nums">{v}</span>,
    },
    {
      key: 'language', title: 'Langue',
      render: (v) => <span className="text-[0.72rem] uppercase text-text-muted">{v}</span>,
    },
    {
      key: 'status', title: 'Statut',
      render: (v) => (
        <Tag color={v === 'active' ? 'green' : 'red'} bordered={false}>
          {v === 'active' ? 'Active' : 'Suspendue'}
        </Tag>
      ),
    },
    {
      key: 'features', title: 'Modules', align: 'right',
      render: (v) => {
        const off = Object.values(v || {}).filter(x => x === false).length;
        return <span className="text-[0.75rem] text-text-muted">{off ? `${off} coupé${off > 1 ? 's' : ''}` : 'Tous'}</span>;
      },
    },
    {
      key: 'id', title: '', align: 'right',
      render: (_v, row) => (
        <Button icon={<AppstoreOutlined />} onClick={() => setSelected(row)}>Gérer</Button>
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
        <Panel title="Supabase non configuré" icon={GlobalOutlined}>
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
          <Toolbar right={<Button type="primary" icon={<PlusOutlined />} onClick={() => setShowWizard(true)}>Nouvelle entreprise</Button>}>
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une entreprise…" width={260} />
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
              emptyTitle="Aucune entreprise"
              emptyDescription="Créez la première entreprise pour démarrer."
            />
          </Panel>
        </div>
      )}

    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
