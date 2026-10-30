import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { isLocale } from '../../i18n/config.ts';
import { getMessages } from '../../i18n/messages.ts';
import { BottomNav } from '../../components/BottomNav.tsx';
import { SiteFooter } from '../../components/SiteFooter.tsx';
import { DemoBanner } from '../../components/content.tsx';
import { OfflineBanner } from '../../maps/OfflineBanner.tsx';
import { isDemo } from '../../lib/data.ts';
import styles from './templates.module.css';

/** Solo es/en/fr: cualquier otro prefijo (p. ej. /ar) es 404. Marco común: aviso demo, contenido, barra inferior y aviso offline. */
export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);
  return (
    <div className={styles.frame}>
      {isDemo() && <DemoBanner locale={locale} />}
      {children}
      <SiteFooter locale={locale} />
      <BottomNav locale={locale} labels={t.nav} ariaLabel={t.primaryNav} />
      <OfflineBanner locale={locale} />
    </div>
  );
}
