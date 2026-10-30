import { headers } from 'next/headers';
import { toScriptJson } from '../../../seo/json-ld.ts';

/** Datos estructurados. Llevan el nonce de la CSP y solo describen lo que se ve en la página. */
export async function JsonLd({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null;
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: toScriptJson(data) }} />;
}
