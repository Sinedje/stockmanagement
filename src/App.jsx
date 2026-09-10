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

// ── Protected Route — uses AuthContext ────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-secondary">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// ── App routes — uses AuthContext ─────────────────────────────
const AppRoutes = () => {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) return null;

  return (
    <Routes>
      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" replace />} />

      {/* Default redirect by role */}
      <Route path="/" element={
        !currentUser ? <Navigate to="/login" replace /> :
        currentUser.role === 'ceo'         ? <Navigate to="/ceo" replace /> :
        currentUser.role === 'manager'     ? <Navigate to="/manager" replace /> :
        currentUser.role === 'cashier'     ? <Navigate to="/pos" replace /> :
        currentUser.role === 'storekeeper' ? <Navigate to="/storekeeper" replace /> :
        <Navigate to="/accountant" replace />
      } />

      <Route path="/ceo/*" element={
        <ProtectedRoute allowedRoles={['ceo']}>
          <CEODashboard />
        </ProtectedRoute>
      } />

      <Route path="/manager/*" element={
        <ProtectedRoute allowedRoles={['manager']}>
          <ManagerDashboard />
        </ProtectedRoute>
      } />

      <Route path="/pos" element={
        <ProtectedRoute allowedRoles={['cashier', 'manager']}>
          <CashierPOS />
        </ProtectedRoute>
      } />

      <Route path="/accountant" element={
        <ProtectedRoute allowedRoles={['accountant', 'manager']}>
          <AccountantDashboard />
        </ProtectedRoute>
      } />

      <Route path="/storekeeper" element={
        <ProtectedRoute allowedRoles={['storekeeper', 'manager']}>
          <StorekeeperDashboard />
        </ProtectedRoute>
      } />
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
