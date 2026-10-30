import { CSV_COLUMNS } from '../../../../backend/admin-moderation/csv-import.ts';
import { requireAdmin } from '../../../lib/admin.ts';
import { ImportForm } from './ImportForm.tsx';
import styles from '../admin.module.css';

export const metadata = { title: 'Importar lugares' };

/** Importación de lugares (orden importar-lugares). Solo nombre, tipo y ciudad son obligatorios. */
export default async function ImportPage() {
  await requireAdmin('/admin/importar');
  return (
    <>
      <p className={styles.back}><a href="/admin">← Panel</a></p>
      <h1 className={styles.title}>Importar lugares</h1>
      <p className={styles.muted}>Abre la plantilla en Excel, rellénala y guárdala con <strong>Guardar como → CSV UTF-8</strong>. Obligatorias: nombre, tipo y ciudad. El tipo se escribe como en la web (por ejemplo, «Cafés y teterías») y la ciudad debe existir ya en el panel. Horario por día: 9:00–13:00, 16:00–20:00.</p>
      <p><a className={styles.secondaryLink} href="/admin/importar/plantilla" download="plantilla-lugares.csv">Descargar plantilla</a></p>
      <details className={styles.gate}><summary>Columnas</summary><p><code>{CSV_COLUMNS.join(' · ')}</code></p></details>
      <ImportForm />
    </>
  );
}
