import { useT } from '../../i18n/I18nContext';
import React from 'react';
import { Empty, Button } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const EmptyState = ({
  icon: Icon = InboxOutlined,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  const t = useT();
  return (
    <div className={`py-10 px-6 ${className}`}>
      <Empty
        image={<Icon style={{ fontSize: 40 }} className="text-text-muted opacity-40" />}
        description={
          // Ces libellés étaient figés sur les couleurs du thème sombre (#e2e8f0) :
          // en thème clair le titre devenait quasi invisible sur fond blanc.
          <div className="mt-2">
            <div className="text-text-heading font-semibold text-[0.95rem]">{title ?? t('s.aucune_donnee')}</div>
            <div className="text-text-muted text-[0.82rem] mt-1">{description ?? t('s.il_n_y_a_rien_a_afficher_pour_le_moment')}</div>
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
