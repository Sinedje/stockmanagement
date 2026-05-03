import React from 'react';
import { useStore } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Package, ChevronRight } from 'lucide-react';

const Sidebar = ({ items, activeItem, onItemClick }) => {
  const { currentUser, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';
  const roleLabels = { manager: 'Gestionnaire', cashier: 'Caissier', accountant: 'Comptable' };

  return (
    <aside 
      className="bg-[#0b1120]/80 backdrop-blur-xl border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-50 shadow-2xl"
      style={{ width: 'var(--sidebar-width)' }}
    >
      {/* Brand Section */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-black flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
            <Package size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-text-heading text-base font-black tracking-tighter leading-none">STOCK</h2>
            <h2 className="text-primary text-[0.6rem] font-black tracking-[0.2em] mt-1 opacity-80">EXPERT</h2>
          </div>
        </div>
      </div>

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
                  : 'text-text-secondary hover:bg-white/[0.03] hover:text-text-primary'}
              `}
              onClick={() => onItemClick(item.id)}
            >
              <div className={`
                w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-500
                ${isActive ? 'bg-primary text-black scale-105 shadow-lg shadow-primary/30' : 'bg-white/5 text-text-muted group-hover:text-primary group-hover:bg-primary/10'}
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
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/5 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/40 to-primary/10 border border-primary/30 flex items-center justify-center font-black text-primary text-xs shadow-inner uppercase">
                {initials}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary border-2 border-[#0b1120] rounded-full shadow-lg shadow-primary/40"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-text-heading text-sm font-black truncate leading-tight tracking-tight">{currentUser?.name}</div>
              <div className="text-primary text-[0.6rem] font-black uppercase tracking-[0.1em] mt-0.5 opacity-70">
                {roleLabels[currentUser?.role] || currentUser?.role}
              </div>
            </div>
          </div>
          
          <button 
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 text-text-secondary hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20 transition-all duration-500 text-[0.75rem] font-black uppercase tracking-widest border border-white/5 hover:border-transparent group"
            onClick={handleLogout}
          >
            <LogOut size={16} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
            <span>Sortie</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
