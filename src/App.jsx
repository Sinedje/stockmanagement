import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import ManagerDashboard from './pages/ManagerDashboard';
import CashierPOS from './pages/CashierPOS';
import AccountantDashboard from './pages/AccountantDashboard';
import StorekeeperDashboard from './pages/StorekeeperDashboard';
import CEODashboard from './pages/CEODashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import PlatformSetup from './pages/PlatformSetup';
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
      <Route path="/setup" element={<PlatformSetup />} />

      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to={home} replace />} />

      {/* « / » renvoie vers la section d'accueil du rôle. */}
      <Route path="/" element={<Navigate to={home} replace />} />

      {/* Une seule route pour toutes les pages : /articles, /inventory, /stock-entry… */}
      <Route path="/:section" element={
        <ProtectedRoute>
          <RoleDashboard />
        </ProtectedRoute>
      } />

      {/* Toute autre adresse retombe sur l'accueil plutôt que sur un écran vide. */}
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
};

import { ConfigProvider, theme as antTheme } from 'antd';
import { themeConfig } from './theme';
import { useStore } from './context/StoreContext';
import { I18nProvider } from './i18n/I18nContext';

// Theme wrapper still uses StoreContext for the dark/light toggle
const ThemeAppWrapper = () => {
  const { theme, companySettings, updateCompanySettings } = useStore();
  const isDark = theme === 'dark';

  // La langue est un réglage d'entreprise : elle est lue depuis les paramètres
  // et réenregistrée côté serveur lorsqu'elle change.
  const language = companySettings?.language || 'fr';
  const handleLanguageChange = React.useCallback(
    (next) => updateCompanySettings({ ...companySettings, language: next }),
    [companySettings, updateCompanySettings]
  );

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
          <AppRoutes />
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
