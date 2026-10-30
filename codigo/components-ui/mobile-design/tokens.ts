/**
 * Tokens de diseño mobile-first (Fase 3). Los mismos valores, como variables CSS, están en `tokens.css`.
 * Paleta «Té a la menta», elegida por el titular el 30-10-2026.
 * Contraste de texto comprobado ≥ 4.5:1 (WCAG AA) sobre `bg` y `surface`. `gold` es solo fondo o adorno, nunca texto sobre claro.
 */
export const MIN_TOUCH_TARGET_PX = 48; // prompt inicial: targets táctiles mínimos de 48x48 px
export const touchTargetStyle = { minWidth: MIN_TOUCH_TARGET_PX, minHeight: MIN_TOUCH_TARGET_PX } as const;

export const colors = {
  text: '#1f2e27',
  muted: '#4f5d55',
  bg: '#f6f1e4',
  surface: '#ffffff',
  border: '#e0d9c6',
  accent: '#1f4d3a', // verde té
  accentText: '#f6f1e4',
  gold: '#e0a93b',
  goldText: '#2c2206',
  star: '#7a5a10',
  photo: '#dce5d8',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 6, md: 10, lg: 16 } as const;
/** Altura de la barra de navegación inferior (más la zona segura del iPhone). */
export const BOTTOM_NAV_PX = 64;
