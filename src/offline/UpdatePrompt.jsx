import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { CloudDownloadOutlined } from '@ant-design/icons';

/**
 * Invitation à installer une nouvelle version.
 *
 * `registerType: 'prompt'` plutôt qu'une mise à jour automatique : recharger
 * l'application sans prévenir, au milieu d'un encaissement, ferait perdre le
 * panier en cours. C'est à la caissière de choisir le moment.
 */
const UpdatePrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(err) { console.warn('Service worker non enregistré :', err?.message); },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3
                 px-4 py-2.5 rounded-xl glass-panel-strong shadow-xl max-w-[92vw]"
    >
      <CloudDownloadOutlined className="text-primary shrink-0" />
      <span className="text-[0.8rem] text-text-primary">
        Une nouvelle version est disponible.
      </span>
      <button
        type="button"
        onClick={() => updateServiceWorker(true)}
        className="text-[0.78rem] font-semibold text-primary hover:underline shrink-0"
      >
        Mettre à jour
      </button>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        className="text-[0.78rem] text-text-muted hover:text-text-primary shrink-0"
      >
        Plus tard
      </button>
    </div>
  );
};

export default UpdatePrompt;
