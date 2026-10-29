import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { isLocale } from '../../i18n/config.ts';

/** Solo es/en/fr: cualquier otro prefijo (p. ej. /ar) es 404. */
export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return children;
}
