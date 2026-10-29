import { LOCALES, type Locale } from '../../shared/locales.ts';

/**
 * SUGERENCIA de idioma a partir de `Accept-Language` (ayuda UX, maestro §13).
 * No redirige por sí sola: la web debe poder abrirse en cualquier idioma sin redirecciones forzadas.
 * Revisar con la documentación técnica/SEO vigente antes de usarla en middleware.
 */
export function suggestLocale(acceptLanguage: string | null | undefined): Locale | null {
  if (!acceptLanguage) return null;
  const ranked = acceptLanguage.split(',').map((part) => {
    const [tag, ...params] = part.trim().split(';');
    const q = Number(params.find((p) => p.trim().startsWith('q='))?.split('=')[1] ?? 1);
    return { base: tag.trim().toLowerCase().split('-')[0], q: Number.isFinite(q) ? q : 0 };
  }).filter((x) => x.q > 0).sort((a, b) => b.q - a.q);
  for (const { base } of ranked) if ((LOCALES as readonly string[]).includes(base)) return base as Locale;
  return null;
}
