/** Búsqueda pública: compara sin mayúsculas ni acentos, y exige que aparezcan todas las palabras escritas. */
export const MAX_SEARCH_LENGTH = 80;

export const normalizeSearch = (text: string) =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/** Un parámetro de la URL puede faltar o repetirse: solo se acepta un texto, recortado. */
export const cleanSearchParam = (value: unknown) => (typeof value === 'string' ? value.trim().slice(0, MAX_SEARCH_LENGTH) : '');

export function matchesSearch(query: string, fields: (string | null | undefined)[]): boolean {
  const words = normalizeSearch(query).split(' ').filter(Boolean);
  if (!words.length) return true;
  const text = normalizeSearch(fields.filter(Boolean).join(' '));
  return words.every((w) => text.includes(w));
}
