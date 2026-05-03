import React from 'react';
import { Modal as AntModal } from 'antd';

const Modal = ({ title, children, onClose, footer }) => {
  return (
    <AntModal
      title={<span className="text-text-heading font-bold uppercase tracking-wider">{title}</span>}
      open={true}
      onCancel={onClose}
      footer={footer}
      centered
      styles={{
        mask: { backdropFilter: 'blur(8px)' },
        content: { 
          background: '#111827', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        },
        header: { background: 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '1rem', marginBottom: '1.5rem' },
        body: { padding: '0' },
        footer: { borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem', marginTop: '1.5rem' }
      }}
    >
      {children}
    </AntModal>
  );
};

export default Modal;
