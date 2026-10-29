import { supabasePublicConfig } from '../../../../backend/supabase/env.ts';

/**
 * /media/<ruta>: fotos del bucket privado `fotos`. Se piden con la clave PÚBLICA, así que Storage solo entrega las que
 * las políticas permiten ver (foto aprobada de un lugar publicado). Mantiene las imágenes en el propio dominio (CSP img-src 'self').
 */
const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/;

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const config = supabasePublicConfig();
  if (!config || !path.length || !path.every((s) => SAFE_SEGMENT.test(s) && s !== '..')) return new Response(null, { status: 404 });

  const upstream = await fetch(`${config.url}/storage/v1/object/authenticated/fotos/${path.join('/')}`, {
    headers: { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}` },
  });
  const type = upstream.headers.get('content-type') ?? '';
  if (!upstream.ok || !type.startsWith('image/')) return new Response(null, { status: 404 });

  return new Response(upstream.body, {
    headers: {
      'Content-Type': type,
      // Una foto despublicada deja de servirse en como mucho un día.
      'Cache-Control': 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
