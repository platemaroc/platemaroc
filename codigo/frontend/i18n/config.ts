export { LOCALES, DEFAULT_LOCALE, isLocale, type Locale } from '../../shared/locales.ts';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '../../shared/locales.ts';

/** Quita un prefijo de idioma (`/es/x` → `x`) y devuelve el idioma detectado. */
export function splitLocale(pathname: string): { locale: Locale | null; rest: string } {
  const [, first, ...rest] = pathname.split('/');
  return (LOCALES as readonly string[]).includes(first)
    ? { locale: first as Locale, rest: rest.join('/') }
    : { locale: null, rest: pathname.replace(/^\/+/, '') };
}
export const localePath = (locale: Locale, rest: string) => `/${locale}${rest ? `/${rest.replace(/^\/+/, '')}` : ''}`;
export { DEFAULT_LOCALE as FALLBACK_LOCALE };
