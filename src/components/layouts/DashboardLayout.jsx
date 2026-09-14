import { useT } from '../../i18n/I18nContext';
import React, { useState } from 'react';
import Sidebar from '../common/Sidebar';
import OfflineBanner from '../../offline/OfflineBanner';
import { useCompanyBranding } from '../../hooks';
import { disabledSections } from '../../config/features';
import { useAuth } from '../../context/AuthContext';
import { LogoutOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../../notifications/NotificationBell';

const DashboardLayout = ({
  children,
  items,
  activeItem,
  onItemClick,
  title,
  subtitle,
  headerActions,
  showSidebar = true
}) => {
  const t = useT();
  const { currentUser, logout } = useAuth();
  const { features } = useCompanyBranding();

  // Un module coupé pour cette entreprise retire ses entrées du menu. Les
  // données restent en base : réactiver le module les rend simplement visibles.
  const visibleItems = React.useMemo(() => {
    const hidden = disabledSections(features);
    if (!hidden.length) return items;
    return (items || [])
      .map(node => node.children
        ? { ...node, children: node.children.filter(c => !hidden.includes(c.id)) }
        : node)
      .filter(node => (node.children ? node.children.length > 0 : !hidden.includes(node.id)));
  }, [items, features]);
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';
  const roleLabels = { manager: 'Gestionnaire', cashier: 'Caissier', accountant: 'Comptable' };

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary relative">
      {/* Ambient blurred gradient backdrop for the glass surfaces to sit on */}
      <div className="app-ambient-bg print:hidden" />

      {/* Fixed Sidebar */}
      {showSidebar && (
        <Sidebar
          items={visibleItems}
          activeItem={activeItem}
          onItemClick={onItemClick}
          isOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 min-w-0 flex flex-col min-h-screen relative z-10 transition-all duration-300 print:ml-0! ${showSidebar ? 'sidebar-adjusted' : ''}`}
      >
        {/* Page Header */}
        <header className="px-4 sm:px-6 lg:px-10 py-2.5 glass-panel border-x-0 border-t-0 sticky top-0 z-40 rounded-none print:static print:bg-none print:border-none print:py-4 print:px-0 print:shadow-none">
          <div className="max-w-7xl mx-auto w-full flex flex-row justify-between items-center gap-3 print:items-start">
            <div className="flex-1 flex items-center gap-2.5 min-w-0">
              {showSidebar && (
                <button
                  onClick={() => setMobileNavOpen(true)}
                  className="md:hidden shrink-0 w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 text-text-secondary hover:text-primary flex items-center justify-center border border-black/5 dark:border-white/5 print:hidden"
                  title={t('s.menu')}
                >
                  <MenuOutlined style={{ fontSize: 17 }} />
                </button>
              )}
              <div className="min-w-0 print:hidden flex items-baseline gap-2.5 min-w-0">
                <h1 className="text-[0.95rem] font-semibold text-text-heading tracking-tight truncate shrink-0">
                  {title}
                </h1>
                {subtitle && (
                  <p className="hidden lg:block text-text-muted text-[0.72rem] font-normal truncate border-l border-black/10 dark:border-white/10 pl-2.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* La cloche est au même endroit pour tout le monde : chacun y
                  trouve ce qui le concerne, personne n'a à l'apprendre deux fois. */}
              <div className="print:hidden"><NotificationBell /></div>

              {headerActions && (
                <div className="flex items-center gap-2 animate-fade-in print:hidden">
                  {headerActions}
                </div>
              )}

              {/* User Section for Sidebarless pages or Print */}
              <div className={`flex items-center gap-4 pl-4 border-l border-black/10 dark:border-white/10 print:hidden ${showSidebar ? 'hidden print:hidden' : ''}`}>
                <div className="text-right sm:block">
                  <div className="text-text-heading text-xs font-bold leading-tight print:text-xl print:font-black">{currentUser?.name}</div>
                  <div className="text-primary text-[0.6rem] font-semibold uppercase tracking-widest opacity-60 print:text-sm">
                    {roleLabels[currentUser?.role] || currentUser?.role}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center font-semibold text-primary text-[0.65rem] shadow-inner uppercase print:hidden">
                  {initials}
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 border border-black/5 dark:border-white/5 hover:border-red-500/20 print:hidden"
                  title={t('s.deconnexion')}
                >
                  <LogoutOutlined style={{ fontSize: 16 }} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="px-4 sm:px-6 lg:px-10 pt-5 sm:pt-6 pb-10 max-w-7xl mx-auto w-full flex-1">
          {/* Placé au-dessus du contenu : une vente non transmise doit se voir
              depuis n'importe quel écran, pas seulement depuis la caisse. */}
          <div className="mb-4 empty:mb-0"><OfflineBanner /></div>
          {children}
        </div>

        {/* Footer / Branding */}
        <footer className="px-4 sm:px-6 lg:px-10 py-6 border-t border-black/5 dark:border-white/5 text-center text-text-muted text-[0.72rem] font-medium print:hidden">
          Stock Expert &copy; {new Date().getFullYear()}
        </footer>
      </main>
    </div>
  );
};

export default DashboardLayout;
