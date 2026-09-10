/**
 * SOURCE UNIQUE DE LA CHARTE GRAPHIQUE.
 *
 * Pour changer la couleur de marque de toute l'application, modifiez `brand.primary`
 * ci-dessous : rien d'autre n'est à toucher. Cette valeur alimente à la fois
 *   - les composants Ant Design (via ConfigProvider dans App.jsx),
 *   - les classes Tailwind `*-primary` et le CSS (via les variables injectées
 *     par `applyBrandToCssVariables`, appelée au démarrage).
 */

/** Éclaircit / assombrit une couleur hexadécimale. `amount` ∈ [-1, 1]. */
const shade = (hex, amount) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c =>
    Math.max(0, Math.min(255, Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)))
  );
  return '#' + ch.map(c => c.toString(16).padStart(2, '0')).join('');
};

export const brand = {
  /** ← La couleur de marque. Tout le reste en découle. */
  primary: '#10b981',
  /** Texte posé sur un aplat de la couleur de marque (boutons pleins, pastilles). */
  onPrimary: '#ffffff',
  radius: 8,
};

export const themeConfig = {
  colors: {
    primary: brand.primary,
    primaryLight: shade(brand.primary, 0.18),
    primaryDark: shade(brand.primary, -0.22),
    onPrimary: brand.onPrimary,
    bgDark: '#0b1120',
    bgCard: '#111827',
    border: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    danger: '#ef4444',
    info: '#3b82f6',
    warning: '#f59e0b',
  },
  radius: brand.radius,
};

/** Convertit un hex en triplet `r, g, b` pour composer des rgba() en CSS. */
const rgbTriplet = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
};

/**
 * Publie la charte sous forme de variables CSS.
 * Appelée une fois au démarrage : le CSS n'a donc plus sa propre copie des couleurs.
 */
export const applyBrandToCssVariables = (root = document.documentElement) => {
  const { primary, primaryLight, primaryDark, onPrimary } = themeConfig.colors;
  root.style.setProperty('--color-primary', primary);
  root.style.setProperty('--color-primary-light', primaryLight);
  root.style.setProperty('--color-primary-dark', primaryDark);
  root.style.setProperty('--color-primary-bg', `rgba(${rgbTriplet(primary)}, 0.1)`);
  root.style.setProperty('--color-on-primary', onPrimary);
  root.style.setProperty('--shadow-glow', `0 4px 12px rgba(${rgbTriplet(primary)}, 0.25)`);
};
