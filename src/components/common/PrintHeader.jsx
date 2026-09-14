import React from 'react';
import { useSettings } from '../../hooks';

/**
 * En-tête commun à tous les documents imprimés.
 *
 * Chaque entreprise imprime ses propres mentions — raison sociale, activité,
 * téléphones, NIU, RCCM — telles qu'elle les a saisies dans ses réglages.
 * Aucune valeur de repli codée en dur : un document qui afficherait les
 * coordonnées d'une autre société serait faux, et fiscalement, une facture au
 * mauvais NIU n'engage pas la bonne entreprise. Un champ vide reste vide.
 */
const PrintHeader = ({ title, subtitle, agency }) => {
  const { companySettings } = useSettings();
  const c = companySettings || {};

  return (
    <div style={{ borderBottom: '1px solid #000', paddingBottom: 6, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          {c.name && <div style={{ fontWeight: 'bold', fontSize: 13 }}>{c.name}</div>}
          {c.activity && <div style={{ fontSize: 9.5, marginTop: 1 }}>{c.activity}</div>}
          {agency && <div style={{ fontSize: 9.5, marginTop: 1, fontWeight: 'bold' }}>{agency}</div>}
          {c.phones && <div style={{ fontSize: 9.5, marginTop: 1 }}>TEL : {c.phones}</div>}
          {(c.ncc || c.rccm) && (
            <div style={{ fontSize: 9, marginTop: 3, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {c.ncc && <span>NIU : {c.ncc}</span>}
              {c.rccm && <span>RCC : {c.rccm}</span>}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
          {title && <div style={{ fontWeight: 'bold', fontSize: 12 }}>{title}</div>}
          {subtitle && <div style={{ fontSize: 9.5, marginTop: 2 }}>{subtitle}</div>}
          <div style={{ fontSize: 9, marginTop: 2 }}>
            {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Même en-tête, rendu en chaîne HTML.
 *
 * Les états et transferts s'impriment en ouvrant une fenêtre à part, écrite
 * par concaténation : React n'y a pas cours. Les deux formes doivent donc
 * exister, mais elles lisent la même source.
 */
export const printHeaderHtml = (companySettings, { title, subtitle, agency } = {}) => {
  const c = companySettings || {};
  const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (m) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const line = (v, style = '') => (v ? `<div style="${style}">${esc(v)}</div>` : '');

  return `
    <div style="border-bottom:1px solid #000;padding-bottom:6px;margin-bottom:10px;
                display:flex;justify-content:space-between;gap:16px;align-items:flex-start">
      <div>
        ${line(c.name, 'font-weight:bold;font-size:13px')}
        ${line(c.activity, 'font-size:9.5px;margin-top:1px')}
        ${line(agency, 'font-size:9.5px;margin-top:1px;font-weight:bold')}
        ${c.phones ? `<div style="font-size:9.5px;margin-top:1px">TEL : ${esc(c.phones)}</div>` : ''}
        ${(c.ncc || c.rccm) ? `<div style="font-size:9px;margin-top:3px;display:flex;gap:24px">
          ${c.ncc ? `<span>NIU : ${esc(c.ncc)}</span>` : ''}
          ${c.rccm ? `<span>RCC : ${esc(c.rccm)}</span>` : ''}
        </div>` : ''}
      </div>
      <div style="text-align:right;white-space:nowrap">
        ${line(title, 'font-weight:bold;font-size:12px')}
        ${line(subtitle, 'font-size:9.5px;margin-top:2px')}
        <div style="font-size:9px;margin-top:2px">${new Date().toLocaleDateString('fr-FR',
          { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      </div>
    </div>`;
};

export default PrintHeader;
