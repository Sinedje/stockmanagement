import React from 'react';
import { useStores, useUsers, useSettings } from '../../hooks';

// Convertit un montant en lettres (français, FCFA)
export const numberToWords = (num) => {
  if (!num || num === 0) return 'Zéro franc CFA';
  const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) {
      const t = Math.floor(n / 10);
      const o = n % 10;
      if (t === 7 || t === 9) {
        return tens[t] + '-' + ones[o + 10];
      }
      return tens[t] + (o === 1 ? '-et-' : '-') + ones[o];
    }
    if (n < 1000) {
      const h = Math.floor(n / 100);
      const r = n % 100;
      return (h > 1 ? ones[h] + ' ' : '') + 'cent' + (r > 0 ? ' ' + convert(r) : '');
    }
    if (n < 1000000) {
      const th = Math.floor(n / 1000);
      const r = n % 1000;
      return (th > 1 ? convert(th) + ' ' : '') + 'mille' + (r > 0 ? ' ' + convert(r) : '');
    }
    const m = Math.floor(n / 1000000);
    const r = n % 1000000;
    return convert(m) + ' million' + (m > 1 ? 's' : '') + (r > 0 ? ' ' + convert(r) : '');
  };

  return convert(num).charAt(0).toUpperCase() + convert(num).slice(1) + ' francs CFA';
};

// Styles partagés
const S = {
  wrap: {
    fontFamily: 'Arial, sans-serif',
    fontSize: '11px',
    color: '#000',
    background: '#fff',
    width: '100%',
    padding: '16px',
    boxSizing: 'border-box',
  },
  border1: { border: '1px solid #000' },
  td: { padding: '4px 6px', verticalAlign: 'top' },
  thCell: { 
    padding: '3px 6px', 
    fontWeight: 'bold', 
    fontSize: '10px', 
    background: '#f0f0f0', 
    borderBottom: '1.5px solid #000', 
    borderTop: '1px solid #000' 
  },
  tdCell: { padding: '3px 6px', fontSize: '10px', borderBottom: '1px solid #ddd' },
};

const InvoicePrintTemplate = ({ sale }) => {
  const { stores } = useStores();
  const { allCashierProducts } = useUsers();
  const { companySettings } = useSettings();
  if (!sale) return null;

  const date = new Date(sale.date);
  const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const netTotal = sale.total || 0;
  const amountInWords = numberToWords(netTotal);

  // Get the store associated with this sale
  const saleStore = stores.find(s => s.id === sale.storeId);
  const agencyName = saleStore ? `AGENCE ${saleStore.name.toUpperCase()}` : 'AGENCE FEU FLAMENCO';

  return (
    <div id="invoice-print-area" style={S.wrap}>
      
      {/* ── EN-TÊTE ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '1px solid #000', paddingBottom: '6px', marginBottom: '4px' }}>
        <tbody>
          <tr>
            {/* Gauche */}
            <td style={{ ...S.td, width: '55%', borderRight: '1px solid #000' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{companySettings?.name || 'GROUPE T. GRAND ZAO INTER SARL'}</div>
              <div style={{ fontSize: '9.5px', marginTop: '1px' }}>{companySettings?.activity || 'COMMERCE GENERAL ET PRESTATION DE SERVICES'}</div>
              <div style={{ fontSize: '9.5px', marginTop: '1px', fontWeight: 'bold' }}>{agencyName}</div>
              <div style={{ fontSize: '9.5px', marginTop: '1px' }}>TEL : {companySettings?.phones || '659 146 882 / 672 126 507'}</div>
              <div style={{ fontSize: '9px', marginTop: '3px', display: 'flex', gap: '24px' }}>
                <span>NCC : {companySettings?.ncc || 'M042318164160W'}</span>
                <span>RCC : {companySettings?.rccm || '1391CH/N°94C1175/71994'}</span>
              </div>
            </td>
            {/* Droite */}
            <td style={{ ...S.td, paddingLeft: '12px' }}>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '6px', fontWeight: 'normal' }}>
                <span><strong>Date :</strong> {dateStr}</span>
                <span>{timeStr}</span>
              </div>
              <div>
                <strong>Client :</strong>
                <span style={{ marginLeft: '8px', fontWeight: 'bold', fontSize: '11px' }}>
                  {sale.customerName || 'CLIENT DIVERS'}
                </span>
              </div>
              {sale.customerPhone && (
                <div style={{ fontSize: '9px', marginTop: '2px', paddingLeft: '44px' }}>
                  Tél: {sale.customerPhone}
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── LIGNE FACTURE / N° / CAISSE ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '1px solid #000', margin: '4px 0' }}>
        <tbody>
          <tr>
            <td style={{ padding: '3px 4px', width: '30%' }}>
              <span style={{ fontWeight: 'bold', fontStyle: 'italic', fontSize: '16px' }}>Facture</span>
            </td>
            <td style={{ padding: '3px 4px', width: '35%' }}>
              <span style={{ fontWeight: 'bold', fontSize: '11px' }}>N° : {sale.invoiceNumber || 'N/A'}</span>
            </td>
            <td style={{ padding: '3px 4px', width: '35%' }}>
              <span style={{ fontWeight: 'bold' }}>CAISSE : </span>
              <span style={{ fontSize: '10px' }}>{sale.cashier || ''}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── TABLEAU DES ARTICLES ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...S.thCell, width: '13%', textAlign: 'left', borderRight: '1px solid #999' }}>Référence</th>
            <th style={{ ...S.thCell, width: '45%', textAlign: 'left', borderRight: '1px solid #999' }}>Désignation</th>
            <th style={{ ...S.thCell, width: '10%', textAlign: 'center', borderRight: '1px solid #999' }}>Qté</th>
            <th style={{ ...S.thCell, width: '16%', textAlign: 'right', borderRight: '1px solid #999' }}>Prix unitaire</th>
            <th style={{ ...S.thCell, width: '16%', textAlign: 'right' }}>Montant HT</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, idx) => {
            const product = allCashierProducts?.find(p => p.id === item.productId);
            const finalDesignation = item.designation || product?.designation || '';

            return (
            <tr key={idx}>
              <td style={{ ...S.tdCell, borderRight: '1px solid #ddd' }}>
                {item.name || item.sku || `ART${String(item.productId || idx + 1).padStart(4, '0')}`}
              </td>
              <td style={{ ...S.tdCell, borderRight: '1px solid #ddd' }}>
                <div style={{ fontWeight: 'bold' }}>{finalDesignation ? finalDesignation.toUpperCase() : ''}</div>
                {item.storeName && (
                  <div style={{ fontSize: '8px', color: '#555', marginTop: '2px', fontStyle: 'italic' }}>
                    Magasin: {item.storeName}
                  </div>
                )}
              </td>
              <td style={{ ...S.tdCell, borderRight: '1px solid #ddd', textAlign: 'center' }}>
                {parseFloat(item.quantity).toFixed(2)}
              </td>
              <td style={{ ...S.tdCell, borderRight: '1px solid #ddd', textAlign: 'right' }}>
                {parseFloat(item.price).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
              </td>
              <td style={{ ...S.tdCell, textAlign: 'right' }}>
                {(item.price * item.quantity).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            );
          })}
          {/* Lignes vides de remplissage */}
          {Array.from({ length: Math.max(0, 4 - sale.items.length) }).map((_, i) => (
            <tr key={`empty-${i}`} style={{ height: '18px' }}>
              <td style={{ borderBottom: '1px solid #eee', borderRight: '1px solid #ddd' }}></td>
              <td style={{ borderBottom: '1px solid #eee', borderRight: '1px solid #ddd' }}></td>
              <td style={{ borderBottom: '1px solid #eee', borderRight: '1px solid #ddd' }}></td>
              <td style={{ borderBottom: '1px solid #eee', borderRight: '1px solid #ddd' }}></td>
              <td style={{ borderBottom: '1px solid #eee' }}></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── TOTAL ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1.5px solid #000' }}>
        <tbody>
          <tr>
            <td style={{ padding: '4px 6px', width: '50%', fontSize: '10px', fontStyle: 'italic' }}>
              {amountInWords}
            </td>
            <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', fontSize: '10px', borderLeft: '1px solid #000', width: '22%' }}>
              NET A PAYER
            </td>
            <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', fontSize: '11px', borderLeft: '1px solid #000', width: '28%' }}>
              {netTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FCFA
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── SIGNATURES ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1.5px solid #000', marginTop: '4px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '5px 8px', width: '18%', fontWeight: 'bold', fontSize: '10px', borderRight: '1px solid #000', textAlign: 'center' }}>
              CLIENT
            </td>
            <td style={{ padding: '5px 8px', fontSize: '9px', fontStyle: 'italic', textAlign: 'center', borderRight: '1px solid #000' }}>
              Délai de 07 jours pour les articles non livrés; Merci à Bientôt
            </td>
            <td style={{ padding: '5px 8px', width: '18%', fontWeight: 'bold', fontSize: '10px', textAlign: 'center' }}>
              VENDEUR
            </td>
          </tr>
        </tbody>
      </table>

    </div>
  );
};

export default InvoicePrintTemplate;
