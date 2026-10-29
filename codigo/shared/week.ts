import type { Locale } from './locales.ts';

/**
 * Horario por días (decisión del titular, 29-10-2026): `places.opening_hours` = {mon: '9:00–13:00, 16:00–20:00', …}.
 * Las horas no se traducen; los días y "Cerrado" sí. Día vacío o ausente = cerrado.
 */
export const WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Weekday = (typeof WEEK)[number];
export type WeekHours = Partial<Record<Weekday, string>>;

export const DAY_NAMES: Record<Locale, Record<Weekday, string>> = {
  es: { mon: 'Lunes', tue: 'Martes', wed: 'Miércoles', thu: 'Jueves', fri: 'Viernes', sat: 'Sábado', sun: 'Domingo' },
  en: { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' },
  fr: { mon: 'Lundi', tue: 'Mardi', wed: 'Mercredi', thu: 'Jeudi', fri: 'Vendredi', sat: 'Samedi', sun: 'Dimanche' },
};
export const CLOSED: Record<Locale, string> = { es: 'Cerrado', en: 'Closed', fr: 'Fermé' };

export const isWeekHours = (raw: unknown): raw is WeekHours =>
  !!raw && typeof raw === 'object' && !Array.isArray(raw) && Object.keys(raw).length > 0 && Object.keys(raw).every((k) => (WEEK as readonly string[]).includes(k));
