import type { MetadataRoute } from 'next';
import { SITE_NAME } from '../../../seo/types.ts';

/** Permite añadir la web a la pantalla de inicio. Empieza en el selector de idioma: la instalación no fija ninguno. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: 'Guía gastronómica de Marruecos · Food guide to Morocco · Guide gastronomique du Maroc',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f6f1e4',
    theme_color: '#1f4d3a',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
