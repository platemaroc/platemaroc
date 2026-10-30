import { NextResponse, type NextRequest } from 'next/server';
import QRCode from 'qrcode';
import { isPlaceSection, MENU_SEGMENT, sectionPath, type PlaceSection } from '../../../../../../../shared/routes.ts';
import { SITE_URL } from '../../../../../../../../seo/types.ts';
import { isLocale } from '../../../../../../i18n/config.ts';
import { requireAdmin } from '../../../../../../lib/admin.ts';
import { supabaseForRequest } from '../../../../../../lib/supabase-server.ts';

/** QR del menú publicado, en PNG, con la dirección definitiva del sitio (nunca la del entorno local). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ entity: string; id: string }> }) {
  const { entity, id } = await params;
  await requireAdmin(`/admin/lugares/${id}/menu`);
  const lang = request.nextUrl.searchParams.get('lang');
  if (entity !== 'lugares' || !isLocale(lang) || !/^[0-9a-f-]{36}$/.test(id)) return new NextResponse(null, { status: 404 });
  const db = await supabaseForRequest();
  const { data: place } = await db.from('places').select('slug,place_types(slug)').eq('id', id).maybeSingle();
  const section = (place?.place_types as unknown as { slug?: string } | null)?.slug as PlaceSection | undefined;
  if (!place || !section || !isPlaceSection(section)) return new NextResponse(null, { status: 404 });
  const png = await QRCode.toBuffer(`${SITE_URL}${sectionPath(lang, section, place.slug, MENU_SEGMENT)}`, { type: 'png', width: 1024, margin: 2, errorCorrectionLevel: 'M' });
  return new NextResponse(new Uint8Array(png), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, no-store' } });
}
