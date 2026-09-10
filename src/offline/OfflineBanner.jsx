import React from 'react';
import { CloudSyncOutlined, DisconnectOutlined, SyncOutlined } from '@ant-design/icons';
import { useOfflineQueue } from './useOfflineQueue';
import { useStore } from '../context/StoreContext';
import { cacheAge } from './cache';

/**
 * Bandeau d'état de la file.
 *
 * Affiché uniquement lorsqu'il y a quelque chose à signaler : une caissière
 * n'a pas à voir un indicateur permanent qu'elle finirait par ignorer. Le
 * nombre de ventes en attente est écrit en toutes lettres — c'est ce qui
 * permet de constater qu'elles sont bien parties avant de fermer la caisse.
 */
const OfflineBanner = () => {
  const { pending, flushing, online, flush } = useOfflineQueue();
  const { usingCachedData } = useStore();
  const [savedAt, setSavedAt] = React.useState(null);

  React.useEffect(() => {
    if (usingCachedData) cacheAge().then(setSavedAt);
  }, [usingCachedData]);

  // Rien à signaler : pas de bandeau permanent, qu'on finirait par ignorer.
  if (online && pending === 0 && !usingCachedData) return null;

  const tone = (!online || usingCachedData)
    ? 'bg-amber-500/12 border-amber-500/25 text-amber-700 dark:text-amber-400'
    : 'bg-blue-500/12 border-blue-500/25 text-blue-700 dark:text-blue-400';

  return (
    <div className={`px-4 py-2 rounded-xl border flex items-center gap-2.5 flex-wrap ${tone}`}>
      {!online ? <DisconnectOutlined /> : flushing ? <SyncOutlined spin /> : <CloudSyncOutlined />}

      <span className="text-[0.8rem]">
        {usingCachedData && (
          <>Catalogue affiché depuis ce poste
            {savedAt && <> (relevé du {new Date(savedAt).toLocaleString('fr-FR',
              { dateStyle: 'short', timeStyle: 'short' })})</>}
            . Les stocks peuvent avoir changé.{' '}
          </>
        )}
        {!online && pending > 0 && (
          <>Hors connexion — <strong>{pending}</strong> vente{pending > 1 ? 's' : ''} enregistrée
            {pending > 1 ? 's' : ''} sur ce poste, en attente d'envoi.</>
        )}
        {!online && pending === 0 && <>Hors connexion. Les ventes seront conservées sur ce poste.</>}
        {online && pending > 0 && (
          <><strong>{pending}</strong> vente{pending > 1 ? 's' : ''} en attente de transmission.</>
        )}
      </span>

      {online && pending > 0 && (
        <button
          type="button"
          onClick={flush}
          disabled={flushing}
          className="ml-auto text-[0.76rem] font-semibold underline disabled:opacity-50"
        >
          {flushing ? 'Envoi…' : 'Envoyer maintenant'}
        </button>
      )}
    </div>
  );
};

export default OfflineBanner;
