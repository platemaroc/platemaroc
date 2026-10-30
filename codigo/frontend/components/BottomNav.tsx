'use client';
import { usePathname } from 'next/navigation';
import type { Locale } from '../../shared/locales.ts';
import { isPlaceSection, sectionFromSegment, sectionPath, type Section } from '../../shared/routes.ts';
import { Icon, type IconName } from './icons.tsx';
import styles from './components.module.css';

type Tab = 'home' | 'places' | 'dishes' | 'guides' | 'cities';
const ICONS: Record<Tab, IconName> = { home: 'home', places: 'pin', dishes: 'dish', guides: 'book', cities: 'city' };
const TABS: [Tab, Section | null][] = [['home', null], ['places', 'lugares'], ['dishes', 'platos-tipicos'], ['guides', 'guias-gastronomicas'], ['cities', 'ciudades-y-barrios']];

function activeTab(locale: Locale, pathname: string): Tab {
  const segment = pathname.split('/')[2];
  if (!segment) return 'home';
  const section = sectionFromSegment(locale, segment);
  if (!section) return 'home';
  if (section === 'lugares' || isPlaceSection(section)) return 'places';
  return TABS.find(([, s]) => s === section)?.[0] ?? 'home';
}

/** Barra fija inferior (decisión del titular, 29-10-2026): Inicio, Lugares, Platos, Guías y Ciudades. En escritorio la sustituye el menú de SiteHeader. */
export function BottomNav({ locale, labels, ariaLabel }: { locale: Locale; labels: Record<Tab, string>; ariaLabel: string }) {
  const active = activeTab(locale, usePathname() ?? '');
  return (
    <nav className={styles.bottomNav} aria-label={ariaLabel}>
      <ul>
        {TABS.map(([tab, section]) => (
          <li key={tab}>
            <a href={section ? sectionPath(locale, section) : `/${locale}`} aria-current={tab === active ? 'page' : undefined}><Icon name={ICONS[tab]} />{labels[tab]}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
