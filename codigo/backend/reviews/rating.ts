/** Valoración media: SOLO reseñas aprobadas (maestro §3). Puntuación única de 1 a 5 estrellas. */
export interface ReviewLike { status: string; rating: number }

export function summarizeApproved(reviews: ReviewLike[]): { count: number; average: number | null } {
  const ok = reviews.filter((r) => r.status === 'aprobada' && Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5);
  if (ok.length === 0) return { count: 0, average: null };
  const sum = ok.reduce((a, r) => a + r.rating, 0);
  return { count: ok.length, average: Math.round((sum / ok.length) * 10) / 10 };
}
