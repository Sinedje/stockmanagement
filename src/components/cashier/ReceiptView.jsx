import React from 'react';
import Modal from '../common/Modal';
import InvoicePrintTemplate from './InvoicePrintTemplate';
import { printInvoice } from '../../utils/printInvoice';
import { Printer } from 'lucide-react';
import { Button } from 'antd';

const ReceiptView = ({ sale, onClose }) => (
  <Modal title="Détails de la Facture" onClose={onClose} onOk={onClose} footer={null}>
    <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden">
      <InvoicePrintTemplate sale={sale} />
    </div>

    <div className="flex gap-4">
      <Button 
        className="flex-1 h-12 rounded-xl font-bold uppercase tracking-wider"
        onClick={onClose}
      >
        Fermer
      </Button>
      <Button 
        type="primary"
        className="flex-1 h-12 rounded-xl font-black uppercase tracking-wider shadow-glow"
        icon={<Printer size={16} />}
        onClick={() => printInvoice('invoice-print-area')}
      >
        Réimprimer
      </Button>
    </div>
  </Modal>
);

export default ReceiptView;
