'use client';
import { startTransition, useActionState, useState, type FormEvent } from 'react';
import type { ImportState } from '../actions.ts';
import { confirmImport, previewCsv } from '../actions.ts';
import styles from '../admin.module.css';

/** Importación en dos pasos: vista previa (no guarda nada) y confirmación. El servidor revalida el archivo al confirmar. */
export function ImportForm() {
  const [preview, doPreview, previewing] = useActionState(previewCsv, {} as ImportState);
  const [done, doConfirm, confirming] = useActionState(confirmImport, {} as ImportState);
  const [key, setKey] = useState(0);
  const send = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => doPreview(data));
  };
  const report = preview.report;
  return (
    <>
      <form onSubmit={send} className={styles.form} key={key}>
        <label className={styles.field}><span>Archivo CSV (máx. 1 MB y 2000 filas)</span><input type="file" name="file" accept=".csv,text/csv" required /></label>
        <button type="submit" className={styles.primary} disabled={previewing}>{previewing ? 'Revisando…' : 'Revisar archivo'}</button>
      </form>
      {preview.error && <p role="alert" className={styles.errors}>{preview.error}</p>}
      {report && !done.created && (
        <section className={styles.card}>
          <h2>Vista previa</h2>
          <p><strong>{report.rows.length}</strong> se crearán · <strong>{report.duplicates.length}</strong> duplicados (se omiten) · <strong>{report.errors.length}</strong> con errores (se omiten)</p>
          {report.errors.length > 0 && <ul className={styles.errors}>{report.errors.map((e) => <li key={e.line}>Fila {e.line}: {e.message}</li>)}</ul>}
          {report.duplicates.length > 0 && <ul>{report.duplicates.map((d) => <li key={d.line}>Fila {d.line}: «{d.name}» ya existe ({d.slug})</li>)}</ul>}
          {report.rows.length > 0 && <ul>{report.rows.slice(0, 20).map((r) => <li key={r.line}>{r.name} <code>{r.slug}</code></li>)}</ul>}
          {report.rows.length > 20 && <p className={styles.muted}>… y {report.rows.length - 20} más.</p>}
          {report.rows.length > 0 && (
            <form action={doConfirm}>
              <textarea name="csv" defaultValue={preview.csv} hidden readOnly />
              <button type="submit" className={styles.primary} disabled={confirming}>{confirming ? 'Importando…' : `Crear ${report.rows.length} lugares en borrador`}</button>
            </form>
          )}
        </section>
      )}
      {done.error && <p role="alert" className={styles.errors}>{done.error}</p>}
      {!!done.created && (
        <section className={styles.card}>
          <p role="status" className={styles.saved}>{done.created} lugares creados en borrador. Ninguno es visible hasta que lo publiques.</p>
          <p className={styles.inline}><a className={styles.primaryLink} href="/admin/lugares?estado=borrador">Ver lugares</a> <button type="button" className={styles.secondary} onClick={() => setKey((k) => k + 1)}>Importar otro</button></p>
        </section>
      )}
    </>
  );
}
