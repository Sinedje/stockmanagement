import React from 'react';
import { Empty, Button } from 'antd';
import { Inbox } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'Aucune donnée',
  description = 'Il n\'y a rien à afficher pour le moment.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={className} style={{ padding: '2.5rem 1.5rem' }}>
      <Empty
        image={<Icon size={48} style={{ opacity: 0.3, color: '#94a3b8' }} />}
        description={
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '1rem' }}>{title}</div>
            <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>{description}</div>
          </div>
        }
      >
        {onAction && (
          <Button type="primary" onClick={onAction}>
            {actionLabel || 'Commencer'}
          </Button>
        )}
      </Empty>
    </div>
  );
};

export default EmptyState;
