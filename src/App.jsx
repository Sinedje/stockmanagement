import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';

import Login from './pages/Login';
import ManagerDashboard from './pages/ManagerDashboard';
import CashierPOS from './pages/CashierPOS';
import AccountantDashboard from './pages/AccountantDashboard';

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
        currentUser.role === 'manager' ? <Navigate to="/manager" replace /> :
        currentUser.role === 'cashier' ? <Navigate to="/pos" replace /> :
        <Navigate to="/accountant" replace />
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
    </Routes>
  );
};

import { ConfigProvider, theme as antTheme } from 'antd';
import { themeConfig } from './theme';

const App = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: antTheme.darkAlgorithm,
        token: {
          colorPrimary: themeConfig.colors.primary,
          borderRadius: themeConfig.radius,
          colorBgBase: themeConfig.colors.bgDark,
          colorBgContainer: themeConfig.colors.bgCard,
          colorBorder: themeConfig.colors.border,
          colorTextBase: themeConfig.colors.textPrimary,
        },
        components: {
          Card: {
            colorBgContainer: 'rgba(17, 24, 39, 0.85)',
          },
          Table: {
            colorBgContainer: 'transparent',
            colorHeaderBg: 'rgba(0, 0, 0, 0.2)',
          },
        },
      }}
    >
      <StoreProvider>
        <Router>
          <AppRoutes />
        </Router>
      </StoreProvider>
    </ConfigProvider>
  );
};

export default App;
