import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { message, Tag, Popconfirm } from 'antd';
import {
  BankOutlined, PlusOutlined, ShopOutlined, TeamOutlined,
  StopOutlined, CheckCircleOutlined, GlobalOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { Toolbar, Panel, Table, SearchInput, Button, StatsCard } from '../components/ui';
import CompanyFormModal from '../components/superadmin/CompanyFormModal';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  fetchCompanies, createCompany, setCompanyStatus,
} from '../services/companyService';

const sidebarItems = [
  { id: 'companies', label: 'Entreprises', icon: BankOutlined },
];

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
  const [showForm, setShowForm] = useState(false);
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
      setShowForm(false);
      await load();
    } catch (err) {
      message.error(err.message || 'Création impossible');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (row) => {
    const next = row.status === 'active' ? 'suspended' : 'active';
    try {
      await setCompanyStatus(row.id, next);
      message.success(next === 'active' ? 'Entreprise réactivée.' : 'Entreprise suspendue.');
      await load();
    } catch (err) {
      message.error(err.message || 'Modification impossible');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(c =>
      c.name.toLowerCase().includes(q) || (c.slug || '').toLowerCase().includes(q)
    );
  }, [companies, search]);

  const totals = useMemo(() => ({
    companies: companies.length,
    active: companies.filter(c => c.status === 'active').length,
    stores: companies.reduce((s, c) => s + c.storeCount, 0),
    members: companies.reduce((s, c) => s + c.memberCount, 0),
  }), [companies]);

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
      key: 'id', title: 'Action', align: 'right',
      render: (_v, row) => (
        <Popconfirm
          title={row.status === 'active' ? 'Suspendre cette entreprise ?' : 'Réactiver cette entreprise ?'}
          description={row.status === 'active'
            ? 'Ses utilisateurs ne pourront plus se connecter. Les données sont conservées.'
            : "L'accès sera rétabli immédiatement."}
          onConfirm={() => toggleStatus(row)}
        >
          <Button
            danger={row.status === 'active'}
            icon={row.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
          >
            {row.status === 'active' ? 'Suspendre' : 'Réactiver'}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <DashboardLayout
      items={sidebarItems}
      activeItem="companies"
      onItemClick={() => {}}
      title="Administration de la plateforme"
      subtitle="Créez et supervisez les entreprises clientes"
    >
      {!isSupabaseConfigured ? (
        <Panel title="Supabase non configuré" icon={GlobalOutlined}>
          <p className="text-[0.82rem] text-text-secondary leading-relaxed">
            Renseignez <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> dans
            votre fichier <code>.env</code>, puis appliquez les migrations SQL du dossier{' '}
            <code>supabase/migrations</code>.
          </p>
        </Panel>
      ) : (
        <div className="animate-fade-in space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatsCard icon={BankOutlined} label="Entreprises" value={totals.companies} accentColor="#6366f1" />
            <StatsCard icon={CheckCircleOutlined} label="Actives" value={totals.active} accentColor="#10b981" />
            <StatsCard icon={ShopOutlined} label="Magasins" value={totals.stores} accentColor="#3b82f6" />
            <StatsCard icon={TeamOutlined} label="Membres" value={totals.members} accentColor="#8b5cf6" />
          </div>

          <Toolbar right={<Button type="primary" icon={<PlusOutlined />} onClick={() => setShowForm(true)}>Nouvelle entreprise</Button>}>
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

      {showForm && (
        <CompanyFormModal onClose={() => setShowForm(false)} onSubmit={handleCreate} saving={saving} />
      )}
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
