import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { DEFAULT_LOCALE, isLocale } from '../i18n/config.ts';
import { RegisterServiceWorker } from '../components/RegisterServiceWorker.tsx';
import { SITE_NAME, SITE_URL } from '../../../seo/types.ts';
import '../../components-ui/mobile-design/tokens.css';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  // Por defecto, noindex: solo se abre lo que aprueba lib/seo.ts (interruptor encendido y Quality Gate superado, maestro §4).
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#ffffff' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  // proxy.ts pasa el idioma de la URL; en "/" (selector de idioma) se usa el idioma por defecto.
  const fromUrl = (await headers()).get('x-locale');
  const lang = isLocale(fromUrl) ? fromUrl : DEFAULT_LOCALE;
  return (
    <html lang={lang}>
      <body>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
