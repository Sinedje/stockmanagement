import React from 'react';
import Sidebar from '../common/Sidebar';
import { useStore } from '../../context/StoreContext';
import { LogOut, User } from 'lucide-react';
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
  const { currentUser, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';
  const roleLabels = { manager: 'Gestionnaire', cashier: 'Caissier', accountant: 'Comptable' };

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary">
      {/* Fixed Sidebar */}
      {showSidebar && <Sidebar items={items} activeItem={activeItem} onItemClick={onItemClick} />}
      
      {/* Main Content Area */}
      <main 
        className="flex-1 flex flex-col min-h-screen relative transition-all duration-300 print:!ml-0"
        style={{ marginLeft: showSidebar ? 'var(--sidebar-width)' : '0' }}
      >
        {/* Page Header */}
        <header className="px-6 py-6 bg-gradient-to-b from-black/5 dark:from-black/20 to-transparent sticky top-0 z-40 backdrop-blur-md border-b border-black/[0.03] dark:border-white/[0.02] print:static print:bg-none print:border-none print:py-4 print:px-0">
          <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:flex-row print:items-start">
            <div className="flex-1">
              {/* Date visible uniquement à l'impression */}
              <div className="hidden print:block mb-3 text-text-heading font-black text-xl uppercase tracking-widest">
                {new Date().toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}
              </div>
              <h1 className="text-2xl font-black text-text-heading tracking-tight mb-1 uppercase">
                {title}
              </h1>
              {subtitle && (
                <p className="text-text-secondary text-[0.85rem] font-medium opacity-70">
                  {subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-6">
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
        <div className="px-10 pb-12 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>

        {/* Footer / Branding */}
        <footer className="px-10 py-8 border-t border-black/5 dark:border-white/5 text-center text-text-muted text-[0.7rem] uppercase tracking-[0.3em] opacity-30 font-medium">
          Stock Expert &copy; 2026 — Système de Gestion Intelligent d'Inventaire
        </footer>
      </main>
    </div>
  );
};

export default DashboardLayout;
