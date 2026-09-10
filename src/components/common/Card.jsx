import React from 'react';
import { Card as AntCard } from 'antd';

const Card = ({ title, subtitle, icon: Icon, headerActions, children, padding = true, noPadding = false, className = '', accentColor, ...props }) => {
  const hasPadding = padding && !noPadding;
  // La pastille d'icône suivait l'accent : elle était figée en vert quel que soit `accentColor`.
  const iconTint = accentColor || 'var(--color-primary)';
  const cardTitle = (title || Icon) && (
    <div className="flex items-center gap-3 min-w-0">
      {Icon && (
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `color-mix(in srgb, ${iconTint} 12%, transparent)`, color: iconTint }}
        >
          <Icon style={{ fontSize: 17 }} />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-[0.95rem] font-bold tracking-tight text-text-heading truncate">{title}</div>
        {subtitle && (
          <div className="text-[0.72rem] font-medium text-text-secondary opacity-80 mt-0.5 truncate">{subtitle}</div>
        )}
      </div>
    </div>
  );

  return (
    <AntCard
      title={cardTitle}
      extra={headerActions}
      className={`${className} overflow-hidden rounded-xl`}
      styles={{
        body: { padding: hasPadding ? '1.25rem' : '0' },
        header: { borderBottom: '1px solid var(--border-color)', padding: '1rem 1.25rem' }
      }}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
        WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
        border: '1px solid var(--glass-border)',
        borderTop: accentColor ? `3px solid ${accentColor}` : undefined,
        boxShadow: 'var(--glass-shadow), inset 0 1px 0 0 var(--glass-highlight)',
        borderRadius: '0.75rem',
      }}
      {...props}
    >
      {children}
    </AntCard>
  );
};

export default Card;
