import 'server-only';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { contentSource } from '../../backend/content/index.ts';
import { isLocale, type Locale } from '../i18n/config.ts';
import { sectionFromSegment, type Section } from '../../shared/routes.ts';

/** Datos públicos, una sola consulta por petición aunque los pidan generateMetadata y la página (React cache). */
const source = cache(() => contentSource());
export const isDemo = () => source().isDemo;
export const listPlaces = cache((...a: Parameters<ReturnType<typeof contentSource>['listPlaces']>) => source().listPlaces(...a));
export const getPlace = cache((...a: Parameters<ReturnType<typeof contentSource>['getPlace']>) => source().getPlace(...a));
export const getMenu = cache((...a: Parameters<ReturnType<typeof contentSource>['getMenu']>) => source().getMenu(...a));
export const listDishes = cache((l: Locale) => source().listDishes(l));
export const getDish = cache((l: Locale, slug: string) => source().getDish(l, slug));
export const listGuides = cache((l: Locale) => source().listGuides(l));
export const getGuide = cache((l: Locale, slug: string) => source().getGuide(l, slug));
export const listCities = cache((l: Locale) => source().listCities(l));
export const getCity = cache((l: Locale, slug: string) => source().getCity(l, slug));
export const getNeighborhood = cache((l: Locale, city: string, slug: string) => source().getNeighborhood(l, city, slug));

/** Idioma y sección de la URL; cualquier otra cosa (p. ej. /ar o un segmento de otro idioma) es 404. */
export async function resolveRoute(params: Promise<{ locale: string; section?: string }>): Promise<{ locale: Locale; section: Section | null }> {
  const { locale, section } = await params;
  if (!isLocale(locale)) notFound();
  if (section === undefined) return { locale, section: null };
  const resolved = sectionFromSegment(locale, section);
  if (!resolved) notFound();
  return { locale, section: resolved };
}
