import React from 'react';
import { Modal as AntModal } from 'antd';

const Modal = ({ title, children, onClose, onOk, footer, width = 560 }) => {
  return (
    <AntModal
      className="custom-modal"
      title={<span className="text-text-heading font-bold uppercase tracking-wider">{title}</span>}
      open={true}
      onCancel={onClose}
      onOk={onOk}
      footer={footer}
      centered
      width={width}
      styles={{
        mask: { backdropFilter: 'blur(8px)', background: 'rgba(10, 15, 25, 0.4)' },
        content: {
          background: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
          WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
          border: '1px solid var(--glass-border)',
          borderRadius: '1.25rem',
          boxShadow: 'var(--glass-shadow), inset 0 1px 0 0 var(--glass-highlight)',
          maxHeight: 'calc(100vh - 2rem)',
          overflowY: 'auto'
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
