/**
 * Quality Gate interno por entidad e idioma (docs/01-documento-maestro-operacion.md §4).
 * Es un criterio INTERNO de calidad, no un requisito oficial de Google.
 * Si falla, la entidad se conserva (nunca se elimina), pero no se publica como indexable.
 *
 * Tri-estado: un dato `null` significa "no comprobado" y deja el resultado en PENDIENTE
 * (plantilla PLANTILLA-quality-gate.md); nunca se da por bueno un dato que no se ha verificado.
 */
import type { Locale } from '../shared/locales.ts';

export type EntityType = 'place' | 'dish' | 'guide' | 'city' | 'neighborhood' | 'menu';
export type GateResult = 'APTO' | 'NO APTO' | 'PENDIENTE';

/** Mínimos internos de caracteres (maestro §4.3). Ajuste final: pendiente del titular. */
export const MIN_DESCRIPTION_CHARS: Record<EntityType, number> = {
  place: 300, dish: 300, guide: 500, city: 500, neighborhood: 250, menu: 200,
};

export interface GateInput {
  entity: EntityType;
  locale: Locale;
  status: 'borrador' | 'revisado' | 'publicado' | 'archivado';
  translationPublished: boolean;
  descriptionChars: number;
  /** null = no comprobado */
  duplicateDetected: boolean | null;
  /** true/false/null; undefined = no aplica */
  factsVerified?: boolean | null;
  metadataValid: boolean | null;

  lat?: number | null;
  lng?: number | null;
  cityAssigned?: boolean;
  /** Fotos aprobadas y cuántas tienen alt en ESTE idioma. */
  approvedPhotos?: number;
  approvedPhotosWithAlt?: number;
  inboundLinks?: number;
  outboundLinks?: number;
  /** lugar/plato/guía: relaciones útiles (platos↔lugares, guía↔lugares/platos/ciudades...). */
  relations?: number;
  publishedPlaces?: number;
  authorDeclared?: boolean;
  verifiedAt?: string | null;

  menu?: {
    placePublished: boolean;
    categories: { published: boolean; publishedItems: number }[];
    /** Precios verificados o claramente marcados como pendientes. */
    pricesVerifiedOrMarkedPending: boolean | null;
  };
}

export interface GateOptions {
  now?: Date;
  /** Antigüedad máxima de la verificación de un lugar. Sin definir = no se evalúa (pendiente de decisión). */
  maxVerificationAgeDays?: number;
  minChars?: Partial<Record<EntityType, number>>;
}

export interface GateReport {
  entity: EntityType;
  locale: Locale;
  result: GateResult;
  isIndexable: boolean;
  failures: string[];
  unchecked: string[];
}

const validCoords = (lat?: number | null, lng?: number | null) =>
  typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) &&
  Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

export function evaluateQualityGate(i: GateInput, opts: GateOptions = {}): GateReport {
  const failures: string[] = [];
  const unchecked: string[] = [];
  const need = (ok: boolean, msg: string) => { if (!ok) failures.push(msg); };
  const tri = (v: boolean | null | undefined, failMsg: string, pendMsg: string, failWhen: boolean) => {
    if (v === undefined) return;               // no aplica
    if (v === null) unchecked.push(pendMsg);
    else if (v === failWhen) failures.push(failMsg);
  };

  // --- Comunes (§4.1)
  need(i.translationPublished, `Traducción '${i.locale}' no publicada`);
  need(i.status === 'publicado', `Estado '${i.status}' (debe ser 'publicado')`);
  const min = opts.minChars?.[i.entity] ?? MIN_DESCRIPTION_CHARS[i.entity];
  need(i.descriptionChars >= min, `Descripción de ${i.descriptionChars} caracteres (mínimo interno ${min})`);
  tri(i.duplicateDetected, 'Duplicidad relevante detectada', 'Duplicidad no comprobada', true);
  tri(i.factsVerified, 'Datos factuales sin verificar', 'Verificación de datos factuales pendiente', false);
  tri(i.metadataValid, 'Metadatos inválidos', 'Metadatos no comprobados', false);

  const photos = i.approvedPhotos ?? 0;
  const altOk = (i.approvedPhotosWithAlt ?? 0) >= photos;
  const inb = i.inboundLinks ?? 0, out = i.outboundLinks ?? 0, rel = i.relations ?? 0;

  // --- Específicos (§4.2) y enlazado (§4.4)
  switch (i.entity) {
    case 'place':
      need(validCoords(i.lat, i.lng), 'Coordenadas no válidas');
      need(!!i.cityAssigned, 'Sin ciudad asignada');
      need(photos >= 1 && altOk && (i.approvedPhotosWithAlt ?? 0) >= 1, `Falta al menos 1 foto aprobada con alt en '${i.locale}'`);
      need(inb >= 1, 'Sin enlace entrante');
      need(out >= 2, 'Menos de 2 enlaces salientes');
      if (opts.maxVerificationAgeDays !== undefined) {
        if (!i.verifiedAt) unchecked.push('Verificación reciente: sin fecha');
        else {
          const age = ((opts.now ?? new Date()).getTime() - Date.parse(i.verifiedAt)) / 86_400_000;
          if (!(age >= 0 && age <= opts.maxVerificationAgeDays)) failures.push(`Verificación de hace más de ${opts.maxVerificationAgeDays} días`);
        }
      }
      break;
    case 'dish':
      need(rel >= 1, 'Sin relación con ningún lugar');
      need((i.approvedPhotosWithAlt ?? 0) >= 1, `Falta al menos 1 foto aprobada con alt en '${i.locale}'`);
      need(out >= 1, 'Sin enlace útil a lugares o guías');
      break;
    case 'guide':
      need(rel >= 3, 'Menos de 3 relaciones útiles');
      need((i.approvedPhotosWithAlt ?? 0) >= 2 && photos >= 2, `Faltan fotos aprobadas con alt en '${i.locale}' (mínimo 2)`);
      need(!!i.authorDeclared, 'Autoría no declarada');
      break;
    case 'city':
      need(validCoords(i.lat, i.lng), 'Coordenadas no válidas');
      need((i.publishedPlaces ?? 0) >= 3, 'Menos de 3 lugares publicados');
      need((i.approvedPhotosWithAlt ?? 0) >= 1, `Falta al menos 1 foto aprobada con alt en '${i.locale}'`);
      need(out >= 1, 'Sin relación saliente útil');
      break;
    case 'neighborhood':
      need(validCoords(i.lat, i.lng), 'Coordenadas no válidas');
      need(!!i.cityAssigned, 'Sin ciudad asignada');
      need((i.publishedPlaces ?? 0) >= 1, 'Sin ningún lugar publicado');
      need(out >= 1, 'Sin relación saliente útil');
      break;
    case 'menu': {
      const m = i.menu;
      if (!m) { failures.push('Menú sin datos de estructura'); break; }
      need(m.placePublished, 'El lugar del menú no está publicado');
      need(m.categories.every((c) => !c.published || c.publishedItems >= 1), 'Hay categorías publicadas sin artículos publicados');
      tri(m.pricesVerifiedOrMarkedPending, 'Precios sin verificar ni marcados como pendientes', 'Precios no comprobados', false);
      break;
    }
  }

  const result: GateResult = failures.length ? 'NO APTO' : unchecked.length ? 'PENDIENTE' : 'APTO';
  return { entity: i.entity, locale: i.locale, result, isIndexable: result === 'APTO', failures, unchecked };
}
