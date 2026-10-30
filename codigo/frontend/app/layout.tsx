import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Fraunces, Manrope } from 'next/font/google';
import { headers } from 'next/headers';
import { DEFAULT_LOCALE, isLocale } from '../i18n/config.ts';
import { RegisterServiceWorker } from '../components/RegisterServiceWorker.tsx';
import { SITE_NAME, SITE_URL } from '../../../seo/types.ts';
import '../../components-ui/mobile-design/tokens.css';
import './globals.css';

// Next.js las descarga al construir y las sirve la propia web: el navegador no contacta con Google.
const fraunces = Fraunces({ subsets: ['latin'], weight: '600', variable: '--font-fraunces', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  // Por defecto, noindex: solo se abre lo que aprueba lib/seo.ts (interruptor encendido y Quality Gate superado, maestro §4).
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f7f2ea' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  // proxy.ts pasa el idioma de la URL; en "/" (selector de idioma) se usa el idioma por defecto.
  const fromUrl = (await headers()).get('x-locale');
  const lang = isLocale(fromUrl) ? fromUrl : DEFAULT_LOCALE;
  return (
    <html lang={lang} className={`${fraunces.variable} ${manrope.variable}`}>
      <body>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
