/**
 * Máquinas de estado (docs/01-documento-maestro-operacion.md §3).
 * Principio: nada se publica, archiva ni despublica sin aprobación del titular/administración;
 * Claude Code y el sistema no pueden hacerlo por iniciativa propia (maestro §1.1-1.2).
 */
export type Actor = 'titular' | 'admin' | 'claude_code' | 'sistema';
export type StateKind = 'contenido' | 'traduccion' | 'resena' | 'respuesta' | 'foto' | 'menu';

const EDGES: Record<StateKind, Record<string, string[]>> = {
  contenido:  { borrador: ['revisado'], revisado: ['borrador', 'publicado'], publicado: ['revisado', 'archivado'], archivado: ['borrador'] },
  traduccion: { borrador: ['revisada'], revisada: ['borrador', 'publicada'], publicada: ['revisada'] },
  resena:     { pendiente: ['aprobada', 'rechazada'], aprobada: ['pendiente'], rechazada: ['pendiente'] },
  respuesta:  { borrador: ['aprobada_por_titular'], aprobada_por_titular: ['borrador', 'publicada'], publicada: ['borrador'] },
  foto:       { pendiente: ['aprobada', 'rechazada'], aprobada: ['pendiente'], rechazada: ['pendiente'] },
  menu:       { borrador: ['revisado'], revisado: ['borrador', 'publicado'], publicado: ['revisado', 'archivado'], archivado: ['borrador'] },
};

/** Estados que hacen público algo (o lo retiran): requieren titular/administración. */
const PUBLIC_TARGETS: Partial<Record<StateKind, string[]>> = {
  contenido: ['publicado', 'archivado'], traduccion: ['publicada'], resena: ['aprobada'],
  respuesta: ['aprobada_por_titular', 'publicada'], foto: ['aprobada'], menu: ['publicado', 'archivado'],
};
/** Salir de un estado público (despublicar) también requiere aprobación. */
const PUBLIC_STATES: Partial<Record<StateKind, string[]>> = {
  contenido: ['publicado'], traduccion: ['publicada'], resena: ['aprobada'], respuesta: ['publicada'], foto: ['aprobada'], menu: ['publicado'],
};

export interface TransitionCheck { allowed: boolean; reason?: string }

export function canTransition(kind: StateKind, from: string, to: string, actor: Actor, opts: { reason?: string } = {}): TransitionCheck {
  if (!EDGES[kind][from]?.includes(to)) return { allowed: false, reason: `Transición no permitida: ${kind} ${from} → ${to}` };
  const approver = actor === 'titular' || actor === 'admin';
  const touchesPublic = PUBLIC_TARGETS[kind]?.includes(to) || PUBLIC_STATES[kind]?.includes(from);
  if (touchesPublic && !approver) return { allowed: false, reason: `${actor} no puede hacer esta transición: requiere aprobación del titular` };
  // Un rechazo conserva siempre su motivo (maestro §3, reseñas/fotos).
  if (to === 'rechazada' && !opts.reason?.trim()) return { allowed: false, reason: 'El rechazo requiere un motivo' };
  return { allowed: true };
}
