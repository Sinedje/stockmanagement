import React from 'react';
import { Select as AntSelect } from 'antd';

const Select = ({ label, icon: Icon, error, hint, options = [], containerClassName = '', ...props }) => {
  const formattedOptions = options.map(opt => 
    typeof opt === 'object' ? opt : { label: opt, value: opt }
  );

  return (
    <div className={`custom-input-group ${containerClassName}`} style={{ marginBottom: '1.25rem' }}>
      {label && <label className="custom-input-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>{label}</label>}
      <AntSelect
        suffixIcon={Icon && <Icon size={16} />}
        status={error ? 'error' : ''}
        options={formattedOptions}
        style={{ width: '100%' }}
        {...props}
      />
      {error && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</div>}
      {hint && !error && <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>{hint}</div>}
    </div>
  );
};

export default Select;
