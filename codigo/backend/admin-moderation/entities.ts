import type { AuditEntity } from './audit.ts';

/**
 * Tipos de contenido del panel (bloque 4b). Configuración pura: qué tabla, qué tipo de traducción y qué relaciones tiene cada uno.
 * Las regiones solo admiten traducciones y estado (sus slugs vienen de los datos de referencia).
 */
export const ADMIN_ENTITIES = ['lugares', 'ciudades', 'barrios', 'platos', 'guias', 'regiones'] as const;
export type AdminEntity = (typeof ADMIN_ENTITIES)[number];
export type TranslatableType = 'place' | 'city' | 'neighborhood' | 'dish' | 'guide' | 'region';

export interface RelationDef {
  key: string;
  label: string;
  table: string;
  ownKey: string;
  otherKey: string;
  other: AdminEntity;
}

export interface EntityDef {
  key: AdminEntity;
  table: string;
  type: TranslatableType;
  audit: AuditEntity;
  singular: string;
  plural: string;
  /** Campos propios editables (las regiones no: solo traducciones y estado). */
  editable: boolean;
  /** Indicaciones de llegada en las traducciones y fotos/mapa estático: solo lugares. */
  place: boolean;
  relations: RelationDef[];
}

const rel = (key: string, label: string, table: string, ownKey: string, otherKey: string, other: AdminEntity): RelationDef => ({ key, label, table, ownKey, otherKey, other });

export const ENTITIES: Record<AdminEntity, EntityDef> = {
  lugares: { key: 'lugares', table: 'places', type: 'place', audit: 'place', singular: 'lugar', plural: 'Lugares', editable: true, place: true,
    relations: [rel('platos', 'Platos que destacan aquí', 'place_dishes', 'place_id', 'dish_id', 'platos')] },
  ciudades: { key: 'ciudades', table: 'cities', type: 'city', audit: 'city', singular: 'ciudad', plural: 'Ciudades', editable: true, place: false, relations: [] },
  barrios: { key: 'barrios', table: 'neighborhoods', type: 'neighborhood', audit: 'neighborhood', singular: 'barrio', plural: 'Barrios', editable: true, place: false, relations: [] },
  platos: { key: 'platos', table: 'dishes', type: 'dish', audit: 'dish', singular: 'plato', plural: 'Platos', editable: true, place: false,
    relations: [rel('lugares', 'Lugares donde probarlo', 'place_dishes', 'dish_id', 'place_id', 'lugares')] },
  guias: { key: 'guias', table: 'guides', type: 'guide', audit: 'guide', singular: 'guía', plural: 'Guías', editable: true, place: false,
    relations: [
      rel('lugares', 'Lugares de la guía', 'guide_places', 'guide_id', 'place_id', 'lugares'),
      rel('platos', 'Platos de la guía', 'guide_dishes', 'guide_id', 'dish_id', 'platos'),
      rel('ciudades', 'Ciudades de la guía', 'guide_cities', 'guide_id', 'city_id', 'ciudades'),
      rel('barrios', 'Barrios de la guía', 'guide_neighborhoods', 'guide_id', 'neighborhood_id', 'barrios'),
    ] },
  // audit_log no tiene tipo "region": los cambios de estado de una región se registran como 'config' (sus textos, como 'translation').
  regiones: { key: 'regiones', table: 'regions', type: 'region', audit: 'config', singular: 'región', plural: 'Regiones', editable: false, place: false, relations: [] },
};

export const isAdminEntity = (v: unknown): v is AdminEntity => typeof v === 'string' && (ADMIN_ENTITIES as readonly string[]).includes(v);

export const CONTENT_STATUSES = ['borrador', 'revisado', 'publicado', 'archivado'] as const;
export const TRANSLATION_STATUSES = ['borrador', 'revisada', 'publicada'] as const;
export const VERIFICATION_STATUSES = ['sin_verificar', 'verificado', 'caducado'] as const;

/** Nombre del estado para el panel. */
export const STATUS_LABEL: Record<string, string> = {
  borrador: 'Borrador', revisado: 'Revisado', publicado: 'Publicado', archivado: 'Archivado', revisada: 'Revisada', publicada: 'Publicada',
  pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada', sin_verificar: 'Sin verificar', verificado: 'Verificado', caducado: 'Caducado',
};

/** Botón para cada transición (solo se muestran las permitidas por shared/states.ts). */
export const TRANSITION_LABEL: Record<string, string> = {
  revisado: 'Marcar como revisado', borrador: 'Volver a borrador', publicado: 'Publicar', archivado: 'Archivar',
  revisada: 'Marcar como revisada', publicada: 'Publicar traducción',
};
