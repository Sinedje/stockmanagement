import { useT } from '../../i18n/I18nContext';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CloseOutlined } from '@ant-design/icons';

/**
 * Agrandissement d'une image du catalogue.
 *
 * Rendu par portail sur <body> : les conteneurs animés par `.animate-fade-in`
 * conservent une `transform`, et un ancêtre transformé devient le bloc conteneur
 * des enfants `position: fixed` — la surcouche serait sinon mal positionnée.
 */
const ImageZoom = ({ image, onClose }) => {
  const t = useT();
  useEffect(() => {
    if (!image) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = previous; };
  }, [image, onClose]);

  if (!image) return null;

  return createPortal(
    <div
      role="dialog" aria-modal="true" aria-label={image.name}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 p-8 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <button
        onClick={onClose} aria-label={t('s.fermer')}
        className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-red-500 transition-colors"
      >
        <CloseOutlined style={{ fontSize: 15 }} />
      </button>
      <img src={image.url} alt={image.name} className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl" onClick={e => e.stopPropagation()} />
      <p className="text-white text-[0.9rem] font-medium">{image.name}</p>
    </div>,
    document.body
  );
};

export default ImageZoom;
