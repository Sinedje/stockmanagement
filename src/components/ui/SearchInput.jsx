import React from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

/**
 * Champ de recherche unique de l'application.
 *
 * `onChange` reçoit directement la valeur saisie. Les écrans plus anciens qui
 * attendent l'évènement DOM passent `emitEvent` — cela évite d'avoir deux
 * apparences de recherche selon l'ancienneté de la page.
 */
const SearchInput = ({
  value,
  onChange,
  emitEvent = false,
  placeholder = 'Rechercher…',
  width = 240,
  className = '',
  ...rest
}) => (
  <Input
    allowClear
    value={value}
    onChange={(e) => onChange?.(emitEvent ? e : e.target.value)}
    placeholder={placeholder}
    prefix={<SearchOutlined className="text-text-muted" />}
    className={`custom-search ${className}`}
    style={{ width, maxWidth: '100%' }}
    {...rest}
  />
);

export default SearchInput;
