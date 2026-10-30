/**
 * Datos estructurados JSON-LD. Regla (reglas-generales.md): deben reflejar contenido visible y real.
 * Por eso: ningún campo se rellena si el dato no existe, y la valoración solo se emite
 * con reseñas aprobadas (maestro §3). Afiliados/destacados de pago nunca influyen (maestro §1.6).
 */
import { SITE_NAME, SITE_URL } from './types.ts';

type Json = Record<string, unknown>;

export interface RestaurantInput {
  /** Subtipo más específico de schema.org. */
  type?: string;
  name: string;
  url: string;
  description?: string;
  /** URLs de fotos aprobadas. */
  images?: string[];
  address?: { street?: string; city?: string; country?: string };
  lat?: number | null;
  lng?: number | null;
  telephone?: string;
  /** Ej.: ["Mo-Su 09:00-23:00"] solo si el horario está verificado. */
  openingHours?: string[];
  /** Horario por días (formato recomendado por Google). */
  openingHoursSpecification?: { dayOfWeek: string; opens: string; closes: string }[];
  /** "$"..."$$$$" o texto; solo si está verificado. */
  priceRange?: string;
  /** Solo reseñas APROBADAS. */
  approvedReviews?: { count: number; average: number };
  /** URL del menú digital publicado. */
  menuUrl?: string;
}

const compact = <T extends Json>(o: T): T =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0))) as T;

const hasCoords = (lat?: number | null, lng?: number | null): lat is number =>
  typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

export function restaurantJsonLd(i: RestaurantInput): Json {
  const a = i.address;
  const rating = i.approvedReviews;
  return compact({
    '@context': 'https://schema.org',
    '@type': i.type ?? 'Restaurant',
    name: i.name,
    url: i.url,
    description: i.description,
    image: i.images,
    telephone: i.telephone,
    openingHours: i.openingHours,
    openingHoursSpecification: i.openingHoursSpecification?.map((s) => ({ '@type': 'OpeningHoursSpecification', ...s })),
    priceRange: i.priceRange,
    hasMenu: i.menuUrl,
    address: a && (a.street || a.city || a.country)
      ? compact({ '@type': 'PostalAddress', streetAddress: a.street, addressLocality: a.city, addressCountry: a.country ?? 'MA' })
      : undefined,
    geo: hasCoords(i.lat, i.lng) ? { '@type': 'GeoCoordinates', latitude: i.lat, longitude: i.lng } : undefined,
    aggregateRating:
      rating && Number.isInteger(rating.count) && rating.count > 0 && rating.average >= 1 && rating.average <= 5
        ? { '@type': 'AggregateRating', ratingValue: Math.round(rating.average * 10) / 10, reviewCount: rating.count, bestRating: 5, worstRating: 1 }
        : undefined,
  });
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): Json | null {
  if (items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({ '@type': 'ListItem', position: idx + 1, name: it.name, item: it.url })),
  };
}

export function websiteJsonLd(): Json {
  return { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: SITE_URL };
}

/** Serializa para `<script type="application/ld+json">` evitando cerrar la etiqueta por accidente. */
export function toScriptJson(data: Json): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
