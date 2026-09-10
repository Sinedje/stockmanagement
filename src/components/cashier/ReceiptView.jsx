import { useT } from '../../i18n/I18nContext';
import React from 'react';
import Modal from '../common/Modal';
import InvoicePrintTemplate from './InvoicePrintTemplate';
import { printInvoice } from '../../utils/printInvoice';
import { PrinterOutlined } from '@ant-design/icons';
import { Button } from 'antd';

const ReceiptView = ({ sale, onClose }) => {
  const t = useT();

  return (
  <Modal title={t('s.details_de_la_facture')} onClose={onClose} onOk={onClose} footer={null}>
    <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden">
      <InvoicePrintTemplate sale={sale} />
    </div>

    <div className="flex gap-4">
      <Button className="flex-1" onClick={onClose} >
        {t('s.fermer')}
      </Button>
      <Button type="primary" className="flex-1 shadow-glow" icon={<PrinterOutlined style={{ fontSize: 16 }} />} onClick={() => printInvoice('invoice-print-area')} >
        {t('s.reimprimer')}
      </Button>
    </div>
  </Modal>
  );
};

export default ReceiptView;
