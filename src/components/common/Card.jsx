import React from 'react';
import { Card as AntCard } from 'antd';

const Card = ({ title, subtitle, icon: Icon, headerActions, children, padding = true, className = '', accentColor, ...props }) => {
  const cardTitle = (title || Icon) && (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {Icon && (
        <div style={{ 
          width: '38px', 
          height: '38px', 
          borderRadius: '12px', 
          background: 'rgba(16, 185, 129, 0.1)', 
          color: '#10b981', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
      )}
      <div>
        <div style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-heading)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px', opacity: 0.8 }}>{subtitle}</div>}
      </div>
    </div>
  );

  return (
    <AntCard
      title={cardTitle}
      extra={headerActions}
      className={`${className} overflow-hidden rounded-xl border border-black/5 dark:border-white/5 shadow-lg`}
      styles={{ 
        body: { padding: padding ? '1.25rem' : '0' },
        header: { borderBottom: '1px solid var(--border-color)', padding: '1rem 1.25rem' }
      }}
      style={{ 
        borderTop: accentColor ? `3px solid ${accentColor}` : undefined,
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        borderRadius: '0.75rem',
      }}
      {...props}
    >
      {children}
    </AntCard>
  );
};

export default Card;
