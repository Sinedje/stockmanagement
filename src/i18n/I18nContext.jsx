import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { translations } from './translations';

const I18nContext = createContext(null);

const FALLBACK = 'fr';

/**
 * Fournit la langue d'affichage et la fonction de traduction `t()`.
 *
 * La langue vit dans les paramètres de l'entreprise (donc en base) : elle est
 * commune à tous les utilisateurs du déploiement, comme le nom ou le RCCM.
 * `language` et `setLanguage` sont injectés depuis le contexte des paramètres
 * afin de ne pas dupliquer l'appel réseau ici.
 */
export const I18nProvider = ({ language, onChangeLanguage, children }) => {
  const lang = translations[language] ? language : FALLBACK;

  const t = useCallback((key, vars) => {
    // Repli sur le français puis sur la clé : jamais d'écran vide si une
    // traduction manque.
    const raw = translations[lang]?.[key] ?? translations[FALLBACK]?.[key] ?? key;

    // Une clé absente retombe sur elle-même et s'affiche telle quelle à
    // l'écran — c'est ainsi que « role.superadmin » est apparu dans la barre
    // latérale. On la signale en développement, où la corriger est immédiat.
    if (import.meta.env.DEV && raw === key && !translations[FALLBACK]?.[key]) {
      console.warn(`[i18n] clé sans traduction : ${key}`);
    }
    if (!vars) return raw;
    return Object.entries(vars).reduce((out, [k, v]) => out.replaceAll(`{${k}}`, v), raw);
  }, [lang]);

  const value = useMemo(
    () => ({ language: lang, setLanguage: onChangeLanguage, t }),
    [lang, onChangeLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n doit être utilisé dans un <I18nProvider>');
  return ctx;
};

/** Raccourci : `const t = useT()` quand seule la traduction est nécessaire. */
export const useT = () => useI18n().t;

export default I18nContext;
