import { useT } from '../../i18n/I18nContext';
import React, { useState } from 'react';
import { Tag, message } from 'antd';
import { TeamOutlined, MailOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Toolbar, Panel, Table, SearchInput, Button } from '../ui';
import { searchUsers } from '../../services/operationsService';
import { setMemberActive, sendMemberPasswordReset } from '../../services/companyService';
import { recordAudit } from '../../services/operationsService';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABEL = {
  superadmin: 'Superadmin', ceo: 'Direction', manager: 'Gestionnaire',
  accountant: 'Comptable', cashier: 'Caissier', storekeeper: 'Magasinier',
};

/**
 * Recherche d'un utilisateur dans toutes les entreprises.
 *
 * Un appel d'assistance commence par « je suis Jean, je n'arrive plus à me
 * connecter » — rarement par le nom de l'entreprise. On cherche donc par nom,
 * identifiant, adresse ou entreprise, puis on agit directement.
 */
const UserSearch = () => {
  const t = useT();
  const { currentUser } = useAuth();
  const [term, setTerm] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const run = async (value) => {
    setLoading(true);
    try {
      setRows(await searchUsers(value));
      setSearched(true);
    } catch (err) { message.error(err.message); }
    finally { setLoading(false); }
  };

  const columns = [
    {
      key: 'name', title: t('s.utilisateur'),
      render: (v, row) => (
        <div className="min-w-0">
          <div className="text-[0.82rem] font-medium text-text-heading truncate">{v}</div>
          <div className="text-[0.68rem] text-text-muted truncate">{row.email || row.username}</div>
        </div>
      ),
    },
    {
      key: 'company_name', title: t('s.entreprise'),
      render: (v) => <span className="text-[0.78rem] text-text-secondary">{v || 'Plateforme'}</span>,
    },
    { key: 'role', title: t('s.role'), render: (v) => <span className="text-[0.76rem]">{ROLE_LABEL[v] || v}</span> },
    {
      key: 'last_login_at', title: t('s.derniere_connexion'),
      render: (v) => (
        <span className="text-[0.76rem] tabular-nums whitespace-nowrap text-text-secondary">
          {v ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Jamais'}
        </span>
      ),
    },
    {
      key: 'is_active', title: t('s.statut'),
      render: (v) => <Tag color={v ? 'green' : 'red'} bordered={false}>{v ? 'Actif' : 'Suspendu'}</Tag>,
    },
    {
      key: 'id', title: '', align: 'right',
      render: (_v, row) => (
        <div className="flex items-center gap-2 justify-end">
          <Button icon={<MailOutlined />} disabled={!row.email}
                  onClick={async () => {
                    try {
                      await sendMemberPasswordReset(row.email);
                      await recordAudit({ actor: currentUser, companyId: row.company_id,
                        companyName: row.company_name, action: 'member.password_reset_sent', target: row.name });
                      message.success(t('s.lien_envoye'));
                    } catch (err) { message.error(err.message); }
                  }}>
            {t('s.reinitialiser')}
          </Button>
          <Button danger={row.is_active} icon={row.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
                  disabled={row.role === 'superadmin'}
                  onClick={async () => {
                    try {
                      await setMemberActive(row.id, !row.is_active);
                      await recordAudit({ actor: currentUser, companyId: row.company_id,
                        companyName: row.company_name,
                        action: row.is_active ? 'member.suspended' : 'member.reactivated', target: row.name });
                      run(term);
                    } catch (err) { message.error(err.message); }
                  }}>
            {row.is_active ? 'Suspendre' : t('s.reactiver')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <Toolbar right={<Button type="primary" loading={loading} onClick={() => run(term)}>{t('s.rechercher_2')}</Button>}>
        <SearchInput value={term} onChange={setTerm} width={320}
                     placeholder={t('s.nom_identifiant_e_mail_ou_entreprise')}
                     onPressEnter={() => run(term)} />
        {searched && <span className="text-[0.72rem] text-text-muted tabular-nums pl-1">{rows.length} résultats</span>}
      </Toolbar>

      <Panel noPadding>
        <Table columns={columns} data={rows} loading={loading} rowKey="id"
               emptyIcon={TeamOutlined}
               emptyTitle={searched ? t('s.aucun_resultat') : t('s.rechercher_un_utilisateur')}
               emptyDescription={searched
                 ? t('s.aucun_compte_ne_correspond_a_cette_recherche')
                 : t('s.saisissez_un_nom_un_e_mail_ou_une_entreprise')} />
      </Panel>
    </div>
  );
};

export default UserSearch;
