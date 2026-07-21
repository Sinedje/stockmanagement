import React, { useState } from 'react';
import Sidebar from '../common/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const { currentUser, logout } = useAuth();
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
          items={items}
          activeItem={activeItem}
          onItemClick={onItemClick}
          isOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 min-w-0 flex flex-col min-h-screen relative z-10 transition-all duration-300 print:ml-0! ${showSidebar ? 'md:ml-[var(--sidebar-width)]' : ''}`}
      >
        {/* Page Header */}
        <header className="px-4 sm:px-6 py-4 sm:py-6 glass-panel border-x-0 border-t-0 sticky top-0 z-40 rounded-none print:static print:bg-none print:border-none print:py-4 print:px-0 print:shadow-none">
          <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:flex-row print:items-start">
            <div className="flex-1 flex items-start gap-3 min-w-0">
              {showSidebar && (
                <button
                  onClick={() => setMobileNavOpen(true)}
                  className="md:hidden shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-black/5 dark:bg-white/5 text-text-secondary hover:text-primary flex items-center justify-center border border-black/5 dark:border-white/5 print:hidden"
                  title="Menu"
                >
                  <Menu size={18} strokeWidth={2.5} />
                </button>
              )}
              <div className="min-w-0">
                {/* Date visible uniquement à l'impression */}
                <div className="hidden print:block mb-3 text-text-heading font-black text-xl uppercase tracking-widest">
                  {new Date().toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-text-heading tracking-tight mb-1 uppercase truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-text-secondary text-[0.8rem] sm:text-[0.85rem] font-medium opacity-70">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-6 w-full md:w-auto">
              {headerActions && (
                <div className="flex items-center gap-4 animate-fade-in print:hidden">
                  {headerActions}
                </div>
              )}

              {/* User Section for Sidebarless pages or Print */}
              <div className={`flex items-center gap-4 pl-4 border-l border-black/10 dark:border-white/10 print:border-none print:pl-0 ${showSidebar ? 'hidden print:flex' : ''}`}>
                <div className="text-right sm:block">
                  <div className="text-text-heading text-xs font-bold leading-tight print:text-xl print:font-black">{currentUser?.name}</div>
                  <div className="text-primary text-[0.6rem] font-black uppercase tracking-widest opacity-60 print:text-sm">
                    {roleLabels[currentUser?.role] || currentUser?.role}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center font-black text-primary text-[0.65rem] shadow-inner uppercase print:hidden">
                  {initials}
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 border border-black/5 dark:border-white/5 hover:border-red-500/20 print:hidden"
                  title="Déconnexion"
                >
                  <LogOut size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="px-4 sm:px-6 lg:px-10 pb-12 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>

        {/* Footer / Branding */}
        <footer className="px-4 sm:px-6 lg:px-10 py-8 border-t border-black/5 dark:border-white/5 text-center text-text-muted text-[0.7rem] uppercase tracking-[0.3em] opacity-30 font-medium">
          Stock Expert &copy; 2026 — Système de Gestion Intelligent d'Inventaire
        </footer>
      </main>
    </div>
  );
};

export default DashboardLayout;
