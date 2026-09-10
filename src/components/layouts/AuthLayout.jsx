import React from 'react';
import { AppstoreOutlined } from '@ant-design/icons';
import '../../pages/Login.css';

/**
 * Cadre des écrans d'authentification.
 *
 * Même fond ambiant et même surface vitrée que l'application, pour que la
 * première page ne paraisse pas venir d'un autre produit.
 */
const AuthLayout = ({ children, title, subtitle }) => (
  <div className="login-page">
    <div className="app-ambient-bg" />

    <main className="login-card" role="main">
      <header className="login-header">
        <div className="login-brand">
          <span className="login-logo" aria-hidden="true">
            <AppstoreOutlined />
          </span>
          <span className="login-brand-text">
            <span className="login-title">{title || 'Stock Expert'}</span>
            <span className="login-tagline">Gestion de stock et de caisse</span>
          </span>
        </div>
        {subtitle && <p className="login-subtitle">{subtitle}</p>}
      </header>

      <div className="login-content">{children}</div>
    </main>

    <p className="login-footer">Stock Expert &copy; {new Date().getFullYear()}</p>
  </div>
);

export default AuthLayout;
