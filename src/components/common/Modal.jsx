import React from 'react';
import { Modal as AntModal, Button } from 'antd';
import { CheckOutlined } from '@ant-design/icons';

/**
 * Fenêtre modale unique de l'application.
 *
 * Tous les écrans passent par ici plutôt que d'utiliser `Modal` d'Ant Design
 * directement : l'habillage (surface vitrée, rayons, bordures, thème clair/sombre)
 * reste ainsi défini à un seul endroit.
 */
const Modal = ({
  title,
  children,
  onClose,
  onOk,
  okText = 'Valider',
  cancelText = 'Annuler',
  okDisabled = false,
  confirmLoading = false,
  okButtonProps,
  cancelButtonProps,
  footer,
  width = 520,
  open = true,
  ...rest
}) => {
  // `footer === null` masque le pied ; `undefined` produit le pied standard.
  const resolvedFooter =
    footer !== undefined
      ? footer
      : onOk
        ? [
            <Button key="cancel" onClick={onClose} {...cancelButtonProps}>{cancelText}</Button>,
            <Button key="ok" type="primary" onClick={onOk} disabled={okDisabled} loading={confirmLoading} {...okButtonProps}>
              {okText}
            </Button>,
          ]
        : null;

  return (
    <AntModal
      className="custom-modal"
      // Un titre texte reçoit l'habillage standard ; un titre déjà composé en JSX
      // passe tel quel (l'envelopper dans un <span> imbriquerait un <div> dedans).
      title={typeof title === 'string'
        ? <span className="text-text-heading font-semibold text-[0.95rem]">{title}</span>
        : (title || null)}
      open={open}
      onCancel={onClose}
      footer={resolvedFooter}
      centered
      width={width}
      destroyOnHidden
      styles={{
        mask: { backdropFilter: 'blur(6px)', background: 'rgba(10, 15, 25, 0.45)' },
        content: {
          background: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
          WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
          border: '1px solid var(--glass-border)',
          borderRadius: '0.85rem',
          boxShadow: 'var(--glass-shadow), inset 0 1px 0 0 var(--glass-highlight)',
          maxHeight: 'calc(100vh - 2rem)',
          overflowY: 'auto',
          padding: '1.1rem 1.25rem',
        },
        header: { background: 'transparent', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.7rem', marginBottom: '1rem' },
        body: { padding: 0 },
        footer: { borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '1rem' },
      }}
      {...rest}
    >
      {children}
    </AntModal>
  );
};

/**
 * Modale de sélection : une liste d'options à choisir, au lieu d'un `<select>`
 * natif dont l'apparence échappe au thème.
 *
 * `options` : [{ value, label, description?, icon?, disabled? }]
 */
export const SelectModal = ({
  title = 'Sélectionner',
  options = [],
  value,
  onSelect,
  onClose,
  emptyText = 'Aucune option disponible',
  ...rest
}) => (
  <Modal title={title} onClose={onClose} footer={null} width={420} {...rest}>
    {options.length === 0 ? (
      <p className="py-8 text-center text-[0.8rem] text-text-muted">{emptyText}</p>
    ) : (
      <ul className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto custom-scrollbar -mx-1 px-1">
        {options.map(opt => {
          const active = opt.value === value;
          return (
            <li key={opt.value}>
              <button
                type="button"
                disabled={opt.disabled}
                onClick={() => { onSelect?.(opt.value, opt); onClose?.(); }}
                aria-current={active ? 'true' : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${active
                    ? 'bg-primary/10 text-primary border border-primary/25'
                    : 'border border-transparent text-text-primary hover:bg-black/5 dark:hover:bg-white/5'}`}
              >
                {opt.icon && <opt.icon size={15} className="shrink-0 opacity-70" />}
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.82rem] font-medium truncate">{opt.label}</span>
                  {opt.description && (
                    <span className="block text-[0.7rem] text-text-muted truncate">{opt.description}</span>
                  )}
                </span>
                {active && <CheckOutlined style={{ fontSize: 15 }} className="shrink-0" />}
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </Modal>
);

export default Modal;
