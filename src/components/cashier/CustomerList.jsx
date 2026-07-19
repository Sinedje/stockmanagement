import React, { useState } from 'react';
import { useStore, formatPrice } from '../../context/StoreContext';
import { Users, Search, Eye, ArrowLeft, Receipt, Plus, TrendingUp, TrendingDown, Wallet, ArrowDownToLine, ArrowUpFromLine, Phone } from 'lucide-react';
import ReceiptView from './ReceiptView';
import { Button, Modal, InputNumber, Select, Tag, message, Popconfirm } from 'antd';

// --- Deposit / Refund Modal ---
const AccountActionModal = ({ customer, action, onClose, onConfirm }) => {
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
      open={true}
      onCancel={onClose}
      footer={null}
      title={
        <div className="flex items-center gap-3 py-1">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDeposit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            {isDeposit ? <ArrowDownToLine size={20} /> : <ArrowUpFromLine size={20} />}
          </div>
          <div>
            <div className="font-black text-text-heading text-lg">{isDeposit ? 'Enregistrer un Dépôt' : 'Remboursement Client'}</div>
            <div className="text-sm text-text-muted font-medium">{customer?.name}</div>
          </div>
        </div>
      }
      destroyOnClose
    >
      <div className="space-y-5 pt-4">
        {!isDeposit && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
            <div className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">Solde disponible</div>
            <div className="text-2xl font-black text-amber-600">{formatPrice(maxRefund)}</div>
          </div>
        )}

        <div>
          <label className="text-xs font-black text-text-muted uppercase tracking-widest block mb-2">Montant (FCFA)</label>
          <input
            type="number"
            min={1}
            max={isDeposit ? undefined : maxRefund}
            value={amount ?? ''}
            onChange={e => setAmount(e.target.value === '' ? null : parseFloat(e.target.value))}
            placeholder="Ex: 10000"
            className="w-full bg-white dark:bg-black/20 border-2 border-black/15 dark:border-white/10 focus:border-primary rounded-xl px-4 py-3 text-text-heading font-black text-xl focus:outline-none transition-colors"
          />
          {/* Live formatted amount preview */}
          {amount > 0 && (
            <div className={`mt-3 py-3 px-4 rounded-xl text-center text-2xl font-black tracking-tight ${isDeposit ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
              {isDeposit ? '+' : '-'} {formatPrice(amount)}
            </div>
          )}
        </div>

        {isDeposit && (
          <div>
            <label className="text-xs font-black text-text-muted uppercase tracking-widest block mb-2">Mode de paiement</label>
            <Select
              className="w-full"
              size="large"
              value={method}
              onChange={setMethod}
              options={[
                { value: 'Espèces', label: 'Espèces' },
                { value: 'Virement', label: 'Virement Bancaire' },
                { value: 'Chèque', label: 'Chèque' },
                { value: 'Mobile Money', label: 'Mobile Money' },
              ]}
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button className="flex-1 h-11 rounded-xl font-bold" onClick={onClose}>Annuler</Button>
          <Button
            type="primary"
            className={`flex-1 h-11 rounded-xl font-bold border-none ${isDeposit ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
            onClick={handleConfirm}
          >
            {isDeposit ? 'Confirmer le Dépôt' : 'Confirmer le Remboursement'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// --- Transaction Type Badge ---
const TxnBadge = ({ type }) => {
  const config = {
    deposit:  { color: 'success', label: 'Dépôt' },
    purchase: { color: 'processing', label: 'Achat' },
    refund:   { color: 'error', label: 'Remboursement' },
  };
  const { color, label } = config[type] || { color: 'default', label: type };
  return <Tag color={color}>{label}</Tag>;
};

// --- Print Deposit Receipt ---
const printDepositReceipt = (customer, txn, storeName = 'STOCK EXPERT') => {
  const win = window.open('', '_blank');
  const isDeposit = txn.type === 'deposit';
  win.document.write(`
    <html><head><title>${txn.reference}</title>
    <style>
      body { font-family: monospace; padding: 40px; max-width: 320px; margin: auto; }
      h2 { text-align: center; margin-bottom: 4px; }
      .sub { text-align: center; font-size: 11px; opacity: 0.6; margin-bottom: 20px; }
      .row { display: flex; justify-content: space-between; margin: 6px 0; }
      .divider { border-top: 1px dashed #000; margin: 12px 0; }
      .total { font-size: 18px; font-weight: bold; text-align: center; margin: 16px 0; }
      .footer { text-align: center; margin-top: 24px; font-size: 11px; }
      .sig { border-top: 1px solid #000; margin-top: 50px; padding-top: 6px; font-size: 11px; }
    </style></head>
    <body>
      <h2>${storeName}</h2>
      <div class="sub">${new Date(txn.date).toLocaleString('fr-FR')}</div>
      <div class="divider"></div>
      <div class="row"><span>Réf:</span><span>${txn.reference}</span></div>
      <div class="row"><span>Client:</span><span>${customer.name}</span></div>
      ${customer.phone ? `<div class="row"><span>Téléphone:</span><span>${customer.phone}</span></div>` : ''}
      <div class="row"><span>Caissier:</span><span>${txn.cashier}</span></div>
      <div class="divider"></div>
      <div class="total">${isDeposit ? 'DÉPÔT' : 'REMBOURSEMENT'}: ${formatPrice(Math.abs(txn.amount))}</div>
      ${isDeposit ? `<div class="row"><span>Mode:</span><span>${txn.method}</span></div>` : ''}
      <div class="divider"></div>
      <div class="row"><span>Solde avant:</span><span>${formatPrice(customer.balance + (isDeposit ? 0 : txn.amount))}</span></div>
      <div class="footer">Merci de conserver ce reçu</div>
      <div class="sig">Signature client</div>
      <script>window.onload = () => window.print();</script>
    </body></html>
  `);
  win.document.close();
};

const InvoicePaymentModal = ({ sale, onClose }) => {
  const { recordInvoicePayment } = useStore();
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
    <Modal open={true} onCancel={onClose} footer={null} title={<span className="font-black text-text-heading text-xl">Paiement Facture {sale.invoiceNumber}</span>} destroyOnClose>
      <div className="space-y-5 pt-4">
        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl space-y-2 text-sm">
          <div className="flex justify-between font-bold">
            <span className="text-text-muted">Total facture:</span> <span className="text-text-heading">{formatPrice(sale.total)}</span>
          </div>
          <div className="flex justify-between font-bold text-emerald-500">
            <span>Déjà payé:</span> <span>{formatPrice(sale.amountPaid ?? sale.total)}</span>
          </div>
          <div className="flex justify-between font-black text-red-500 text-lg pt-2 border-t border-black/10 dark:border-white/10 mt-2">
            <span>Reste à solder:</span> <span>{formatPrice(sale.amountDue || 0)}</span>
          </div>
        </div>
        
        <div>
          <label className="text-xs font-black text-text-muted uppercase tracking-widest block mb-2">Montant versé aujourd'hui</label>
          <InputNumber
            className="w-full" size="large" min={1} max={sale.amountDue}
            value={amount} onChange={setAmount}
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
            placeholder="0" suffix="FCFA"
          />
        </div>
        <div>
          <label className="text-xs font-black text-text-muted uppercase tracking-widest block mb-2">Mode</label>
          <Select
            className="w-full" size="large" value={method} onChange={setMethod}
            options={[
              { value: 'Espèces', label: 'Espèces' },
              { value: 'Carte', label: 'Carte' },
              { value: 'Mobile Money', label: 'Mobile Money' },
            ]}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button className="flex-1 h-11 rounded-xl font-bold" onClick={onClose}>Annuler</Button>
          <Button type="primary" className="flex-1 h-11 rounded-xl font-bold bg-primary border-none text-black" onClick={handlePay}>Valider le Paiement</Button>
        </div>
      </div>
    </Modal>
  );
};

// ========= MAIN COMPONENT =========
const CustomerList = () => {
  const { customers, customerTransactions, sales, addCustomer, addCustomerDeposit, refundCustomer } = useStore();
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
    if (txn) printDepositReceipt(selectedCustomer, txn);
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
          <ArrowLeft size={16} /> Retour à la liste
        </button>

        {/* Customer Header Card */}
        <div className="bg-bg-card border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Users size={32} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-text-heading tracking-tight">{selectedCustomer.name}</h2>
              {selectedCustomer.phone && (
                <div className="flex items-center gap-2 text-text-muted text-sm mt-1">
                  <Phone size={14} /> {selectedCustomer.phone}
                </div>
              )}
            </div>
            {/* Balance widget */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl px-6 py-4 text-center min-w-[180px]">
              <div className="text-[0.65rem] font-black text-text-muted uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                <Wallet size={12} /> Solde Disponible
              </div>
              <div className={`text-2xl font-black ${selectedCustomer.balance > 0 ? 'text-emerald-500' : 'text-text-muted'}`}>
                {formatPrice(selectedCustomer.balance)}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-black/5 dark:border-white/5">
            <Button
              icon={<ArrowDownToLine size={16} />}
              className="flex-1 h-11 rounded-xl font-bold border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              onClick={() => setActionModal('deposit')}
            >
              Faire un Dépôt
            </Button>
            <Button
              icon={<ArrowUpFromLine size={16} />}
              className="flex-1 h-11 rounded-xl font-bold border-red-400 text-red-500 hover:bg-red-50"
              onClick={() => setActionModal('refund')}
              disabled={selectedCustomer.balance <= 0}
            >
              Remboursement
            </Button>
          </div>
        </div>

        {/* Transactions History */}
        <div className="bg-bg-card border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-black text-text-heading uppercase tracking-widest mb-4 flex items-center gap-2">
            <Wallet size={16} className="text-primary" /> Mouvements du Compte
          </h3>
          {txns.length === 0 ? (
            <div className="text-center py-12 text-text-muted opacity-40">
              <Wallet size={32} className="mx-auto mb-2" />
              <p className="text-sm font-semibold">Aucun mouvement enregistré</p>
            </div>
          ) : (
            <div className="space-y-2">
              {txns.map(txn => (
                <div key={txn.id} className="flex items-center justify-between p-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${txn.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : txn.type === 'refund' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {txn.type === 'deposit' ? <TrendingUp size={16} /> : txn.type === 'refund' ? <TrendingDown size={16} /> : <Receipt size={16} />}
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
                  <div className={`text-base font-black ${txn.amount >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {txn.amount >= 0 ? '+' : ''}{formatPrice(Math.abs(txn.amount))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoice History */}
        <div className="bg-bg-card border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-black text-text-heading uppercase tracking-widest mb-4 flex items-center gap-2">
            <Receipt size={16} className="text-primary" /> Historique des Factures
          </h3>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-text-muted opacity-40">
              <Receipt size={32} className="mx-auto mb-2" />
              <p className="text-sm font-semibold">Aucune facture</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map(invoice => (
                <div key={invoice.id} className="flex items-center justify-between p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent hover:border-primary/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="text-[0.75rem] font-black text-primary tracking-widest bg-primary/10 px-2 py-1 rounded-lg">{invoice.invoiceNumber}</div>
                    <div>
                      <div className="text-sm font-bold text-text-heading">
                        {new Date(invoice.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="text-[0.7rem] text-text-muted">{invoice.paymentMethod}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right flex flex-col items-end">
                      <div className="text-sm font-black text-text-heading">{formatPrice(invoice.total)}</div>
                      {(invoice.amountDue > 0) && (
                        <div className="text-[0.65rem] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded mt-1">Reste: {formatPrice(invoice.amountDue)}</div>
                      )}
                    </div>
                    {invoice.amountDue > 0 && (
                      <button
                        onClick={() => setPaymentInvoice(invoice)}
                        className="h-10 px-3 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all duration-300 text-[0.7rem] font-black tracking-widest uppercase"
                      >
                        Payer
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedInvoice(invoice)}
                      className="w-10 h-10 rounded-lg bg-primary text-black flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                    >
                      <Eye size={18} strokeWidth={2.5} />
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
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-50" />
          <input
            className="w-full bg-bg-secondary border border-black/10 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 text-[0.9rem] text-text-heading placeholder-text-muted/40 focus:outline-none focus:border-primary/50 transition-all shadow-sm"
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => setShowNewCustomerModal(true)}
          className="h-11 px-6 rounded-xl font-bold shadow-lg shadow-primary/20"
        >
          Nouveau Client
        </Button>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 opacity-40 gap-4">
          <Users size={48} strokeWidth={1.5} className="text-text-muted" />
          <p className="text-text-secondary font-semibold">Aucun client trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => (
            <div
              key={customer.id}
              className="bg-bg-card border border-black/5 dark:border-white/5 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:border-primary/20 transition-all group cursor-pointer"
              onClick={() => setSelectedCustomer(customer)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-text-heading truncate tracking-tight">{customer.name}</h3>
                  <p className="text-[0.75rem] text-text-muted font-medium">{customer.phone || 'Sans téléphone'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-black/5 dark:border-white/5">
                <div>
                  <div className="text-[0.6rem] font-black text-text-muted uppercase tracking-widest mb-0.5">Total Achats</div>
                  <div className="text-sm font-black text-primary">{formatPrice(customer.totalSpent)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[0.6rem] font-black text-text-muted uppercase tracking-widest mb-0.5 flex items-center justify-end gap-1">
                    <Wallet size={10} /> Solde
                  </div>
                  <div className={`text-sm font-black ${customer.balance > 0 ? 'text-emerald-500' : 'text-text-muted'}`}>
                    {formatPrice(customer.balance)}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center py-2 rounded-lg bg-black/5 dark:bg-white/5 text-[0.65rem] font-black text-text-muted uppercase tracking-widest group-hover:bg-primary group-hover:text-black transition-colors">
                Voir le compte
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Customer Modal */}
      <Modal
        title={<span className="font-black text-text-heading text-xl">Nouveau Client</span>}
        open={showNewCustomerModal}
        onCancel={() => setShowNewCustomerModal(false)}
        footer={null}
        destroyOnClose
      >
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-xs font-black text-text-muted uppercase tracking-widest block mb-2">Nom complet *</label>
            <input
              className="w-full bg-bg-secondary border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-text-heading focus:outline-none focus:border-primary/50 transition-all"
              placeholder="Ex: Jean Dupont"
              value={newCustomerForm.name}
              onChange={e => setNewCustomerForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-black text-text-muted uppercase tracking-widest block mb-2">Téléphone</label>
            <input
              className="w-full bg-bg-secondary border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-text-heading focus:outline-none focus:border-primary/50 transition-all"
              placeholder="Ex: 06 00 00 00 00"
              value={newCustomerForm.phone}
              onChange={e => setNewCustomerForm(p => ({ ...p, phone: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button className="flex-1 h-11 rounded-xl font-bold" onClick={() => setShowNewCustomerModal(false)}>Annuler</Button>
            <Button type="primary" className="flex-1 h-11 rounded-xl font-bold" onClick={handleCreateCustomer}>
              Créer le Client
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerList;
