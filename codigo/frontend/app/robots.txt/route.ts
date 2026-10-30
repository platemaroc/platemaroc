import { buildRobotsTxt } from '../../../base-indexing/robots.ts';
import { indexingEnabled } from '../../lib/seo.ts';

// El interruptor se lee en el servidor: si esta ruta se fijara al construir, encenderlo no tendría efecto.
export const dynamic = 'force-dynamic';

/** Interruptor apagado: bloquea todo. Encendido: solo las zonas privadas. */
export function GET() {
  const body = indexingEnabled() ? buildRobotsTxt() : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
