// =====================================================================
// API SINIESTROS  ->  /api/siniestros
//   GET  : lista siniestros con póliza y cliente (JOIN de 3 tablas)
//          Filtros: ?buscar=  ?estado=  ?tipo=
//   POST : registra un siniestro (INSERT)
// =====================================================================
import { consultar, ejecutar, error, errorSQL } from '@/lib/db';
import { validarSiniestro } from '@/lib/validaciones';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const buscar = (searchParams.get('buscar') || '').trim();
  const estado = searchParams.get('estado') || '';
  const tipo = searchParams.get('tipo') || '';

  const condiciones = [];
  const args = [];
  if (buscar) {
    condiciones.push('(p.numero_poliza LIKE ? OR c.apellido LIKE ? OR s.descripcion LIKE ?)');
    args.push(`%${buscar}%`, `${buscar}%`, `%${buscar}%`);
  }
  if (estado) { condiciones.push('s.estado = ?'); args.push(estado); }
  if (tipo) { condiciones.push('s.tipo = ?'); args.push(tipo); }
  const where = condiciones.length ? 'WHERE ' + condiciones.join(' AND ') : '';

  try {
    const siniestros = await consultar(
      `SELECT s.id_siniestro, s.id_poliza, s.fecha, s.tipo, s.descripcion, s.estado,
              p.numero_poliza,
              c.apellido || ', ' || c.nombre AS cliente
       FROM siniestro s
       INNER JOIN poliza  p ON p.id_poliza  = s.id_poliza
       INNER JOIN cliente c ON c.id_cliente = p.id_cliente
       ${where}
       ORDER BY s.fecha DESC, s.id_siniestro DESC`,
      args
    );
    return Response.json(siniestros);
  } catch (e) {
    return errorSQL(e);
  }
}

export async function POST(request) {
  const d = await request.json();
  d.estado = d.estado || 'ABIERTO';

  const problema = await validarSiniestro(d);
  if (problema) return error(problema);

  try {
    const r = await ejecutar(
      `INSERT INTO siniestro (id_poliza, fecha, tipo, descripcion, estado)
       VALUES (?, ?, ?, ?, ?)`,
      [d.id_poliza, d.fecha, d.tipo, d.descripcion?.trim() || null, d.estado]
    );
    return Response.json({ ok: true, id_siniestro: r.idNuevo }, { status: 201 });
  } catch (e) {
    return errorSQL(e);
  }
}
