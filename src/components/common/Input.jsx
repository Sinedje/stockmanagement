import React from 'react';
import { Input as AntInput } from 'antd';

const Input = ({ label, icon: Icon, error, hint, containerClassName = '', ...props }) => {
  return (
    <div className={`custom-input-group ${containerClassName}`} style={{ marginBottom: '1.25rem' }}>
      {label && <label className="custom-input-label">{label}</label>}
      {props.type === 'password' ? (
        <AntInput.Password
          prefix={Icon && <Icon size={16} style={{ color: '#64748b', marginRight: '4px' }} />}
          status={error ? 'error' : ''}
          className="custom-antd-input"
          {...props}
        />
      ) : (
        <AntInput
          prefix={Icon && <Icon size={16} style={{ color: '#64748b', marginRight: '4px' }} />}
          status={error ? 'error' : ''}
          className="custom-antd-input"
          {...props}
        />
      )}
      {error && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</div>}
      {hint && <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.25rem' }}>{hint}</div>}
    </div>
  );
};

export default Input;
