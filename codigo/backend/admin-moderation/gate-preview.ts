import { evaluateQualityGate, type EntityType, type GateInput, type GateReport } from '../../base-indexing/quality-gate.ts';
import { LOCALES } from '../../shared/locales.ts';
import type { AdminEntity } from './entities.ts';

/**
 * Vista previa del Quality Gate en el panel, por idioma, ANTES de publicar (orientativa).
 * Usa las reglas reales de base-indexing/quality-gate.ts. Lo que el panel aún no comprueba (duplicidad) queda como
 * "no comprobado" (null) y el resultado sale PENDIENTE, nunca APTO por suposición.
 * El cálculo definitivo de is_indexable llega con la Fase 5.
 */
type Row = Record<string, any>;

const GATE_TYPE: Partial<Record<AdminEntity, EntityType>> = { lugares: 'place', ciudades: 'city', barrios: 'neighborhood', platos: 'dish', guias: 'guide' };

export interface GateFacts {
  row: Row;
  translations: Partial<Record<string, Row>>;
  relations: Record<string, string[]>;
  photos: Row[];
  /** Lugares publicados de la ciudad o el barrio. */
  publishedPlaces?: number;
  /** Lugar: páginas publicadas que lo enlazan (su ciudad y barrio, guías y platos publicados). */
  inboundLinks?: number;
}

export function previewGate(entity: AdminEntity, f: GateFacts): GateReport[] {
  const type = GATE_TYPE[entity];
  if (!type) return [];
  const approved = f.photos.filter((p) => p.status === 'aprobada');
  const relCount = Object.values(f.relations).reduce((n, ids) => n + ids.length, 0);
  return LOCALES.map((locale) => {
    const t = f.translations[locale];
    const input: GateInput = {
      entity: type, locale, status: f.row.status, translationPublished: t?.status === 'publicada',
      descriptionChars: ((t?.description ?? '') + (t?.content ?? '')).trim().length,
      duplicateDetected: null,
      factsVerified: entity === 'lugares' ? (f.row.verification_status === 'verificado' ? true : null) : undefined,
      metadataValid: t?.seo_title && t?.seo_description ? true : null,
      lat: f.row.lat === null || f.row.lat === undefined ? null : Number(f.row.lat),
      lng: f.row.lng === null || f.row.lng === undefined ? null : Number(f.row.lng),
      cityAssigned: !!f.row.city_id,
      approvedPhotos: approved.length,
      approvedPhotosWithAlt: approved.filter((p) => p.alts?.[locale]).length,
      inboundLinks: f.inboundLinks ?? 0,
      outboundLinks: relCount + (f.row.city_id ? 1 : 0) + (f.row.neighborhood_id ? 1 : 0),
      relations: relCount,
      publishedPlaces: f.publishedPlaces,
      authorDeclared: !!f.row.author_name?.trim(),
      verifiedAt: f.row.verified_at ?? null,
    };
    return evaluateQualityGate(input);
  });
}
