import React from 'react';
import { Input as AntInput } from 'antd';

const Input = ({ label, icon: Icon, error, hint, containerClassName = '', ...props }) => {
  const prefix = Icon ? <Icon size={16} className="text-text-muted mr-1" /> : undefined;
  const shared = {
    prefix,
    status: error ? 'error' : '',
    className: 'custom-antd-input',
    'aria-invalid': error ? true : undefined,
  };

  return (
    <div className={`custom-input-group mb-5 ${containerClassName}`}>
      {label && <label className="custom-input-label">{label}</label>}
      {props.type === 'password'
        ? <AntInput.Password {...shared} {...props} />
        : <AntInput {...shared} {...props} />}
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
      {hint && <div className="text-text-muted text-[0.7rem] mt-1">{hint}</div>}
    </div>
  );
};

export default Input;
