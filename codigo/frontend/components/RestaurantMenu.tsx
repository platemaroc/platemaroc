import type { MenuView } from '../../backend/content/index.ts';
import type { Locale } from '../../shared/locales.ts';
import { sectionPath } from '../../shared/routes.ts';
import { EmptyState, Price } from '../../components-ui/mobile-design/ui.tsx';
import { getMessages } from '../i18n/messages.ts';
import { Breadcrumbs } from './content.tsx';
import styles from './menu.module.css';

/**
 * Menú digital: una sola plantilla para todos los restaurantes (decisión del titular, 30-10-2026).
 * Sin JavaScript: las categorías son enlaces a su sección. Precios solo en MAD (docs/12); sin precio, "Precio pendiente".
 */
export function RestaurantMenu({ menu: m, locale }: { menu: MenuView; locale: Locale }) {
  const t = getMessages(locale);
  const placeHref = sectionPath(locale, m.place.section, m.place.slug);
  return (
    <main id="contenido" className={styles.page}>
      <div className={styles.crumbs}>
        <Breadcrumbs label={t.breadcrumb} items={[
          { name: t.nav.home, href: `/${locale}` }, { name: t.sections[m.place.section], href: sectionPath(locale, m.place.section) },
          { name: m.place.name, href: placeHref }, { name: t.menu },
        ]} />
      </div>
      <header className={styles.cover}>
        <h1><small>{t.menu}</small>{m.place.name}</h1>
      </header>
      {m.categories.length === 0 && <EmptyState>{t.noMenu}</EmptyState>}
      {m.categories.length > 1 && (
        <nav className={styles.categories} aria-label={t.menu}>
          <ul>{m.categories.map((c, i) => <li key={i}><a href={`#categoria-${i}`}>{c.name}</a></li>)}</ul>
        </nav>
      )}
      {m.categories.map((c, i) => (
        <section key={i} id={`categoria-${i}`} className={styles.category}>
          <h2>{c.name}</h2>
          <ul>
            {c.items.map((item, j) => (
              <li key={j} className={item.soldOut ? styles.soldOut : undefined}>
                <div className={styles.line}>
                  <h3>{item.name}</h3>
                  <span className={styles.leader} aria-hidden="true" />
                  <Price amountMad={item.priceMad} locale={locale} pendingLabel={t.pricePending} />
                </div>
                {item.soldOut && <strong className={styles.badge}>{t.soldOut}</strong>}
                {item.description && <p>{item.description}</p>}
                {item.allergens.length > 0 && <p className={styles.allergens}>{t.allergens}: {item.allergens.join(', ')}</p>}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className={styles.back}><a href={placeHref}>{t.backToPlace}</a></p>
    </main>
  );
}
