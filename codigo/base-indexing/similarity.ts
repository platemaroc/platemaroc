/**
 * Duplicidad INTERNA entre textos propios (decisión del titular, 30-10-2026): compara grupos de 5 palabras seguidas.
 * Es un criterio interno, no una regla de Google. Las copias en otras webs se revisan con la orden anti-duplicidad-y-google.
 */
export const SIMILARITY_THRESHOLD = 0.6;
const MIN_WORDS = 30;

export function shingles(text: string, size = 5): Set<string> {
  const words = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z0-9]+/g) ?? [];
  const out = new Set<string>();
  for (let i = 0; i + size <= words.length; i++) out.add(words.slice(i, i + size).join(' '));
  return words.length >= MIN_WORDS ? out : new Set();
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let common = 0;
  for (const x of a) if (b.has(x)) common++;
  return common / (a.size + b.size - common);
}

/** Ids de textos demasiado parecidos entre sí. Los textos muy cortos no se comparan (no hay base para decidir). */
export function findDuplicates(texts: { id: string; text: string }[], threshold = SIMILARITY_THRESHOLD): Set<string> {
  const sets = texts.map((t) => ({ id: t.id, s: shingles(t.text) })).filter((t) => t.s.size);
  const dup = new Set<string>();
  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      if (jaccard(sets[i].s, sets[j].s) >= threshold) { dup.add(sets[i].id); dup.add(sets[j].id); }
    }
  }
  return dup;
}
