// API COBERTURAS -> /api/coberturas  (catálogo para el formulario de pólizas)
import { consultar, errorSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return Response.json(await consultar('SELECT * FROM cobertura ORDER BY id_cobertura'));
  } catch (e) {
    return errorSQL(e);
  }
}
