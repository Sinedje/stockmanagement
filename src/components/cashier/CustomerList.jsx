import { useT } from '../../i18n/I18nContext';
import Modal from '../common/Modal';
import React, { useState } from 'react';
import { formatPrice } from '../../context/StoreContext';
import { useCustomers, useSales, useSettings, useStores } from '../../hooks';
import { ArrowLeftOutlined, EyeOutlined, FallOutlined, FileDoneOutlined, PhoneOutlined, PlusOutlined, PrinterOutlined, RiseOutlined, SearchOutlined, TeamOutlined, VerticalAlignBottomOutlined, VerticalAlignTopOutlined, WalletOutlined } from '@ant-design/icons';
import ReceiptView from './ReceiptView';
import { numberToWords } from './InvoicePrintTemplate';
import { Button, InputNumber, Select, Tag, message, Popconfirm } from 'antd';

// --- Deposit / Refund Modal ---
const AccountActionModal = ({ customer, action, onClose, onConfirm }) => {
  const t = useT();
  const [amount, setAmount] = useState(null);
  const [method, setMethod] = useState('Espèces');

  const isDeposit = action === 'deposit';
  const maxRefund = customer?.balance || 0;

  const handleConfirm = () => {
    if (!amount || amount <= 0) {
      message.warning('Veuillez saisir un montant valide.');
      return;
    }
    if (!isDeposit && amount > maxRefund) {
      message.error(`Le solde disponible est insuffisant (${formatPrice(maxRefund)}).`);
      return;
    }
    onConfirm(amount, method);
  };

  return (
    <Modal
      onClose={onClose}
      footer={null}
      title={
        <div className="flex items-center gap-3 py-1">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDeposit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            {isDeposit ? <VerticalAlignBottomOutlined style={{ fontSize: 20 }} /> : <VerticalAlignTopOutlined style={{ fontSize: 20 }} />}
          </div>
          <div>
            <div className="font-black text-text-heading text-lg">{isDeposit ? 'Enregistrer un Dépôt' : 'Remboursement Client'}</div>
            <div className="text-sm text-text-muted font-medium">{customer?.name}</div>
          </div>
        </div>
      }
    >
      <div className="space-y-5 pt-4">
        {!isDeposit && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
            <div className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-1">{t('s.solde_disponible_2')}</div>
            <div className="text-lg font-bold text-amber-600">{formatPrice(maxRefund)}</div>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-2">{t('s.montant_fcfa')}</label>
          <input
            type="number"
            min={1}
            max={isDeposit ? undefined : maxRefund}
            value={amount ?? ''}
            onChange={e => setAmount(e.target.value === '' ? null : parseFloat(e.target.value))}
            placeholder={t('s.ex_10000')}
            className="w-full bg-white dark:bg-black/20 border-2 border-black/15 dark:border-white/10 focus:border-primary rounded-xl px-4 py-3 text-text-heading font-black text-xl focus:outline-none transition-colors"
          />
          {/* Live formatted amount preview */}
          {amount > 0 && (
            <div className={`mt-3 py-3 px-4 rounded-xl text-center text-lg font-bold tracking-tight ${isDeposit ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
              {isDeposit ? '+' : '-'} {formatPrice(amount)}
            </div>
          )}
        </div>

        {isDeposit && (
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-2">{t('s.mode_de_paiement')}</label>
            <Select
              className="w-full"
              size="large"
              value={method}
              onChange={setMethod}
              options={[
                { value: 'Espèces', label: t('s.especes') },
                { value: 'Virement', label: 'Virement Bancaire' },
                { value: 'Chèque', label: t('s.cheque') },
                { value: 'Mobile Money', label: 'Mobile Money' },
              ]}
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button className="flex-1" onClick={onClose}>{t('s.annuler')}</Button>
          <Button type="primary" className={`flex-1 border-none ${isDeposit ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`} onClick={handleConfirm} >
            {isDeposit ? 'Confirmer le Dépôt' : 'Confirmer le Remboursement'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// --- Transaction Type Badge ---
const TxnBadge = ({ type }) => {
  const t = useT();
  const config = {
    deposit:  { color: 'success', label: t('s.depot') },
    purchase: { color: 'processing', label: 'Achat' },
    refund:   { color: 'error', label: 'Remboursement' },
  };
  const { color, label } = config[type] || { color: 'default', label: type };
  return <Tag color={color}>{label}</Tag>;
};

// --- Print Deposit Receipt ---
const printDepositReceipt = (customer, txn, companySettings, stores, t) => {
  const win = window.open('', '_blank');
  if (!win) return;
  const isDeposit = txn.type === 'deposit';
  
  const date = new Date(txn.date);
  const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const saleStore = stores?.find(s => s.id === txn.storeId);
  const agencyName = saleStore ? `AGENCE ${saleStore.name.toUpperCase()}` : 'AGENCE FEU FLAMENCO';

  const amountVal = Math.abs(txn.amount);
  const amountInWords = numberToWords(amountVal);

  const documentTitle = isDeposit ? 'Reçu de Dépôt' : 'Reçu de Remboursement';
  const totalLabel = isDeposit ? 'NET DÉPOSÉ' : 'NET REMBOURSÉ';
  const soldeAvant = customer.balance;
  const soldeApres = customer.balance + txn.amount;

  win.document.write(`
    <html>
      <head>
        <title>${txn.reference}</title>
        <style>
          @page { margin: 5mm; size: A5 landscape; }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 16px;
            background: white;
            color: black;
            font-size: 11px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          * { box-sizing: border-box; }
          .header-table { width: 100%; border-collapse: collapse; border-bottom: 1px solid #000; padding-bottom: 6px; margin-bottom: 4px; }
          .header-table td { padding: 4px 6px; vertical-align: top; }
          .title-table { width: 100%; border-collapse: collapse; border-bottom: 1px solid #000; margin: 4px 0; }
          .title-table td { padding: 3px 4px; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
          .items-table th { 
            padding: 3px 6px; 
            font-weight: bold; 
            font-size: 10px; 
            background: #f0f0f0; 
            border-bottom: 1.5px solid #000; 
            border-top: 1px solid #000;
            text-align: left;
          }
          .items-table td { padding: 3px 6px; font-size: 10px; border-bottom: 1px solid #ddd; }
          .total-table { width: 100%; border-collapse: collapse; border-top: 1.5px solid #000; margin-top: 4px; }
          .total-table td { padding: 4px 6px; vertical-align: top; }
          .signatures-table { width: 100%; border-collapse: collapse; border-top: 1.5px solid #000; margin-top: 4px; }
          .signatures-table td { padding: 5px 8px; text-align: center; }
        </style>
      </head>
      <body>
        <!-- ── EN-TÊTE ── -->
        <table class="header-table">
          <tbody>
            <tr>
              <!-- Gauche -->
              <td style="width: 55%; border-right: 1px solid #000; padding-right: 12px;">
                <div style="font-weight: bold; font-size: 13px;">${companySettings?.name || 'GROUPE T. GRAND ZAO INTER SARL'}</div>
                <div style="font-size: 9.5px; margin-top: 1px;">${companySettings?.activity || 'COMMERCE GENERAL ET PRESTATION DE SERVICES'}</div>
                <div style="font-size: 9.5px; margin-top: 1px; font-weight: bold;">${agencyName}</div>
                <div style="font-size: 9.5px; margin-top: 1px;">TEL : ${companySettings?.phones || '659 146 882 / 672 126 507'}</div>
                <div style="font-size: 9px; margin-top: 3px; display: flex; gap: 24px;">
                  <span>NIU : ${companySettings?.ncc || 'M042318164160W'}</span>
                  <span style="margin-left: 20px;">RCC : ${companySettings?.rccm || '1391CH/N°94C1175/71994'}</span>
                </div>
              </td>
              <!-- Droite -->
              <td style="padding-left: 12px;">
                <div style="display: flex; gap: 20px; margin-bottom: 6px; font-weight: normal;">
                  <span><strong>${t('s.date_2')}</strong> ${dateStr}</span>
                  <span style="margin-left: 15px;">${timeStr}</span>
                </div>
                <div>
                  <strong>${t('s.client_2')}</strong>
                  <span style="margin-left: 8px; font-weight: bold; font-size: 11px;">
                    ${customer.name}
                  </span>
                </div>
                ${customer.phone ? `
                  <div style="font-size: 9px; margin-top: 2px;">
                    Tél: ${customer.phone}
                  </div>
                ` : ''}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- ── LIGNE REÇU / N° / CAISSE ── -->
        <table class="title-table">
          <tbody>
            <tr>
              <td style="width: 30%;">
                <span style="font-weight: bold; font-style: italic; font-size: 16px;">${documentTitle}</span>
              </td>
              <td style="width: 35%;">
                <span style="font-weight: bold; font-size: 11px;">N° : ${txn.reference}</span>
              </td>
              <td style="width: 35%;">
                <span style="font-weight: bold;">{t('s.caisse')} </span>
                <span style="font-size: 10px;">${txn.cashier}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- ── TABLEAU DES DETAILS ── -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 15%; border-right: 1px solid #999;">{t('s.reference')}</th>
              <th style="width: 45%; border-right: 1px solid #999;">{t('s.designation')}</th>
              <th style="width: 10%; border-right: 1px solid #999; text-align: center;">{t('s.qte')}</th>
              <th style="width: 15%; border-right: 1px solid #999; text-align: right;">{t('s.prix_unitaire')}</th>
              <th style="width: 15%; text-align: right;">{t('s.montant_ht')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border-right: 1px solid #ddd;">${txn.reference}</td>
              <td style="border-right: 1px solid #ddd; font-weight: bold;">
                ${(isDeposit ? 'DÉPÔT SUR COMPTE CLIENT' : 'REMBOURSEMENT COMPTE CLIENT')}
              </td>
              <td style="border-right: 1px solid #ddd; text-align: center;">1.00</td>
              <td style="border-right: 1px solid #ddd; text-align: right;">
                ${amountVal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
              </td>
              <td style="text-align: right;">
                ${amountVal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <!-- Lignes vides pour correspondre au design de la facture -->
            <tr style="height: 18px;">
              <td style="border-bottom: 1px solid #eee; border-right: 1px solid #ddd;"></td>
              <td style="border-bottom: 1px solid #eee; border-right: 1px solid #ddd;"></td>
              <td style="border-bottom: 1px solid #eee; border-right: 1px solid #ddd;"></td>
              <td style="border-bottom: 1px solid #eee; border-right: 1px solid #ddd;"></td>
              <td style="border-bottom: 1px solid #eee;"></td>
            </tr>
            <tr style="height: 18px;">
              <td style="border-bottom: 1px solid #eee; border-right: 1px solid #ddd;"></td>
              <td style="border-bottom: 1px solid #eee; border-right: 1px solid #ddd;"></td>
              <td style="border-bottom: 1px solid #eee; border-right: 1px solid #ddd;"></td>
              <td style="border-bottom: 1px solid #eee; border-right: 1px solid #ddd;"></td>
              <td style="border-bottom: 1px solid #eee;"></td>
            </tr>
            <tr style="height: 18px;">
              <td style="border-bottom: 1px solid #eee; border-right: 1px solid #ddd;"></td>
              <td style="border-bottom: 1px solid #eee; border-right: 1px solid #ddd;"></td>
              <td style="border-bottom: 1px solid #eee; border-right: 1px solid #ddd;"></td>
              <td style="border-bottom: 1px solid #eee; border-right: 1px solid #ddd;"></td>
              <td style="border-bottom: 1px solid #eee;"></td>
            </tr>
          </tbody>
        </table>

        <!-- ── TOTAL & SOLDE INFO ── -->
        <table class="total-table">
          <tbody>
            <tr>
              <td style="width: 50%; font-size: 10px;">
                <div style="font-style: italic; margin-bottom: 4px;">${amountInWords}</div>
                <div style="border-top: 1px dashed #ddd; padding-top: 4px; color: #333;">
                  <strong>{t('s.solde_avant')}</strong> ${formatPrice(soldeAvant)} &nbsp;&nbsp;|&nbsp;&nbsp; 
                  <strong>{t('s.nouveau_solde')}</strong> ${formatPrice(soldeApres)}
                  ${isDeposit ? `&nbsp;&nbsp;|&nbsp;&nbsp; <strong>{t('s.mode_2')}</strong> ${txn.method}` : ''}
                </div>
              </td>
              <td style="text-align: right; font-weight: bold; font-size: 10px; border-left: 1px solid #000; width: 22%; padding-top: 8px;">
                ${totalLabel}
              </td>
              <td style="text-align: right; font-weight: bold; font-size: 11px; border-left: 1px solid #000; width: 28%; padding-top: 8px;">
                ${amountVal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FCFA
              </td>
            </tr>
          </tbody>
        </table>

        <!-- ── SIGNATURES ── -->
        <table class="signatures-table">
          <tbody>
            <tr>
              <td style="width: 18%; font-weight: bold; font-size: 10px; border-right: 1px solid #000;">
                {t('s.client_3')}
              </td>
              <td style="font-size: 9px; font-style: italic;">
                {t('s.merci_de_conserver_ce_recu')}
              </td>
              <td style="width: 18%; font-weight: bold; font-size: 10px; border-left: 1px solid #000;">
                VENDEUR
              </td>
            </tr>
          </tbody>
        </table>

        <script>
          setTimeout(() => {
            window.print();
            window.close();
          }, 300);
        </script>
      </body>
    </html>
  `);
  win.document.close();
};

const InvoicePaymentModal = ({ sale, onClose }) => {
  const t = useT();
  const { recordInvoicePayment } = useSales();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Espèces');

  const handlePay = () => {
    const val = parseFloat(amount) || 0;
    if (val <= 0 || val > sale.amountDue) {
      message.error("Montant invalide.");
      return;
    }
    recordInvoicePayment(sale.id, val, method);
    message.success("Paiement enregistré avec succès.");
    onClose();
  };

  return (
    <Modal onClose={onClose} footer={null} title={`Paiement facture ${sale.invoiceNumber}`}>
      <div className="space-y-5 pt-4">
        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl space-y-2 text-sm">
          <div className="flex justify-between font-bold">
            <span className="text-text-muted">{t('s.total_facture_3')}</span> <span className="text-text-heading">{formatPrice(sale.total)}</span>
          </div>
          <div className="flex justify-between font-bold text-emerald-500">
            <span>{t('s.deja_paye')}</span> <span>{formatPrice(sale.amountPaid ?? sale.total)}</span>
          </div>
          <div className="flex justify-between font-black text-red-500 text-lg pt-2 border-t border-black/10 dark:border-white/10 mt-2">
            <span>{t('s.reste_a_solder')}</span> <span>{formatPrice(sale.amountDue || 0)}</span>
          </div>
        </div>
        
        <div>
          <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-2">{t('s.montant_verse_aujourd_hui')}</label>
          <InputNumber
            className="w-full" size="large" min={1} max={sale.amountDue}
            value={amount} onChange={setAmount}
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
            placeholder="0" suffix="FCFA"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-2">{t('s.mode')}</label>
          <Select
            className="w-full" size="large" value={method} onChange={setMethod}
            options={[
              { value: 'Espèces', label: t('s.especes') },
              { value: 'Carte', label: t('s.carte') },
              { value: 'Mobile Money', label: 'Mobile Money' },
            ]}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button className="flex-1" onClick={onClose}>{t('s.annuler')}</Button>
          <Button type="primary" className="flex-1 bg-primary border-none text-white" onClick={handlePay}>{t('s.valider_le_paiement')}</Button>
        </div>
      </div>
    </Modal>
  );
};

// ========= MAIN COMPONENT =========
const CustomerList = () => {
  const t = useT();
  const { customers, customerTransactions, addCustomer, addCustomerDeposit, refundCustomer } = useCustomers();
  const { sales } = useSales();
  const { companySettings } = useSettings();
  const { stores } = useStores();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [actionModal, setActionModal] = useState(null); // 'deposit' | 'refund'
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '' });

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || '').includes(searchTerm)
  );

  const getCustomerTxns = (customerId) =>
    customerTransactions.filter(t => t.customerId === customerId).sort((a, b) => new Date(b.date) - new Date(a.date));

  const getCustomerInvoices = (customer) =>
    sales.filter(s => s.customerId === customer.id || (s.customerName === customer.name && s.customerPhone === customer.phone)).sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleConfirmAction = (amount, method) => {
    const customerId = selectedCustomer.id;
    let txn;
    if (actionModal === 'deposit') {
      txn = addCustomerDeposit(customerId, amount, method);
      // Update local selectedCustomer so UI reflects immediately
      setSelectedCustomer(prev => ({ ...prev, balance: prev.balance + amount }));
      message.success(`Dépôt de ${formatPrice(amount)} enregistré !`);
    } else {
      txn = refundCustomer(customerId, amount);
      if (!txn) { message.error('Remboursement impossible.'); return; }
      setSelectedCustomer(prev => ({ ...prev, balance: prev.balance - amount }));
      message.success(`Remboursement de ${formatPrice(amount)} effectué !`);
    }
    // Print receipt
    if (txn) printDepositReceipt(selectedCustomer, txn, companySettings, stores, t);
    setActionModal(null);
  };

  const handleCreateCustomer = () => {
    if (!newCustomerForm.name.trim()) { message.warning('Le nom est requis.'); return; }
    addCustomer(newCustomerForm);
    message.success('Client créé avec succès !');
    setShowNewCustomerModal(false);
    setNewCustomerForm({ name: '', phone: '' });
  };

  // ---- Customer Detail View ----
  if (selectedCustomer) {
    const txns = getCustomerTxns(selectedCustomer.id);
    const invoices = getCustomerInvoices(selectedCustomer);

    return (
      <div className="space-y-6 animate-fade-in">
        <button
          onClick={() => setSelectedCustomer(null)}
          className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors font-bold uppercase text-[0.7rem] tracking-widest"
        >
          <ArrowLeftOutlined style={{ fontSize: 16 }} /> {t('s.retour_a_la_liste')}
        </button>

        {/* Customer Header Card */}
        <div className="glass-panel rounded-xl p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <TeamOutlined style={{ fontSize: 32 }} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-text-heading tracking-tight">{selectedCustomer.name}</h2>
              {selectedCustomer.phone && (
                <div className="flex items-center gap-2 text-text-muted text-sm mt-1">
                  <PhoneOutlined style={{ fontSize: 14 }} /> {selectedCustomer.phone}
                </div>
              )}
            </div>
            {/* Balance widget */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl px-6 py-4 text-center min-w-[180px]">
              <div className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                <WalletOutlined style={{ fontSize: 12 }} /> {t('s.solde_disponible')}
              </div>
              <div className={`text-lg font-bold ${selectedCustomer.balance > 0 ? 'text-emerald-500' : 'text-text-muted'}`}>
                {formatPrice(selectedCustomer.balance)}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-black/5 dark:border-white/5">
            <Button icon={<VerticalAlignBottomOutlined style={{ fontSize: 16 }} />} className="flex-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50" onClick={() => setActionModal('deposit')} >
              {t('s.faire_un_depot')}
            </Button>
            <Button icon={<VerticalAlignTopOutlined style={{ fontSize: 16 }} />} className="flex-1 border-red-400 text-red-500 hover:bg-red-50" onClick={() => setActionModal('refund')} disabled={selectedCustomer.balance <= 0} >
              Remboursement
            </Button>
          </div>
        </div>

        {/* Transactions History */}
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-heading uppercase tracking-widest mb-4 flex items-center gap-2">
            <WalletOutlined style={{ fontSize: 16 }} className="text-primary" /> {t('s.mouvements_du_compte')}
          </h3>
          {txns.length === 0 ? (
            <div className="text-center py-12 text-text-muted opacity-40">
              <WalletOutlined style={{ fontSize: 32 }} className="mx-auto mb-2" />
              <p className="text-sm font-semibold">{t('s.aucun_mouvement_enregistre')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {txns.map(txn => (
                <div key={txn.id} className="flex items-center justify-between p-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${txn.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : txn.type === 'refund' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {txn.type === 'deposit' ? <RiseOutlined style={{ fontSize: 16 }} /> : txn.type === 'refund' ? <FallOutlined style={{ fontSize: 16 }} /> : <FileDoneOutlined style={{ fontSize: 16 }} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <TxnBadge type={txn.type} />
                        <span className="text-xs text-text-muted font-mono">{txn.reference}</span>
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {new Date(txn.date).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })} · {txn.cashier}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-base font-black ${txn.amount >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {txn.amount >= 0 ? '+' : ''}{formatPrice(Math.abs(txn.amount))}
                    </div>
                    {(txn.type === 'deposit' || txn.type === 'refund') && (
                      <button
                        onClick={() => {
                          printDepositReceipt(selectedCustomer, txn, companySettings, stores, t);
                        }}
                        className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 text-text-muted hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-all"
                        title={t('s.imprimer_le_recu')}
                      >
                        <PrinterOutlined style={{ fontSize: 14 }} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoice History */}
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-heading uppercase tracking-widest mb-4 flex items-center gap-2">
            <FileDoneOutlined style={{ fontSize: 16 }} className="text-primary" /> {t('s.historique_des_factures')}
          </h3>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-text-muted opacity-40">
              <FileDoneOutlined style={{ fontSize: 32 }} className="mx-auto mb-2" />
              <p className="text-sm font-semibold">{t('s.aucune_facture')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map(invoice => (
                <div key={invoice.id} className="flex items-center justify-between p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent hover:border-primary/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="text-[0.75rem] font-semibold text-primary tracking-widest bg-primary/10 px-2 py-1 rounded-lg">{invoice.invoiceNumber}</div>
                    <div>
                      <div className="text-sm font-bold text-text-heading">
                        {new Date(invoice.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="text-[0.7rem] text-text-muted">{invoice.paymentMethod}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right flex flex-col items-end">
                      <div className="text-sm font-semibold text-text-heading">{formatPrice(invoice.total)}</div>
                      {(invoice.amountDue > 0) && (
                        <div className="text-[0.65rem] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded mt-1">Reste: {formatPrice(invoice.amountDue)}</div>
                      )}
                    </div>
                    {invoice.amountDue > 0 && (
                      <button
                        onClick={() => setPaymentInvoice(invoice)}
                        className="h-10 px-3 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all duration-300 text-[0.7rem] font-semibold tracking-widest uppercase"
                      >
                        Payer
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedInvoice(invoice)}
                      className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                    >
                      <EyeOutlined style={{ fontSize: 18 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedInvoice && <ReceiptView sale={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}

        {actionModal && (
          <AccountActionModal
            customer={selectedCustomer}
            action={actionModal}
            onClose={() => setActionModal(null)}
            onConfirm={handleConfirmAction}
          />
        )}
        
        {paymentInvoice && (
          <InvoicePaymentModal sale={paymentInvoice} onClose={() => setPaymentInvoice(null)} />
        )}
      </div>
    );
  }

  // ---- Customer List View ----
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <SearchOutlined style={{ fontSize: 18 }} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-50" />
          <input
            className="w-full bg-bg-secondary border border-black/10 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 text-[0.9rem] text-text-heading placeholder-text-muted/40 focus:outline-none focus:border-primary/50 transition-all shadow-sm"
            placeholder={t('s.rechercher_un_client')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button type="primary" icon={<PlusOutlined style={{ fontSize: 16 }} />} onClick={() => setShowNewCustomerModal(true)} >
          {t('s.nouveau_client_2')}
        </Button>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 opacity-40 gap-4">
          <TeamOutlined style={{ fontSize: 48 }} className="text-text-muted" />
          <p className="text-text-secondary font-semibold">{t('s.aucun_client_trouve')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => (
            <div
              key={customer.id}
              className="glass-panel rounded-xl p-4 hover:shadow-sm hover:border-primary/20 transition-all group cursor-pointer"
              onClick={() => setSelectedCustomer(customer)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <TeamOutlined style={{ fontSize: 24 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-text-heading truncate tracking-tight">{customer.name}</h3>
                  <p className="text-[0.75rem] text-text-muted font-medium">{customer.phone || 'Sans téléphone'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-black/5 dark:border-white/5">
                <div>
                  <div className="text-[0.6rem] font-semibold text-text-muted uppercase tracking-widest mb-0.5">{t('s.total_achats')}</div>
                  <div className="text-sm font-semibold text-primary">{formatPrice(customer.totalSpent)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[0.6rem] font-semibold text-text-muted uppercase tracking-widest mb-0.5 flex items-center justify-end gap-1">
                    <WalletOutlined style={{ fontSize: 10 }} /> {t('s.solde')}
                  </div>
                  <div className={`text-sm font-semibold ${customer.balance > 0 ? 'text-emerald-500' : 'text-text-muted'}`}>
                    {formatPrice(customer.balance)}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center py-2 rounded-lg bg-black/5 dark:bg-white/5 text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-colors">
                {t('s.voir_le_compte')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Customer Modal */}
      <Modal
        title={t('s.nouveau_client')}
        open={showNewCustomerModal}
        onClose={() => setShowNewCustomerModal(false)}
        footer={null}
      >
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-2">{t('s.nom_complet_3')}</label>
            <input
              className="w-full bg-bg-secondary border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-text-heading focus:outline-none focus:border-primary/50 transition-all"
              placeholder={t('s.ex_jean_dupont')}
              value={newCustomerForm.name}
              onChange={e => setNewCustomerForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-2">{t('s.telephone')}</label>
            <input
              className="w-full bg-bg-secondary border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-text-heading focus:outline-none focus:border-primary/50 transition-all"
              placeholder={t('s.ex_06_00_00_00_00')}
              value={newCustomerForm.phone}
              onChange={e => setNewCustomerForm(p => ({ ...p, phone: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={() => setShowNewCustomerModal(false)}>{t('s.annuler')}</Button>
            <Button type="primary" className="flex-1" onClick={handleCreateCustomer}>
              {t('s.creer_le_client')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerList;
