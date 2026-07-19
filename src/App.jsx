import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';

import Login from './pages/Login';
import ManagerDashboard from './pages/ManagerDashboard';
import CashierPOS from './pages/CashierPOS';
import AccountantDashboard from './pages/AccountantDashboard';
import StorekeeperDashboard from './pages/StorekeeperDashboard';
import CEODashboard from './pages/CEODashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser } = useStore();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />; // Ou une page d'accès refusé
  }

  return children;
};

const AppRoutes = () => {
  const { currentUser } = useStore();

  return (
    <Routes>
      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" replace />} />
      
      {/* Route de redirection par défaut selon le rôle */}
      <Route path="/" element={
        !currentUser ? <Navigate to="/login" replace /> :
        currentUser.role === 'ceo' ? <Navigate to="/ceo" replace /> :
        currentUser.role === 'manager' ? <Navigate to="/manager" replace /> :
        currentUser.role === 'cashier' ? <Navigate to="/pos" replace /> :
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

const ThemeAppWrapper = () => {
  const { theme } = useStore();
  const isDark = theme === 'dark';

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: themeConfig.colors.primary,
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
      <Router>
        <AppRoutes />
      </Router>
    </ConfigProvider>
  );
};

const App = () => {
  return (
    <StoreProvider>
      <ThemeAppWrapper />
    </StoreProvider>
  );
};

export default App;
