import type { Locale } from '../../shared/locales.ts';
import type { PlaceSection } from '../../shared/routes.ts';
import { summarizeApproved } from '../reviews/rating.ts';
import type { ContentSource, PlaceDetail, PlaceSummary, Ref } from './types.ts';

/**
 * Datos de DEMOSTRACIÓN, claramente ficticios (slug `demo-`, nombres "Demo"), para ver las plantillas en desarrollo
 * mientras no hay contenido publicado. Nunca en producción: lo impide `content/index.ts`. No son lugares reales.
 * Las coordenadas apuntan al mar, frente a la costa, a propósito.
 */
type L<T> = Record<Locale, T>;
const all = <T>(es: T, en: T, fr: T): L<T> => ({ es, en, fr });

const CITY = { slug: 'demo-ciudad', name: all('Demo · Ciudad de prueba', 'Demo · Test city', 'Démo · Ville de test'), summary: all('Ciudad ficticia para revisar las plantillas.', 'Fictitious city used to review the templates.', 'Ville fictive pour vérifier les modèles.') };
const HOOD = { slug: 'demo-barrio', name: all('Demo · Barrio de prueba', 'Demo · Test neighbourhood', 'Démo · Quartier de test') };
const DISH = { slug: 'demo-plato', name: all('Demo · Plato de prueba', 'Demo · Test dish', 'Démo · Plat de test'), summary: all('Plato ficticio de demostración.', 'Fictitious demo dish.', 'Plat fictif de démonstration.') };
const GUIDE = { slug: 'demo-guia', name: all('Demo · Guía de prueba', 'Demo · Test guide', 'Démo · Guide de test'), summary: all('Guía ficticia que enlaza los lugares de demostración.', 'Fictitious guide linking the demo places.', 'Guide fictif qui relie les lieux de démonstration.') };

interface DemoPlace {
  slug: string; section: PlaceSection; name: Partial<L<string>>; summary: L<string>; priceRange: number | null;
  ratings: number[]; lat: number | null; lng: number | null; hasMenu: boolean; neighborhood: boolean;
}
const PLACES: DemoPlace[] = [
  { slug: 'demo-restaurante', section: 'restaurantes', name: all('Demo · Restaurante de prueba', 'Demo · Test restaurant', 'Démo · Restaurant de test'),
    summary: all('Ficha ficticia con menú, mapa y reseñas de prueba.', 'Fictitious listing with a test menu, map and reviews.', 'Fiche fictive avec menu, carte et avis de test.'),
    priceRange: 2, ratings: [5, 4, 4], lat: 35.95, lng: -6.3, hasMenu: true, neighborhood: true },
  { slug: 'demo-cafe', section: 'cafes-y-teterias', name: all('Demo · Café de prueba', 'Demo · Test café', 'Démo · Café de test'),
    summary: all('Ficha ficticia sin coordenadas: el mapa muestra el texto alternativo.', 'Fictitious listing without coordinates: the map shows the text fallback.', 'Fiche fictive sans coordonnées : la carte affiche le texte de secours.'),
    priceRange: 1, ratings: [], lat: null, lng: null, hasMenu: false, neighborhood: false },
  // Solo en es/en: sirve para comprobar que /fr/... da 404 y que el selector de idioma no la ofrece en francés.
  { slug: 'demo-panaderia', section: 'pastelerias-y-panaderias', name: { es: 'Demo · Panadería de prueba', en: 'Demo · Test bakery' },
    summary: all('Ficha ficticia publicada solo en español e inglés.', 'Fictitious listing published only in Spanish and English.', ''),
    priceRange: null, ratings: [3], lat: 35.96, lng: -6.31, hasMenu: false, neighborhood: true },
];

const ref = (x: { slug: string; name: Partial<L<string>> }, l: Locale): Ref => ({ slug: x.slug, name: x.name[l] ?? '' });
const localesOf = (p: DemoPlace): Locale[] => (['es', 'en', 'fr'] as Locale[]).filter((l) => p.name[l]);

function summary(p: DemoPlace, l: Locale): PlaceSummary {
  return {
    slug: p.slug, section: p.section, name: p.name[l]!, summary: p.summary[l] || null, city: ref(CITY, l),
    neighborhood: p.neighborhood ? ref(HOOD, l) : null, priceRange: p.priceRange,
    rating: summarizeApproved(p.ratings.map((rating) => ({ status: 'aprobada', rating }))), photo: null,
  };
}
const published = (l: Locale) => PLACES.filter((p) => p.name[l]);

export const demoSource: ContentSource = {
  isDemo: true,

  async listPlaces(l, f = {}) {
    let list = published(l);
    if (f.section) list = list.filter((p) => p.section === f.section);
    if (f.citySlug && f.citySlug !== CITY.slug) return [];
    if (f.neighborhoodSlug) list = f.neighborhoodSlug === HOOD.slug ? list.filter((p) => p.neighborhood) : [];
    return list.slice(0, f.limit).map((p) => summary(p, l));
  },

  async getPlace(l, section, slug): Promise<PlaceDetail | null> {
    const p = published(l).find((x) => x.slug === slug && x.section === section);
    if (!p) return null;
    return {
      ...summary(p, l),
      content: all('Texto de prueba. Aquí irá la descripción propia del lugar.', 'Test text. The place’s own description will go here.', 'Texte de test. La description du lieu viendra ici.')[l],
      lat: p.lat, lng: p.lng, staticMapSrc: null, address: all('Dirección de prueba, 1 (ficticia)', '1 Test address (fictitious)', '1 adresse de test (fictive)')[l],
      directions: p.lat === null ? null : all('Indicaciones de prueba: no corresponden a ningún lugar real.', 'Test directions: they do not match any real place.', 'Indications de test : elles ne correspondent à aucun lieu réel.')[l],
      openingHours: [[all('Lunes a domingo', 'Monday to Sunday', 'Lundi au dimanche')[l], '00:00–00:00 (demo)']],
      reviews: p.ratings.slice(0, 1).map((rating) => ({ author: 'Demo', rating, comment: all('Reseña ficticia de demostración.', 'Fictitious demo review.', 'Avis fictif de démonstration.')[l], locale: l, visitedOn: null, date: '2026-01-01T00:00:00Z', photos: [] })),
      phone: null, website: null, dishes: p.section === 'restaurantes' ? [ref(DISH, l)] : [], hasMenu: p.hasMenu, photos: [], locales: localesOf(p),
    };
  },

  async getMenu(l, section, slug) {
    const p = published(l).find((x) => x.slug === slug && x.section === section && x.hasMenu);
    if (!p) return null;
    return {
      place: { ...ref(p, l), section }, locales: localesOf(p),
      categories: [{
        name: all('Demo · Platos principales', 'Demo · Main courses', 'Démo · Plats principaux')[l],
        items: [
          { name: ref(DISH, l).name, description: DISH.summary[l], priceMad: 120, soldOut: false, allergens: [] },
          { name: all('Demo · Sin precio verificado', 'Demo · No verified price', 'Démo · Prix non vérifié')[l], description: null, priceMad: null, soldOut: false, allergens: [] },
          { name: all('Demo · Bebida de prueba', 'Demo · Test drink', 'Démo · Boisson de test')[l], description: null, priceMad: 35.5, soldOut: true, allergens: [] },
        ],
      }],
    };
  },

  async listDishes(l) { return [{ slug: DISH.slug, name: DISH.name[l], summary: DISH.summary[l] }]; },
  async getDish(l, slug) {
    if (slug !== DISH.slug) return null;
    return { slug, name: DISH.name[l], summary: DISH.summary[l], content: null, ingredients: [all('ingrediente de prueba', 'test ingredient', 'ingrédient de test')[l]],
      region: null, places: published(l).filter((p) => p.section === 'restaurantes').map((p) => summary(p, l)), locales: ['es', 'en', 'fr'] };
  },

  async listGuides(l) { return [{ slug: GUIDE.slug, name: GUIDE.name[l], summary: GUIDE.summary[l] }]; },
  async getGuide(l, slug) {
    if (slug !== GUIDE.slug) return null;
    return { slug, name: GUIDE.name[l], summary: GUIDE.summary[l], content: null, author: 'Demo',
      places: published(l).map((p) => summary(p, l)), dishes: [ref(DISH, l)], cities: [ref(CITY, l)], neighborhoods: [{ ...ref(HOOD, l), city: CITY.slug }], locales: ['es', 'en', 'fr'] };
  },

  async listCities(l) { return [{ slug: CITY.slug, name: CITY.name[l], summary: CITY.summary[l] }]; },
  async getCity(l, slug) {
    if (slug !== CITY.slug) return null;
    return { slug, name: CITY.name[l], summary: CITY.summary[l], content: null, neighborhoods: [ref(HOOD, l)], places: published(l).map((p) => summary(p, l)), locales: ['es', 'en', 'fr'] };
  },
  // Los datos demo nunca se indexan.
  async seoInfo() { return { indexableLocales: [], title: null, description: null }; },
  async listIndexable() { return []; },

  async getNeighborhood(l, citySlug, slug) {
    if (citySlug !== CITY.slug || slug !== HOOD.slug) return null;
    return { slug, name: HOOD.name[l], summary: null, content: null, city: ref(CITY, l), places: published(l).filter((p) => p.neighborhood).map((p) => summary(p, l)), locales: ['es', 'en', 'fr'] };
  },
};
