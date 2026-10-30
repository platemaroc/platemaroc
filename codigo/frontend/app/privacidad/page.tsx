import { redirect } from 'next/navigation';
import { DEFAULT_LOCALE, isLocale } from '../../i18n/config.ts';

/** La política vive con las demás páginas del pie. Esta dirección se mantiene porque la enlaza el formulario de reseña. */
export default async function Privacy({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { lang } = await searchParams;
  redirect(`/${isLocale(lang) ? lang : DEFAULT_LOCALE}/info/privacidad`);
}
