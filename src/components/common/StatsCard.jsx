import React from 'react';

const StatsCard = ({ icon: Icon, label, value, change, changeDir, color = 'green', accentColor }) => {
  return (
    <div 
      className="bg-bg-card backdrop-blur-md border border-black/5 dark:border-white/5 rounded-2xl p-6 transition-all duration-300 hover:border-black/10 dark:hover:border-white/10 hover:shadow-xl group"
      style={accentColor ? { borderTop: `4px solid ${accentColor}` } : undefined}
    >
      <div className="flex items-center justify-between mb-5">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
          style={{ 
            backgroundColor: accentColor ? `${accentColor}10` : 'rgba(16, 185, 129, 0.08)',
            color: accentColor || '#10b981',
          }}
        >
          <Icon size={24} strokeWidth={2} />
        </div>
        {change !== undefined && (
          <span className={`text-[0.7rem] font-bold px-2 py-1 rounded-lg ${changeDir === 'down' ? 'bg-red-500/10 text-red-500' : 'bg-primary-bg text-primary'}`}>
            {changeDir === 'down' ? '↓' : '↑'} {change}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-[0.7rem] font-black text-text-secondary dark:text-text-muted uppercase tracking-widest">{label}</div>
        <div className="text-2xl font-black text-text-heading tracking-tight">{value}</div>
      </div>
    </div>
  );
};

export default StatsCard;
