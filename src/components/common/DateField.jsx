import React from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import fr from 'antd/locale/fr_FR';
import { ConfigProvider } from 'antd';

dayjs.locale('fr');

/**
 * Champ de date unique de l'application.
 *
 * Remplace `<input type="date">`, dont l'apparence est imposée par le navigateur
 * et ignore le thème. L'état reste une chaîne `YYYY-MM-DD` pour rester compatible
 * avec le code existant qui compare des dates.
 */
const DateField = ({ value, onChange, placeholder = 'Choisir une date', className = '', ...rest }) => (
  <ConfigProvider locale={fr}>
    <DatePicker
      value={value ? dayjs(value) : null}
      onChange={(d) => onChange?.(d ? d.format('YYYY-MM-DD') : '')}
      format="DD/MM/YYYY"
      placeholder={placeholder}
      allowClear
      className={`custom-datepicker ${className}`}
      {...rest}
    />
  </ConfigProvider>
);

export default DateField;
