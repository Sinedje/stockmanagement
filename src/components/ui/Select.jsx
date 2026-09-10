import React from 'react';
import { Select as AntSelect } from 'antd';

/**
 * Liste déroulante unique de l'application.
 * `options` accepte des chaînes ou des objets `{ label, value }`.
 */
const Select = ({ options = [], width = 170, className = '', ...rest }) => (
  <AntSelect
    options={options.map(o => (typeof o === 'object' ? o : { label: o, value: o }))}
    className={`custom-select ${className}`}
    style={{ width }}
    {...rest}
  />
);

export default Select;
