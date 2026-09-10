import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStores, useTheme, useSettings } from '../../hooks';
import { useT } from '../../i18n/I18nContext';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from 'antd';
import {
  LogoutOutlined, AppstoreOutlined, RightOutlined, DownOutlined, EnvironmentOutlined,
  ShopOutlined, BulbOutlined, BulbFilled, CloseOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
} from '@ant-design/icons';

const COLLAPSE_KEY = 'sidebarCollapsed';

const isGroup = (node) => Array.isArray(node?.children) && node.children.length > 0;

/* ── Lien de navigation ─────────────────────────────────────────── */
const NavLink = ({ item, isActive, onClick, nested = false, collapsed = false }) => {
  const body = (
    <button
      onClick={() => onClick(item.id)}
      aria-current={isActive ? 'page' : undefined}
      className={`relative w-full flex items-center rounded-lg transition-colors duration-200 group
        ${collapsed ? 'justify-center p-2' : nested ? 'gap-2.5 py-2 pl-2.5 pr-2' : 'gap-2.5 px-2.5 py-2'}
        ${isActive
          ? 'bg-primary/10 text-primary'
          : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary'}`}
    >
      <span
        className={`rounded-md flex items-center justify-center shrink-0 transition-colors
          ${nested && !collapsed ? 'w-6 h-6' : 'w-7 h-7'}
          ${isActive ? 'bg-primary text-white' : 'bg-black/5 dark:bg-white/5 text-text-muted group-hover:text-primary'}`}
      >
        <item.icon style={{ fontSize: nested && !collapsed ? 12 : 14 }} />
      </span>

      {!collapsed && (
        <span className={`text-left leading-snug flex-1 min-w-0 truncate ${nested ? 'text-[0.78rem]' : 'text-[0.82rem]'} ${isActive ? 'font-semibold' : 'font-normal'}`}>
          {item.label}
        </span>
      )}

      {!collapsed && item.badge ? (
        <span className="ml-auto shrink-0 bg-red-500 text-white text-[0.58rem] font-semibold px-1.5 py-0.5 rounded">
          {item.badge}
        </span>
      ) : null}

      {collapsed && item.badge ? (
        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
      ) : null}
    </button>
  );

  return collapsed ? <Tooltip title={item.label} placement="right">{body}</Tooltip> : body;
};

/* ── Groupe repliable ───────────────────────────────────────────── */
const NavGroup = ({ group, activeItem, onItemClick, isExpanded, onToggle, collapsed }) => {
  const containsActive = group.children.some(c => c.id === activeItem);
  const rolledUpBadge = group.children.reduce((sum, c) => sum + (Number(c.badge) || 0), 0);
  const panelId = `nav-group-${group.id}`;
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  // Replié : le groupe s'ouvre en volet flottant, sinon ses entrées seraient inatteignables.
  if (collapsed) {
    return (
      <div className="relative" onMouseEnter={() => setFlyoutOpen(true)} onMouseLeave={() => setFlyoutOpen(false)}>
        <Tooltip title={flyoutOpen ? '' : group.label} placement="right">
          <button
            onClick={() => setFlyoutOpen(o => !o)}
            aria-expanded={flyoutOpen}
            className={`relative w-full flex items-center justify-center p-2 rounded-lg transition-colors
              ${containsActive ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5'}`}
          >
            <span className={`w-7 h-7 rounded-md flex items-center justify-center ${containsActive ? 'bg-primary/15 text-primary' : 'bg-black/5 dark:bg-white/5 text-text-muted'}`}>
              <group.icon style={{ fontSize: 14 }} />
            </span>
            {rolledUpBadge > 0 && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />}
          </button>
        </Tooltip>

        {flyoutOpen && (
          <div className="absolute left-full top-0 ml-1 z-50 w-56 glass-panel-strong rounded-lg p-1.5 shadow-xl">
            <p className="px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-wider text-text-muted">{group.label}</p>
            <div className="flex flex-col gap-0.5">
              {group.children.map(child => (
                <NavLink key={child.id} item={child} nested isActive={activeItem === child.id} onClick={onItemClick} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => onToggle(group.id)}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors duration-200 group
          ${containsActive && !isExpanded ? 'text-primary bg-primary/5' : 'text-text-primary hover:bg-black/5 dark:hover:bg-white/5'}`}
      >
        <span className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${containsActive ? 'bg-primary/15 text-primary' : 'bg-black/5 dark:bg-white/5 text-text-muted group-hover:text-primary'}`}>
          <group.icon style={{ fontSize: 14 }} />
        </span>
        <span className="flex-1 min-w-0 text-left text-[0.66rem] font-semibold uppercase tracking-[0.08em] truncate">
          {group.label}
        </span>
        {!isExpanded && rolledUpBadge > 0 && (
          <span className="shrink-0 bg-red-500 text-white text-[0.58rem] font-semibold px-1.5 py-0.5 rounded">{rolledUpBadge}</span>
        )}
        <DownOutlined style={{ fontSize: 10 }} className={`shrink-0 opacity-50 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* 0fr -> 1fr : anime la hauteur sans la connaître à l'avance */}
      <div id={panelId} className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}>
        <div className="overflow-hidden">
          <div className="pt-0.5 pb-0.5 pl-2.5 ml-[0.95rem] border-l border-black/10 dark:border-white/10 space-y-0.5">
            {group.children.map(child => (
              <NavLink key={child.id} item={child} nested isActive={activeItem === child.id} onClick={onItemClick} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Barre latérale ─────────────────────────────────────────────── */
const Sidebar = ({ items, activeItem, onItemClick, isOpen = false, onClose }) => {
  const { currentUser, logout } = useAuth();
  const { activeStore, stores, switchStore } = useStores();
  const { companySettings } = useSettings();
  const { theme, toggleTheme } = useTheme();
  const t = useT();
  const navigate = useNavigate();

  // Repli mémorisé entre les sessions. En dessous de `lg`, le CSS force le rail
  // d'icônes quelle que soit cette valeur (voir .sidebar-* dans index.css).
  // Déplié par défaut : les libellés restent lisibles. Le rail d'icônes n'existe
  // que si l'utilisateur le choisit, et son choix est mémorisé.
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === 'true'; } catch { return false; }
  });
  const toggleCollapsed = () => setCollapsed(c => {
    const next = !c;
    try { localStorage.setItem(COLLAPSE_KEY, String(next)); } catch { /* stockage indisponible */ }
    return next;
  });

  const [storePickerOpen, setStorePickerOpen] = useState(false);

  const groupOfActive = useMemo(
    () => items.find(n => isGroup(n) && n.children.some(c => c.id === activeItem))?.id ?? null,
    [items, activeItem]
  );
  const [overrides, setOverrides] = useState({});
  // Ouverts par défaut : aucune entrée de navigation n'est masquée au premier
  // regard. `overrides` ne retient que ce que l'utilisateur a refermé lui-même.
  const isGroupExpanded = (id) => overrides[id] ?? true;
  const toggleGroup = (id) => setOverrides(prev => ({ ...prev, [id]: !isGroupExpanded(id) }));

  const handleLogout = () => { logout(); navigate('/login'); };
  const handleItemClick = (id) => { onItemClick(id); onClose?.(); };

  const initials = currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';
  const roleLabel = t(`role.${currentUser?.role}`);

  // Magasins où l'utilisateur travaille : tous pour la direction, sinon le sien.
  const myStores = useMemo(() => {
    if (!stores?.length) return [];
    if (['ceo', 'manager', 'accountant'].includes(currentUser?.role)) return stores;
    return stores.filter(s => String(s.id) === String(currentUser?.storeId));
  }, [stores, currentUser]);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden print:hidden" onClick={onClose} />}

      <aside
        data-collapsed={collapsed ? 'true' : 'false'}
        className={`sidebar-shell glass-panel-strong border-y-0 border-l-0 rounded-none flex flex-col h-screen fixed left-0 top-0 z-50 print:hidden transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button onClick={onClose} className="md:hidden absolute top-3 right-3 w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center" title={t('action.close')}>
          <CloseOutlined style={{ fontSize: 13 }} />
        </button>

        {/* Marque : logo de l'application + nom de l'entreprise, et bascule du menu.
            La bascule vit ici plutôt qu'en pied de barre : c'est là qu'on la cherche. */}
        <div className="px-3 pt-4 pb-3 shrink-0">
          <div className={`flex items-center gap-2.5 ${collapsed ? 'flex-col' : ''}`}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center shadow-md shadow-primary/25 shrink-0">
              <AppstoreOutlined style={{ fontSize: 17 }} />
            </div>

            <div className="sidebar-label flex flex-col justify-center min-w-0 flex-1">
              <span className="text-text-heading text-[0.82rem] font-bold tracking-tight leading-tight truncate" title={companySettings?.name}>
                {companySettings?.name || 'STOCK EXPERT'}
              </span>
              <span className="text-primary text-[0.58rem] font-semibold tracking-[0.18em] opacity-80 truncate">{t('s.stock_expert')}</span>
            </div>

            <Tooltip title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')} placement="right">
              <button
                onClick={toggleCollapsed}
                aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
                aria-expanded={!collapsed}
                className="sidebar-collapse-toggle shrink-0 w-7 h-7 rounded-md items-center justify-center text-text-muted hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                {collapsed ? <MenuUnfoldOutlined style={{ fontSize: 14 }} /> : <MenuFoldOutlined style={{ fontSize: 14 }} />}
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Magasin de rattachement + bascule si l'utilisateur en couvre plusieurs */}
        {myStores.length > 0 && (
          <div className="px-3 mb-2 shrink-0 relative">
            <button
              onClick={() => myStores.length > 1 && setStorePickerOpen(o => !o)}
              className={`w-full flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 transition-colors
                ${collapsed ? 'justify-center p-2' : 'px-2.5 py-2'} ${myStores.length > 1 ? 'hover:bg-primary/10 cursor-pointer' : 'cursor-default'}`}
              title={activeStore?.name}
            >
              <ShopOutlined className="text-primary shrink-0" style={{ fontSize: 13 }} />
              <div className="sidebar-label flex flex-col min-w-0 flex-1 text-left">
                <span className="text-text-heading text-[0.76rem] font-semibold truncate leading-tight">{activeStore?.name || '—'}</span>
                <span className="text-text-muted text-[0.6rem] truncate flex items-center gap-1">
                  <EnvironmentOutlined style={{ fontSize: 9 }} />
                  {activeStore?.location || t('sidebar.headOffice')}
                </span>
              </div>
              {myStores.length > 1 && <DownOutlined className="sidebar-label text-primary shrink-0" style={{ fontSize: 9 }} />}
            </button>

            {storePickerOpen && myStores.length > 1 && (
              <div className="absolute left-3 right-3 top-full mt-1 z-50 glass-panel-strong rounded-lg p-1 shadow-xl max-h-64 overflow-y-auto custom-scrollbar">
                <p className="px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wider text-text-muted">
                  {t('sidebar.myStores')} ({myStores.length})
                </p>
                {myStores.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { switchStore?.(s.id); setStorePickerOpen(false); }}
                    className={`w-full text-left px-2 py-1.5 rounded-md text-[0.76rem] transition-colors truncate
                      ${String(s.id) === String(activeStore?.id) ? 'bg-primary/10 text-primary font-semibold' : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 px-2 pb-2 space-y-0.5 overflow-y-auto overflow-x-visible custom-scrollbar">
          {items.map(node =>
            isGroup(node)
              ? <NavGroup key={node.id} group={node} activeItem={activeItem} onItemClick={handleItemClick}
                  isExpanded={isGroupExpanded(node.id)} onToggle={toggleGroup} collapsed={collapsed} />
              : <NavLink key={node.id} item={node} isActive={activeItem === node.id} onClick={handleItemClick} collapsed={collapsed} />
          )}
        </nav>

        {/* Pied : identité, thème, repli, déconnexion */}
        <div className="p-2 shrink-0 border-t border-black/5 dark:border-white/10">
          <div className={`flex items-center gap-2 mb-2 ${collapsed ? 'justify-center' : 'px-1'}`}>
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center font-bold text-primary text-[0.62rem] uppercase shrink-0">
              {initials}
            </div>
            <div className="sidebar-label flex-1 min-w-0">
              <div className="text-text-heading text-[0.76rem] font-semibold truncate leading-tight">{currentUser?.name}</div>
              <div className="text-text-muted text-[0.6rem] truncate">{roleLabel}</div>
            </div>
          </div>

          <div className={`flex items-center gap-1 ${collapsed ? 'flex-col' : ''}`}>
            <Tooltip title={theme === 'light' ? t('sidebar.darkMode') : t('sidebar.lightMode')} placement="right">
              <button onClick={toggleTheme} aria-label={t('s.changer_de_theme')}
                className="flex-1 w-full flex items-center justify-center py-2 rounded-lg bg-black/5 dark:bg-white/5 text-text-secondary hover:text-primary transition-colors">
                {theme === 'light' ? <BulbOutlined style={{ fontSize: 14 }} /> : <BulbFilled style={{ fontSize: 14 }} />}
              </button>
            </Tooltip>

            <Tooltip title={t('sidebar.logout')} placement="right">
              <button onClick={handleLogout} aria-label={t('sidebar.logout')}
                className="flex-1 w-full flex items-center justify-center py-2 rounded-lg bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-red-500 hover:text-white transition-colors">
                <LogoutOutlined style={{ fontSize: 14 }} />
              </button>
            </Tooltip>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
