import React from 'react';
import { Modal as AntModal } from 'antd';

const Modal = ({ title, children, onClose, onOk, footer }) => {
  return (
    <AntModal
      className="custom-modal"
      title={<span className="text-text-heading font-bold uppercase tracking-wider">{title}</span>}
      open={true}
      onCancel={onClose}
      onOk={onOk}
      footer={footer}
      centered
      styles={{
        mask: { backdropFilter: 'blur(8px)' },
        content: { 
          background: 'var(--bg-secondary)', 
          border: '1px solid var(--border-color)',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        },
        header: { background: 'transparent', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' },
        body: { padding: '0' },
        footer: { borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1.5rem' }
      }}
    >
      {children}
    </AntModal>
  );
};

export default Modal;
