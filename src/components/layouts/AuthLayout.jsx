import React from 'react';
import '../../pages/Login.css';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">{title || 'STOCK EXPERT'}</h1>
          {subtitle && <p className="login-subtitle">{subtitle}</p>}
        </div>
        
        <div className="login-content">
          {children}
        </div>

        <div className="demo-credentials">
          <p className="demo-title">Identifiants de démo</p>
          <div className="demo-item"><span className="demo-role">Manager:</span> admin / 123</div>
          <div className="demo-item"><span className="demo-role">Compta:</span> compta / 123</div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
