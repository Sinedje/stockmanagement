import React, { useState } from 'react';
import { Badge, Popover, Tag, Tooltip } from 'antd';
import { BellOutlined, CheckOutlined, ArrowRightOutlined, WifiOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n/I18nContext';
import { useNotifications } from './NotificationsContext';
import { since } from './format';

const PREVIEW = 5;   // au-delà, le panneau déborde de l'écran : la page prend le relais

const NotificationBell = () => {
  const t = useT();
  const navigate = useNavigate();
  const { items, unread, status, markAllRead, markRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const go = (n) => {
    markRead(n.id);
    setOpen(false);
    if (n.target) navigate(`/${n.target}`);
  };

  const content = (
    <div className="w-[min(92vw,21rem)]">
      <div className="flex items-center justify-between gap-3 px-1 pb-2 mb-1 border-b border-black/5 dark:border-white/10">
        <span className="text-[0.82rem] font-semibold text-text-heading">{t('s.notifications')}</span>
        {unread > 0 && (
          <button onClick={markAllRead}
                  className="text-[0.72rem] text-primary hover:underline flex items-center gap-1">
            <CheckOutlined style={{ fontSize: 11 }} /> {t('s.tout_marquer_comme_lu')}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="py-7 text-center text-[0.78rem] text-text-muted">{t('s.aucune_notification')}</p>
      ) : (
        <ul className="divide-y divide-black/5 dark:divide-white/10 -mx-1">
          {items.slice(0, PREVIEW).map((n) => (
            <li key={n.id}>
              <button onClick={() => go(n)}
                      className={`w-full text-left flex items-start gap-2.5 px-2 py-2.5 rounded-md hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors ${n.read ? 'opacity-55' : ''}`}>
                <Tag color={n.tone} bordered={false} className="mt-1 shrink-0 !mr-0 !px-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-current align-middle" />
                </Tag>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.79rem] text-text-heading leading-snug break-words">{n.text}</span>
                  <span className="block text-[0.7rem] text-text-muted">{since(t, n.at)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="pt-2 mt-1 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <WifiOutlined style={{ fontSize: 11 }}
                        className={status === 'SUBSCRIBED' ? 'text-emerald-500' : 'text-text-muted'} />
          <span className="text-[0.7rem] text-text-muted">
            {status === 'SUBSCRIBED' ? t('s.connecte_en_direct') : t('s.hors_connexion_directe')}
          </span>
        </span>
        <button onClick={() => { setOpen(false); navigate('/notifications'); }}
                className="text-[0.74rem] text-primary hover:underline flex items-center gap-1">
          {t('s.voir_plus')} <ArrowRightOutlined style={{ fontSize: 10 }} />
        </button>
      </div>
    </div>
  );

  return (
    <Popover content={content} trigger="click" placement="bottomRight"
             open={open} onOpenChange={setOpen}>
      <Tooltip title={t('s.notifications')} placement="bottom">
        <button
          className="p-2 rounded-lg bg-black/5 dark:bg-white/5 text-text-secondary hover:text-primary transition-colors border border-black/5 dark:border-white/5"
          aria-label={t('s.notifications')}
        >
          <Badge count={unread} size="small" offset={[2, -2]}>
            <BellOutlined style={{ fontSize: 16 }} />
          </Badge>
        </button>
      </Tooltip>
    </Popover>
  );
};

export default NotificationBell;
