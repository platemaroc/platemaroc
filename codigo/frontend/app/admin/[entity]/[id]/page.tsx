import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LOCALES, type Locale } from '../../../../../shared/locales.ts';
import { canTransition } from '../../../../../shared/states.ts';
import { isPlaceSection, sectionPath, type PlaceSection } from '../../../../../shared/routes.ts';
import { CONTENT_STATUSES, ENTITIES, isAdminEntity, STATUS_LABEL, TRANSITION_LABEL, TRANSLATION_STATUSES } from '../../../../../backend/admin-moderation/entities.ts';
import { gateExtras, getEntity, options, type Option } from '../../../../../backend/admin-moderation/content-admin.ts';
import { previewGate } from '../../../../../backend/admin-moderation/gate-preview.ts';
import { requireAdmin } from '../../../../lib/admin.ts';
import { supabaseForRequest } from '../../../../lib/supabase-server.ts';
import { AdminForm, ValueButton } from '../../AdminForm.tsx';
import { addPhoto, editPhoto, updateFields, updateRelations, updateStatus, updateTranslation, updateTranslationStatus, uploadStaticMap } from '../../actions.ts';
import { Area, EntityFields, FIELD_LABELS, Text } from '../../fields.tsx';
import styles from '../../admin.module.css';

type Params = Promise<{ entity: string; id: string }>;
type Row = Record<string, any>;
const LOCALE_NAME: Record<Locale, string> = { es: 'Español', en: 'English', fr: 'Français' };

export const metadata: Metadata = { title: 'Editar' };

const nextStates = (kind: 'contenido' | 'traduccion', from: string) =>
  (kind === 'contenido' ? CONTENT_STATUSES : TRANSLATION_STATUSES).filter((to) => to !== from && canTransition(kind, from, to, 'admin').allowed);

function PhotoRights({ p }: { p?: Row }) {
  return (
    <>
      <div className={styles.row3}>
        <Text name="source" value={p?.source} hint="Ej.: foto propia, cedida por el local" />
        <Text name="author" value={p?.author} />
        <Text name="license" value={p?.license} hint="Ej.: todos los derechos, CC BY 4.0" />
      </div>
      <div className={styles.row3}>
        {LOCALES.map((l) => <Text key={l} name={`alt_${l}`} label={`Texto alternativo (${l})`} value={p?.alts?.[l]} hint={l === 'es' ? 'Obligatorio para aprobar' : undefined} />)}
      </div>
    </>
  );
}

export default async function EditEntity({ params, searchParams }: { params: Params; searchParams: Promise<Record<string, string | undefined>> }) {
  const { entity, id } = await params;
  if (!isAdminEntity(entity) || !/^[0-9a-f-]{36}$/.test(id)) notFound();
  await requireAdmin(`/admin/${entity}/${id}`);
  const { creado } = await searchParams;
  const db = await supabaseForRequest();
  const detail = await getEntity(db, entity, id);
  if (!detail) notFound();
  const def = ENTITIES[entity];
  const { row, translations, relations, photos, slugLocked } = detail;
  const hidden = { entity, id };

  const [placeTypes, cities, neighborhoods, regions, extras] = await Promise.all([
    entity === 'lugares' ? options(db, 'place_types') : [], ['lugares', 'barrios'].includes(entity) ? options(db, 'ciudades') : [],
    entity === 'lugares' ? options(db, 'barrios') : [], ['ciudades', 'platos'].includes(entity) ? options(db, 'regiones') : [],
    gateExtras(db, entity, row),
  ]);
  const relOptions: Record<string, Option[]> = {};
  for (const r of def.relations) relOptions[r.key] = await options(db, r.other);

  // Vista previa de fotos pendientes: enlace firmado de 10 minutos con la sesión del administrador (la ruta pública /media solo sirve aprobadas).
  const signed = async (path?: string | null) => (path ? (await db.storage.from('fotos').createSignedUrl(path, 600)).data?.signedUrl ?? null : null);
  for (const p of photos) p.preview = await signed(p.storage_path);
  const staticMap = entity === 'lugares' ? await signed(row.static_map_path) : null;

  const gate = previewGate(entity, { row, translations, relations, photos, ...extras });
  const placeSection = entity === 'lugares' ? (placeTypes as Option[]).find((t) => t.id === row.place_type_id)?.label : undefined;
  const publicUrl = row.status !== 'publicado' ? null
    : entity === 'lugares' && placeSection && isPlaceSection(placeSection as PlaceSection) ? sectionPath('es', placeSection as PlaceSection, row.slug)
    : entity === 'platos' ? sectionPath('es', 'platos-tipicos', row.slug)
    : entity === 'guias' ? sectionPath('es', 'guias-gastronomicas', row.slug)
    : entity === 'ciudades' ? sectionPath('es', 'ciudades-y-barrios', row.slug) : null;

  return (
    <>
      <p className={styles.back}><a href={`/admin/${entity}`}>← {def.plural}</a></p>
      <h1 className={styles.title}>{translations.es?.title ?? row.slug}</h1>
      <p className={styles.meta}>
        <span className={styles[`status_${row.status}`] ?? styles.badge}>{STATUS_LABEL[row.status]}</span> <code>{row.slug}</code>
        {publicUrl && <> · <a href={publicUrl} target="_blank" rel="noopener">Ver en la web</a></>}
      </p>
      {creado && <p role="status" className={styles.saved}>Creado en borrador. Ahora añade los textos de cada idioma.</p>}

      <section className={styles.card} aria-labelledby="estado">
        <h2 id="estado">Estado</h2>
        <AdminForm action={updateStatus} hidden={hidden} labels={FIELD_LABELS} submit="" className={styles.inline}>
          {nextStates('contenido', row.status).map((to) => (
            <ValueButton key={to} name="to" value={to} secondary={to !== 'publicado'}>{TRANSITION_LABEL[to]}</ValueButton>
          ))}
        </AdminForm>
        {gate.length > 0 && (
          <details className={styles.gate} open={row.status !== 'publicado'}>
            <summary>Quality Gate (orientativo): {gate.map((g) => `${g.locale} ${g.result}`).join(' · ')}</summary>
            <p className={styles.muted}>Publicar hace visible la ficha. Solo se indexa en Google el idioma que salga APTO (cálculo definitivo en la Fase 5).</p>
            {gate.map((g) => (
              <div key={g.locale}>
                <h3>{LOCALE_NAME[g.locale]}: {g.result}</h3>
                <ul>
                  {g.failures.map((f) => <li key={f}>✗ {f}</li>)}
                  {g.unchecked.map((u) => <li key={u}>? {u}</li>)}
                </ul>
              </div>
            ))}
          </details>
        )}
      </section>

      {def.editable && (
        <section className={styles.card} aria-labelledby="datos">
          <h2 id="datos">Datos</h2>
          <AdminForm action={updateFields} hidden={hidden} labels={FIELD_LABELS} submit="Guardar datos">
            <EntityFields entity={entity} row={row} opts={{ placeTypes, cities, neighborhoods, regions }} slugLocked={slugLocked} />
          </AdminForm>
        </section>
      )}

      <section className={styles.card} aria-labelledby="textos">
        <h2 id="textos">Textos por idioma</h2>
        {LOCALES.map((l) => {
          const t = translations[l];
          return (
            <details key={l} className={styles.locale} open={l === 'es'}>
              <summary>{LOCALE_NAME[l]} · {t ? STATUS_LABEL[t.status] : 'sin texto'}</summary>
              <AdminForm action={updateTranslation} hidden={{ ...hidden, locale: l }} labels={FIELD_LABELS} submit={`Guardar texto (${l})`}>
                <Text name="title" value={t?.title} />
                <Area name="description" value={t?.description} rows={3} hint="Resumen corto: aparece en tarjetas y listados." />
                <Area name="content" value={t?.content} rows={8} hint="Texto propio. Separa los párrafos con una línea en blanco." />
                {def.place && <Area name="directions" value={t?.directions} rows={3} hint="Indicaciones en texto para llegar (también sin conexión)." />}
                <Text name="seo_title" value={t?.seo_title} hint="Máx. 70 caracteres." />
                <Area name="seo_description" value={t?.seo_description} rows={2} hint="Máx. 170 caracteres." />
              </AdminForm>
              {t && nextStates('traduccion', t.status).length > 0 && (
                <AdminForm action={updateTranslationStatus} hidden={{ ...hidden, locale: l }} labels={FIELD_LABELS} submit="" className={styles.inline}>
                  {nextStates('traduccion', t.status).map((to) => (
                    <ValueButton key={to} name="to" value={to} secondary={to !== 'publicada'}>{TRANSITION_LABEL[to]}</ValueButton>
                  ))}
                </AdminForm>
              )}
            </details>
          );
        })}
      </section>

      {def.relations.map((r) => (
        <section key={r.key} className={styles.card}>
          <h2>{r.label}</h2>
          {relOptions[r.key].length === 0 ? <p className={styles.muted}>Todavía no hay {ENTITIES[r.other].plural.toLowerCase()}.</p> : (
            <AdminForm action={updateRelations} hidden={{ ...hidden, relation: r.key }} submit="Guardar relaciones">
              <div className={styles.checks}>
                {relOptions[r.key].map((o) => (
                  <label key={o.id} className={styles.check}><input type="checkbox" name="selected" value={o.id} defaultChecked={relations[r.key]?.includes(o.id)} /> {o.label}</label>
                ))}
              </div>
            </AdminForm>
          )}
        </section>
      ))}

      {def.place && <p><a className={styles.secondaryLink} href={`/admin/lugares/${id}/menu`}>Editar menú digital</a></p>}

      {def.place && (
        <section className={styles.card} aria-labelledby="fotos">
          <h2 id="fotos">Fotos</h2>
          <p className={styles.muted}>Con origen, autor, licencia y texto alternativo en español la foto queda aprobada; si falta algo, queda pendiente de moderación. Se reduce, se pasa a WebP y se le quitan los datos ocultos (GPS, cámara).</p>
          {photos.map((p) => (
            <div key={p.id} className={styles.photo}>
              {p.preview && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.preview} alt={p.alts?.es ?? ''} width={160} height={120} />}
              <AdminForm action={editPhoto} hidden={{ ...hidden, photo_id: p.id }} labels={FIELD_LABELS} submit="Guardar foto">
                <p className={styles.meta}><span className={styles[`status_${p.status}`] ?? styles.badge}>{STATUS_LABEL[p.status]}</span>{p.rejection_reason && ` · Motivo: ${p.rejection_reason}`}</p>
                <PhotoRights p={p} />
                <label className={styles.field}><span>Moderación</span>
                  <select name="status" defaultValue={p.status}>
                    {['pendiente', 'aprobada', 'rechazada'].map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </label>
                <Text name="rejection_reason" hint="Obligatorio si la rechazas." />
              </AdminForm>
            </div>
          ))}
          <h3>Subir una foto</h3>
          <AdminForm action={addPhoto} hidden={hidden} labels={FIELD_LABELS} submit="Subir foto" multipart>
            <label className={styles.field}><span>Imagen (JPG, PNG, WebP, HEIC; máx. 10 MB)</span><input type="file" name="file" accept="image/*" required /></label>
            <PhotoRights />
          </AdminForm>
        </section>
      )}

      {def.place && (
        <section className={styles.card} aria-labelledby="mapa">
          <h2 id="mapa">Mapa estático de respaldo (opcional)</h2>
          <p className={styles.muted}>Se muestra si el mapa interactivo no carga (también sin conexión). Usa una imagen propia o con derechos.</p>
          {staticMap && /* eslint-disable-next-line @next/next/no-img-element */ <img src={staticMap} alt="Mapa estático actual" width={240} height={135} className={styles.mapPreview} />}
          <AdminForm action={uploadStaticMap} hidden={hidden} labels={FIELD_LABELS} submit={staticMap ? 'Sustituir imagen' : 'Subir imagen'} multipart>
            <label className={styles.field}><span>Imagen del mapa</span><input type="file" name="file" accept="image/*" required /></label>
          </AdminForm>
        </section>
      )}
    </>
  );
}
