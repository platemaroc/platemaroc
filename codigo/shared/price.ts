/**
 * Precios: exclusivamente MAD (docs/12-especificacion-precios-mad.md).
 * Devuelve null si el importe no es válido o falta: el llamante muestra "Precio pendiente",
 * nunca un importe inventado.
 */
import type { Locale } from './locales.ts';

export function formatPriceMad(amountMad: number | null | undefined, locale: Locale = 'es'): string | null {
  if (typeof amountMad !== 'number' || !Number.isFinite(amountMad) || amountMad < 0) return null;
  const n = new Intl.NumberFormat(locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amountMad);
  return `${n} MAD`;
}
