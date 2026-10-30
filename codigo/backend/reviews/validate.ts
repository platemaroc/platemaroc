import { isLocale, type Locale } from '../../shared/locales.ts';

/**
 * Versión del texto de consentimiento que acepta el usuario (se guarda en `consents`). BORRADOR: la definitiva la fija el titular
 * o su asesor junto con la política de privacidad; al cambiar el texto, cambiar también la versión.
 */
export const CONSENT_VERSION = 'borrador-2026-10-30';
export const MAX_REVIEW_PHOTOS = 3;
export const MAX_COMMENT = 2000;
export const MAX_DISPLAY_NAME = 40;

/** Motivos de rechazo (orden moderar-resenas). */
export const REJECTION_REASONS = ['spam', 'ofensiva', 'datos_personales', 'conflicto_intereses', 'falsa'] as const;
export const REJECTION_LABEL: Record<(typeof REJECTION_REASONS)[number], string> = {
  spam: 'Spam', ofensiva: 'Ofensiva', datos_personales: 'Contiene datos personales', conflicto_intereses: 'Conflicto de intereses', falsa: 'Falsa o sin relación con el lugar',
};

export interface ReviewInput { rating: number; comment: string | null; locale: Locale; visited_on: string | null }
export type ReviewError = 'rating' | 'comment' | 'visited_on';

export function checkReview(get: (k: string) => unknown, today = new Date()): { value?: ReviewInput; errors: ReviewError[] } {
  const errors: ReviewError[] = [];
  const rating = Number(get('rating'));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.push('rating');
  const comment = String(get('comment') ?? '').trim();
  if (comment.length > MAX_COMMENT) errors.push('comment');
  const visited = String(get('visited_on') ?? '').trim();
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(visited) && !Number.isNaN(Date.parse(visited));
  if (visited && (!validDate || visited > today.toISOString().slice(0, 10))) errors.push('visited_on');
  const lang = get('lang');
  return errors.length ? { errors } : { errors, value: { rating, comment: comment || null, locale: isLocale(lang) ? lang : 'es', visited_on: visited || null } };
}

/** Nombre visible público. Se rechazan emails y teléfonos: nunca se debe publicar un dato de contacto por error. */
export function checkDisplayName(raw: unknown): string | null {
  const name = String(raw ?? '').trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > MAX_DISPLAY_NAME || name.includes('@') || /\d{6,}/.test(name)) return null;
  return name;
}
