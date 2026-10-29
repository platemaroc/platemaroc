import type { Locale } from '../../shared/locales.ts';
import es from './messages/es.json';
import en from './messages/en.json';
import fr from './messages/fr.json';

/** Textos de interfaz (no de contenido: ese vive en la tabla `translations`). Mismas claves en los tres idiomas. */
export type Messages = typeof es;
const MESSAGES: Record<Locale, Messages> = { es, en, fr };

export const getMessages = (locale: Locale): Messages => MESSAGES[locale];
