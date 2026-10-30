import { csvTemplate } from '../../../../../backend/admin-moderation/csv-import.ts';
import { requireAdmin } from '../../../../lib/admin.ts';

export async function GET() {
  await requireAdmin('/admin/importar');
  return new Response(csvTemplate(), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="plantilla-lugares.csv"', 'Cache-Control': 'private, no-store' } });
}
