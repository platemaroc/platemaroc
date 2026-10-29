/**
 * Tokens de diseño mobile-first (Fase 3). Los mismos valores, como variables CSS, están en `tokens.css`.
 * Paleta PROVISIONAL (cálida, sin logo): se sustituye cuando el titular tenga identidad visual.
 * Contraste de texto comprobado ≥ 4.5:1 (WCAG AA) sobre `bg` y `surface`.
 */
export const MIN_TOUCH_TARGET_PX = 48; // prompt inicial: targets táctiles mínimos de 48x48 px
export const touchTargetStyle = { minWidth: MIN_TOUCH_TARGET_PX, minHeight: MIN_TOUCH_TARGET_PX } as const;

export const colors = {
  text: '#1f1a17',
  muted: '#5b524b',
  bg: '#fbf8f4',
  surface: '#ffffff',
  border: '#e6ddd3',
  accent: '#9a3412', // terracota
  accentText: '#ffffff',
  star: '#b45309',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 6, md: 10, lg: 16 } as const;
/** Altura de la barra de navegación inferior (más la zona segura del iPhone). */
export const BOTTOM_NAV_PX = 64;
