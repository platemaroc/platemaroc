import type { AdminEntity } from '../../../backend/admin-moderation/entities.ts';
import { STATUS_LABEL, VERIFICATION_STATUSES } from '../../../backend/admin-moderation/entities.ts';
import type { Option } from '../../../backend/admin-moderation/content-admin.ts';
import { DAY_NAMES, WEEK } from '../../../shared/week.ts';
import styles from './admin.module.css';

type Row = Record<string, any>;

/** Etiquetas de los campos (también para los mensajes de error). */
export const FIELD_LABELS: Record<string, string> = {
  slug: 'Slug (dirección web)', place_type_id: 'Tipo de lugar', city_id: 'Ciudad', neighborhood_id: 'Barrio', region_id: 'Región',
  origin_region_id: 'Región de origen', address: 'Dirección', coords: 'Coordenadas', price_range: 'Nivel de precios', phone: 'Teléfono',
  website: 'Web', verification_status: 'Verificación', verification_source: 'Fuente de la verificación', verified_today: 'Verificado hoy',
  main_ingredients: 'Ingredientes principales', author_name: 'Autoría', title: 'Título', description: 'Resumen', content: 'Contenido',
  seo_title: 'Título para buscadores', seo_description: 'Descripción para buscadores', directions: 'Cómo llegar', status: 'Estado',
  file: 'Imagen', source: 'Origen', author: 'Autor', license: 'Licencia', alt_es: 'Texto alternativo (es)', rejection_reason: 'Motivo del rechazo',
  ...Object.fromEntries(WEEK.map((d) => [`hours_${d}`, `Horario ${DAY_NAMES.es[d]}`])),
};

export function Text({ name, label, value, hint, type = 'text', required, readOnly, inputMode }: {
  name: string; label?: string; value?: unknown; hint?: string; type?: string; required?: boolean; readOnly?: boolean; inputMode?: 'decimal' | 'tel' | 'url';
}) {
  return (
    <label className={styles.field}>
      <span>{label ?? FIELD_LABELS[name]}{required && ' *'}</span>
      <input name={name} type={type} defaultValue={value == null ? '' : String(value)} required={required} readOnly={readOnly} inputMode={inputMode} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Area({ name, label, value, hint, rows = 4 }: { name: string; label?: string; value?: unknown; hint?: string; rows?: number }) {
  return (
    <label className={styles.field}>
      <span>{label ?? FIELD_LABELS[name]}</span>
      <textarea name={name} rows={rows} defaultValue={value == null ? '' : String(value)} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Select({ name, label, value, options, required, empty = '—' }: { name: string; label?: string; value?: unknown; options: Option[]; required?: boolean; empty?: string }) {
  return (
    <label className={styles.field}>
      <span>{label ?? FIELD_LABELS[name]}{required && ' *'}</span>
      <select name={name} defaultValue={value == null ? '' : String(value)}>
        <option value="">{empty}</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </label>
  );
}

function Coords({ row }: { row: Row | null }) {
  return (
    <fieldset className={styles.group}>
      <legend>Coordenadas (las dos o ninguna)</legend>
      <div className={styles.row2}>
        <Text name="lat" label="Latitud" value={row?.lat} inputMode="decimal" hint="Ej.: 35.7836" />
        <Text name="lng" label="Longitud" value={row?.lng} inputMode="decimal" hint="Ej.: -5.8125" />
      </div>
    </fieldset>
  );
}

function Week({ value }: { value: Row | null }) {
  return (
    <fieldset className={styles.group}>
      <legend>Horario (vacío = cerrado)</legend>
      {WEEK.map((d) => (
        <Text key={d} name={`hours_${d}`} label={DAY_NAMES.es[d]} value={value && typeof value === 'object' && !Array.isArray(value) ? value[d] : ''} />
      ))}
      <small>Formato 9:00–13:00; varios tramos separados por comas: 9:00–13:00, 16:00–20:00</small>
    </fieldset>
  );
}

export interface FieldOptions { placeTypes?: Option[]; cities?: Option[]; neighborhoods?: Option[]; regions?: Option[] }

/** Campos propios de cada tipo. `slugLocked`: una vez publicado, el slug no se puede cambiar. */
export function EntityFields({ entity, row, opts, slugLocked }: { entity: AdminEntity; row: Row | null; opts: FieldOptions; slugLocked: boolean }) {
  const slug = slugLocked
    ? <Text name="slug_readonly" label={FIELD_LABELS.slug} value={row?.slug} readOnly hint="Fijo: ya se ha publicado (cambiarlo rompería enlaces)." />
    : <Text name="slug" value={row?.slug} required hint="Minúsculas, sin acentos y con guiones. Ej.: cafe-hafa" />;
  switch (entity) {
    case 'lugares':
      return (
        <>
          {slug}
          <Select name="place_type_id" value={row?.place_type_id} options={opts.placeTypes ?? []} required />
          <Select name="city_id" value={row?.city_id} options={opts.cities ?? []} required />
          <Select name="neighborhood_id" value={row?.neighborhood_id} options={opts.neighborhoods ?? []} empty="(sin barrio)" />
          <Text name="address" value={row?.address} hint="Dirección postal completa. Se muestra siempre bajo el mapa." />
          <Coords row={row} />
          <Select name="price_range" value={row?.price_range} options={[1, 2, 3, 4].map((n) => ({ id: String(n), label: `${'●'.repeat(n)}${'○'.repeat(4 - n)} (${n})` }))} empty="(sin indicar)" />
          <Week value={row?.opening_hours ?? null} />
          <Text name="phone" type="tel" value={row?.phone} inputMode="tel" />
          <Text name="website" type="url" value={row?.website} inputMode="url" />
          <fieldset className={styles.group}>
            <legend>Verificación de los datos</legend>
            <Select name="verification_status" value={row?.verification_status ?? 'sin_verificar'} options={VERIFICATION_STATUSES.map((v) => ({ id: v, label: STATUS_LABEL[v] }))} empty="—" />
            <Text name="verification_source" value={row?.verification_source} hint="Cómo se comprobó: visita, llamada, web oficial…" />
            <label className={styles.check}><input type="checkbox" name="verified_today" /> Lo he comprobado hoy {row?.verified_at && <small>(última: {new Date(row.verified_at).toLocaleDateString('es')})</small>}</label>
          </fieldset>
        </>
      );
    case 'ciudades':
      return <>{slug}<Select name="region_id" value={row?.region_id} options={opts.regions ?? []} required /><Coords row={row} /></>;
    case 'barrios':
      return <>{slug}<Select name="city_id" value={row?.city_id} options={opts.cities ?? []} required /><Coords row={row} /></>;
    case 'platos':
      return (
        <>
          {slug}
          <Select name="origin_region_id" value={row?.origin_region_id} options={opts.regions ?? []} empty="(sin región)" />
          <Area name="main_ingredients" value={(row?.main_ingredients ?? []).join('\n')} hint="Uno por línea. Solo ingredientes comprobados." rows={3} />
        </>
      );
    case 'guias':
      return <>{slug}<Text name="author_name" value={row?.author_name} hint="Obligatoria para que la guía sea indexable." /></>;
    default:
      return null;
  }
}
