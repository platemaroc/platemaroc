import { supabaseForRequest } from '../../lib/supabase-server.ts';
import { requireAdmin } from '../../lib/admin.ts';
import styles from './admin.module.css';

/**
 * Inicio del panel: lo que espera una decisión del titular. Se consulta con SU sesión: las políticas RLS (is_admin)
 * permiten verlo todo; si el rol fallara, los contadores saldrían a 0 en vez de mostrar datos ajenos.
 */
async function count(table: string, filter?: [string, string]) {
  const supabase = await supabaseForRequest();
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = q.eq(filter[0], filter[1]);
  const { count: n, error } = await q;
  return error ? null : (n ?? 0);
}

const CONTENT = [
  ['lugares', 'Lugares'], ['ciudades', 'Ciudades'], ['barrios', 'Barrios'], ['platos', 'Platos'], ['guias', 'Guías'], ['regiones', 'Regiones'],
] as const;

const SECTIONS = [
  { title: 'Menús e importación', block: '4d', text: 'Menú digital en MAD e importación de lugares desde CSV.' },
];

export default async function AdminHome() {
  await requireAdmin();
  const [reviews, photos, drafts, reviewed, translations, replies] = await Promise.all([
    count('reviews', ['status', 'pendiente']), count('photos', ['status', 'pendiente']), count('places', ['status', 'borrador']),
    count('places', ['status', 'revisado']), count('translations', ['status', 'revisada']), count('review_replies', ['status', 'borrador']),
  ]);
  const pending: [string, number | null][] = [
    ['Reseñas por moderar', reviews], ['Fotos por moderar', photos], ['Lugares en borrador', drafts],
    ['Lugares revisados, sin publicar', reviewed], ['Traducciones revisadas, sin publicar', translations], ['Respuestas en borrador', replies],
  ];
  return (
    <>
      <h1 className={styles.title}>Pendiente de tu decisión</h1>
      <ul className={styles.counters}>
        {pending.map(([label, n]) => (
          <li key={label}><strong>{n ?? '—'}</strong><span>{label}</span></li>
        ))}
      </ul>
      <h2 className={styles.subtitle}>Moderación</h2>
      <ul className={styles.sections}>
        <li><a href="/admin/resenas"><strong>Reseñas</strong><span>Aprobar, rechazar con motivo y borradores de respuesta</span></a></li>
        <li><a href="/admin/fotos"><strong>Fotos</strong><span>Derechos, texto alternativo y aprobación</span></a></li>
      </ul>
      <h2 className={styles.subtitle}>Contenido</h2>
      <ul className={styles.sections}>
        {CONTENT.map(([key, label]) => <li key={key}><a href={`/admin/${key}`}><strong>{label}</strong><span>Altas, edición, textos es/en/fr, fotos y estados</span></a></li>)}
      </ul>
      <h2 className={styles.subtitle}>Próximamente</h2>
      <ul className={styles.sections}>
        {SECTIONS.map((s) => (
          <li key={s.title}><strong>{s.title}</strong><span>{s.text}</span><em>Próximamente (bloque {s.block})</em></li>
        ))}
      </ul>
    </>
  );
}
