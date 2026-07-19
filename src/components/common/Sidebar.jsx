import React from 'react';
import { useStore } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Package, ChevronRight, MapPin, Store, ChevronDown, Sun, Moon } from 'lucide-react';

const Sidebar = ({ items, activeItem, onItemClick }) => {
  const { currentUser, logout, activeStore, stores, switchStore, theme, toggleTheme } = useStore();
  const navigate = useNavigate();

  const isManager = currentUser?.role === 'manager';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';
  const roleLabels = { manager: 'Gestionnaire', cashier: 'Caissier', accountant: 'Comptable' };

  return (
    <aside 
      className="bg-bg-secondary/80 backdrop-blur-xl border-r border-black/5 dark:border-white/5 flex flex-col h-screen fixed left-0 top-0 z-50 shadow-2xl print:hidden"
      style={{ width: 'var(--sidebar-width)' }}
    >
      {/* Brand Section */}
      <div className="px-6 py-6 mt-2">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-primary to-primary-dark text-black flex items-center justify-center shadow-xl shadow-primary/30 group-hover:scale-105 transition-transform duration-300 shrink-0">
            <Package size={24} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <h2 className="text-text-heading text-xl font-black tracking-tighter leading-none truncate">STOCK</h2>
            <h2 className="text-primary text-[0.7rem] font-black tracking-[0.25em] mt-1 opacity-90 truncate">EXPERT</h2>
          </div>
        </div>
      </div>
      
      {/* Store Section - Caché pour le PDG car il a une vue globale */}
      {currentUser?.role !== 'ceo' && (
        <div className="px-5 mb-4">
          <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-2 text-primary">
              <Store size={14} strokeWidth={3} />
              <span className="text-[0.65rem] font-black uppercase tracking-[0.25em]">Magasin Actif</span>
            </div>
            <div className="flex items-center justify-between group cursor-pointer gap-2" onClick={() => isManager && onItemClick('stores')}>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-text-heading text-[1.05rem] font-black truncate leading-tight" title={activeStore?.name}>{activeStore?.name}</span>
                <div className="flex items-center gap-1.5 opacity-60 mt-1">
                  <MapPin size={12} strokeWidth={2.5} className="text-primary" />
                  <span className="text-[0.65rem] font-bold truncate uppercase tracking-wider">{activeStore?.location || 'Siège'}</span>
                </div>
              </div>
              {isManager && (
                <div className="w-7 h-7 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all shadow-sm">
                  <ChevronDown size={14} strokeWidth={3} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Section */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar py-2">
        <div className="px-4 mb-4 text-[0.6rem] font-black text-text-muted uppercase tracking-[0.2em] opacity-40">
          Navigation
        </div>
        {items.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              className={`
                relative w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group
                ${isActive 
                  ? 'bg-primary/10 text-primary shadow-lg border border-primary/20' 
                  : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary'}
              `}
              onClick={() => onItemClick(item.id)}
            >
              <div className={`
                w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-500
                ${isActive ? 'bg-primary text-black scale-105 shadow-lg shadow-primary/30' : 'bg-black/5 dark:bg-white/5 text-text-muted group-hover:text-primary group-hover:bg-primary/10'}
              `}>
                <item.icon size={18} strokeWidth={2.5} />
              </div>
              
              <span className={`text-[0.88rem] font-black tracking-tight ${isActive ? 'translate-x-1' : ''} transition-transform duration-300`}>
                {item.label}
              </span>

              {item.badge ? (
                <span className="ml-auto bg-red-500 text-white text-[0.6rem] font-black px-1.5 py-0.5 rounded-md shadow-lg shadow-red-500/30 animate-pulse">
                  {item.badge}
                </span>
              ) : (
                <ChevronRight size={12} className={`ml-auto transition-all duration-300 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4">
        <div className="bg-black/5 dark:bg-white/[0.03] backdrop-blur-md border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/40 to-primary/10 border border-primary/30 flex items-center justify-center font-black text-primary text-xs shadow-inner uppercase">
                {initials}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary border-2 border-bg-secondary rounded-full shadow-lg shadow-primary/40"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-text-heading text-sm font-black truncate leading-tight tracking-tight">{currentUser?.name}</div>
              <div className="text-primary text-[0.6rem] font-black uppercase tracking-[0.1em] mt-0.5 opacity-70">
                {roleLabels[currentUser?.role] || currentUser?.role}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center gap-3 w-full py-3 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all duration-500 text-[0.75rem] font-black uppercase tracking-widest border border-primary/10 group"
            >
              {theme === 'light' ? (
                <>
                  <Moon size={16} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
                  <span>Mode Sombre</span>
                </>
              ) : (
                <>
                  <Sun size={16} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform" />
                  <span>Mode Clair</span>
                </>
              )}
            </button>

            <button 
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20 transition-all duration-500 text-[0.75rem] font-black uppercase tracking-widest border border-black/5 dark:border-white/5 hover:border-transparent group"
              onClick={handleLogout}
            >
              <LogOut size={16} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
              <span>Sortie</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
