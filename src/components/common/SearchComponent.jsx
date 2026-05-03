import React from 'react';
import { Input } from 'antd';
import { Search } from 'lucide-react';

const SearchComponent = ({ 
  placeholder = "Rechercher...", 
  onSearch, 
  onChange, 
  value, 
  width = 400,
  className = '',
  ...props 
}) => {
  return (
    <div className={`custom-search-container ${className}`} style={{ width, maxWidth: '100%' }}>
      <Input
        placeholder={placeholder}
        allowClear
        prefix={<Search size={18} className="text-text-muted mr-2" />}
        size="large"
        onChange={onChange}
        value={value}
        className="h-11 rounded-xl bg-white/5 border-white/10 hover:border-primary/50 focus:border-primary transition-all duration-300 shadow-inner"
        {...props}
      />
    </div>
  );
};

export default SearchComponent;
