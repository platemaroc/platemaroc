import path from 'node:path';
import type { NextConfig } from 'next';

// Raíz del repositorio: la app importa código de codigo/shared, codigo/security, codigo/base-indexing y seo/.
const repoRoot = path.join(__dirname, '../..');

const nextConfig: NextConfig = {
  // Renderizado en servidor; sin exportación estática (README).
  poweredByHeader: false,
  turbopack: { root: repoRoot },
  outputFileTracingRoot: repoRoot,
  // Fotos del panel: hasta 10 MB por imagen (images.ts) más el margen del formulario. Por defecto Next.js corta en 1 MB.
  experimental: { serverActions: { bodySizeLimit: '11mb' } },
  async headers() {
    // Las páginas reciben todas las cabeceras (CSP con nonce) en proxy.ts. Aquí solo lo que no pasa por el proxy.
    const base = [
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
    ];
    return [
      { source: '/_next/static/:path*', headers: base },
      // El navegador debe comprobar siempre si hay una versión nueva del Service Worker (docs/10).
      { source: '/sw.js', headers: [...base, { key: 'Cache-Control', value: 'no-cache' }] },
    ];
  },
};

export default nextConfig;
