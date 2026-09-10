import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, AppstoreOutlined } from '@ant-design/icons';
import { Button } from '../../components/ui';

/** Date de dernière révision, affichée en pied de chaque document. */
export const LEGAL_VERSION = '2026-09-10';

/**
 * Cadre commun aux documents légaux.
 *
 * Accessible sans être connecté : un visiteur doit pouvoir lire les conditions
 * avant d'ouvrir un compte, et un client après avoir quitté le service.
 */
const LegalLayout = ({ title, children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-primary relative">
      <div className="app-ambient-bg" />

      <div className="relative z-10 max-w-3xl mx-auto px-5 py-8">
        <header className="flex items-center gap-3 mb-6 flex-wrap">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Retour</Button>
          <span className="flex items-center gap-2 text-text-heading font-semibold text-[0.9rem]">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-dark
                             text-white flex items-center justify-center">
              <AppstoreOutlined style={{ fontSize: 14 }} />
            </span>
            Stock Expert
          </span>
        </header>

        <article className="glass-panel rounded-xl p-6 sm:p-8 legal-doc">
          <h1 className="text-[1.15rem] font-bold text-text-heading mb-1">{title}</h1>
          <p className="text-[0.72rem] text-text-muted mb-6">
            Dernière mise à jour : {new Date(LEGAL_VERSION).toLocaleDateString('fr-FR',
              { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          {children}
        </article>

        <p className="text-[0.72rem] text-text-muted text-center mt-5">
          Stock Expert &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default LegalLayout;
