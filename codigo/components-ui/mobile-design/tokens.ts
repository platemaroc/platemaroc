/**
 * Tokens de diseño mobile-first (Fase 3). Los mismos valores, como variables CSS, están en `tokens.css`.
 * Sistema visual de Claude Design (arena y terracota), elegido por el titular el 30-10-2026.
 * Contraste de texto comprobado ≥ 4.5:1 (WCAG AA) sobre `bg` y `surface`. `gold` es solo fondo o adorno, nunca texto sobre claro.
 */
export const MIN_TOUCH_TARGET_PX = 48; // prompt inicial: targets táctiles mínimos de 48x48 px
export const touchTargetStyle = { minWidth: MIN_TOUCH_TARGET_PX, minHeight: MIN_TOUCH_TARGET_PX } as const;

export const colors = {
  text: '#1f1a17',
  muted: '#5e534b',
  bg: '#f7f2ea',
  surface: '#ffffff',
  border: '#e4d9ca',
  accent: '#b5482a', // terracota
  accentDark: '#8f3720',
  accentText: '#ffffff',
  accentTint: '#f6e3da',
  mint: '#1f6b5c',
  mintTint: '#dcede7',
  gold: '#e9b44c',
  goldText: '#2c2206',
  star: '#8f3720',
  photo: '#e9dfd1',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 6, md: 8, lg: 16 } as const;
/** Altura de la barra de navegación inferior (más la zona segura del iPhone). */
export const BOTTOM_NAV_PX = 64;
