import type { PlaceSection } from '../../shared/routes.ts';

/** Iconos propios, dentro de la página: ninguna descarga ni dependencia. Decorativos: el texto de al lado da el nombre. */
const PATHS = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  pin: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  dish: 'M3 11h18a9 9 0 0 1-18 0z M8 20h8 M9 7c0-1 1-1 1-2 M14 7c0-1 1-1 1-2',
  book: 'M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z',
  city: 'M4 21V9l6-4v16 M10 21V3h10v18 M2 21h20 M14 8h2 M14 12h2 M14 16h2',
  utensils: 'M7 3v8 M4 3v5a3 3 0 0 0 6 0V3 M7 11v10 M17 3c-2 1-3 4-3 7v2h3 M17 3v18',
  cup: 'M4 9h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z M17 10h2a2 2 0 0 1 0 5h-2 M8 3v3 M12 3v3',
  flame: 'M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 3-7 1 1 2 2 3 2 0-2 0-4 0-6z',
  store: 'M4 10v10h16V10 M3 10l2-6h14l2 6 M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0 M10 20v-5h4v5',
} as const;

export type IconName = keyof typeof PATHS;

export const PLACE_ICON: Record<PlaceSection, IconName> = {
  restaurantes: 'utensils', 'cafes-y-teterias': 'cup', 'comida-callejera': 'flame', 'mercados-y-zocos': 'store',
};

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
