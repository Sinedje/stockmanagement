import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import ManagerDashboard from './pages/ManagerDashboard';
import CashierPOS from './pages/CashierPOS';
import AccountantDashboard from './pages/AccountantDashboard';
import StorekeeperDashboard from './pages/StorekeeperDashboard';
import CEODashboard from './pages/CEODashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import { fetchCompanyBySlug } from './services/memberService';
import { NotificationsProvider } from './notifications/NotificationsContext';
import PlatformSetup from './pages/PlatformSetup';
import ResetPassword from './pages/ResetPassword';
import MentionsLegales from './pages/legal/MentionsLegales';
import Confidentialite from './pages/legal/Confidentialite';
import Conditions from './pages/legal/Conditions';
import { DEFAULT_SECTION } from './routes/sections';

// ── Protected Route — uses AuthContext ────────────────────────
const ProtectedRoute = ({ children }) => {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-secondary">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;

  return children;
};

/**
 * Départage une section applicative d'un lien d'entreprise.
 *
 * Connecté, le segment est une page (/articles, /inventory…). Déconnecté, on
 * demande à la base s'il désigne une entreprise active : si oui, l'employé voit
 * la page de connexion de son commerce, avec le nom affiché ; sinon il retombe
 * sur l'écran de connexion ordinaire.
 */
const SectionOrCompanyLogin = () => {
  const { currentUser, authLoading } = useAuth();
  const { section } = useParams();
  const [company, setCompany] = React.useState(undefined); // undefined = en cours

  React.useEffect(() => {
    let cancelled = false;
    if (currentUser) { setCompany(null); return; }
    fetchCompanyBySlug(section).then((c) => { if (!cancelled) setCompany(c); });
    return () => { cancelled = true; };
  }, [section, currentUser]);

  if (authLoading || (!currentUser && company === undefined)) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-secondary">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (currentUser) return <ProtectedRoute><RoleDashboard /></ProtectedRoute>;
  if (company) return <Login company={company} />;
  return <Navigate to="/login" replace />;
};

// ── Tableau de bord selon le rôle ─────────────────────────────
// L'adresse porte la page consultée ; c'est le rôle de l'utilisateur qui
// détermine quel tableau de bord la rend. Le rôle n'a donc plus à figurer
// dans l'URL — il est déjà affiché dans la barre latérale.
const RoleDashboard = () => {
  const { currentUser } = useAuth();

  switch (currentUser?.role) {
    case 'superadmin':  return <SuperAdminDashboard />;
    case 'ceo':         return <CEODashboard />;
    case 'manager':     return <ManagerDashboard />;
    case 'accountant':  return <AccountantDashboard />;
    case 'storekeeper': return <StorekeeperDashboard />;
    case 'cashier':     return <CashierPOS />;
    default:            return <Navigate to="/login" replace />;
  }
};

// ── App routes — uses AuthContext ─────────────────────────────
const AppRoutes = () => {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) return null;

  const home = currentUser ? `/${DEFAULT_SECTION[currentUser.role] || 'dashboard'}` : '/login';

  return (
    <Routes>
      {/* Installation initiale — accessible sans compte, et seulement tant
          qu'aucun superadmin n'existe (la base en décide, pas le client). */}
      {/* Documents légaux — lisibles sans compte : un visiteur doit pouvoir
          consulter les conditions avant de s'engager, et un ancien client
          après son départ. */}
      <Route path="/mentions-legales" element={<MentionsLegales />} />
      <Route path="/confidentialite" element={<Confidentialite />} />
      <Route path="/conditions" element={<Conditions />} />

      {/* Récupération de compte — accessible sans être connecté. */}
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/setup" element={<PlatformSetup />} />

      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to={home} replace />} />

      {/* « / » renvoie vers la section d'accueil du rôle. */}
      <Route path="/" element={<Navigate to={home} replace />} />


      {/* Une seule route pour toutes les pages : /articles, /inventory, /stock-entry…
          Déconnecté, le même segment peut désigner une entreprise : /feu-flamenco
          ouvre alors sa page de connexion. */}
      <Route path="/:section" element={<SectionOrCompanyLogin />} />

      {/* Toute autre adresse retombe sur l'accueil plutôt que sur un écran vide. */}
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
};

import { ConfigProvider, theme as antTheme } from 'antd';
import { themeConfig } from './theme';
import { useStore } from './context/StoreContext';
import { I18nProvider } from './i18n/I18nContext';
import UpdatePrompt from './offline/UpdatePrompt';

// Theme wrapper still uses StoreContext for the dark/light toggle
const ThemeAppWrapper = () => {
  const { theme, companySettings, updateCompanySettings } = useStore();
  const isDark = theme === 'dark';

  // Ordre de résolution : préférence individuelle, puis langue de l'entreprise,
  // puis français. Le superadmin n'appartenant à aucune entreprise, sans le
  // premier niveau il resterait bloqué sur la langue par défaut.
  const { currentUser, setCurrentUser } = useAuth();
  const language = currentUser?.language || companySettings?.language || 'fr';

  const handleLanguageChange = React.useCallback(async (next) => {
    // Un superadmin n'a pas d'entreprise : sa préférence vit sur son profil.
    if (currentUser?.role === 'superadmin' || currentUser?.companyId) {
      const { setMyLanguage } = await import('./services/companyService');
      try {
        await setMyLanguage(next);
        setCurrentUser((u) => (u ? { ...u, language: next } : u));
        return;
      } catch (err) {
        console.warn('Préférence de langue non enregistrée :', err?.message);
      }
    }
    // Comptes historiques (MongoDB) : le réglage reste celui de l'entreprise.
    updateCompanySettings({ ...companySettings, language: next });
  }, [currentUser, setCurrentUser, companySettings, updateCompanySettings]);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: themeConfig.colors.primary,
          colorTextLightSolid: themeConfig.colors.onPrimary, // texte sur boutons pleins
          borderRadius: themeConfig.radius,
          ...(isDark ? {
            colorBgBase: themeConfig.colors.bgDark,
            colorBgContainer: themeConfig.colors.bgCard,
            colorBorder: themeConfig.colors.border,
            colorTextBase: themeConfig.colors.textPrimary,
          } : {
            colorBgBase: '#f1f5f9',
            colorBgContainer: '#ffffff',
            colorBorder: 'rgba(0, 0, 0, 0.12)',
            colorTextBase: '#1e293b',
          }),
        },
        components: {
          Card: {
            colorBgContainer: isDark ? 'rgba(17, 24, 39, 0.85)' : '#ffffff',
          },
          Table: {
            colorBgContainer: 'transparent',
            colorHeaderBg: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
          },
        },
      }}
    >
      <I18nProvider language={language} onChangeLanguage={handleLanguageChange}>
        <Router>
          <NotificationsProvider>
            <AppRoutes />
            <UpdatePrompt />
          </NotificationsProvider>
        </Router>
      </I18nProvider>
    </ConfigProvider>
  );
};

const App = () => {
  return (
    // AuthProvider wraps everything — auth state is independent of store data
    <AuthProvider>
      {/* StoreProvider uses AuthContext internally via useAuth for user-scoped state */}
      <StoreProvider>
        <ThemeAppWrapper />
      </StoreProvider>
    </AuthProvider>
  );
};

export default App;
