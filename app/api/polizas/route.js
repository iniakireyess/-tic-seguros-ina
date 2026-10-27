// =====================================================================
// API PÓLIZAS  ->  /api/polizas
//   GET  : lista pólizas con el nombre del cliente (JOIN). ?buscar= ?estado=
//   POST : crea una póliza y sus coberturas (INSERT)
// =====================================================================
import { db, consultar, error, errorSQL } from '@/lib/db';
import { validarPoliza } from '@/lib/validaciones';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const buscar = (searchParams.get('buscar') || '').trim();
  const estado = searchParams.get('estado') || '';

  const condiciones = [];
  const args = [];
  if (buscar) {
    condiciones.push('(p.numero_poliza LIKE ? OR c.apellido LIKE ? OR c.dni LIKE ?)');
    args.push(`%${buscar}%`, `${buscar}%`, `${buscar}%`);
  }
  if (estado) {
    condiciones.push('p.estado = ?');
    args.push(estado);
  }
  const where = condiciones.length ? 'WHERE ' + condiciones.join(' AND ') : '';

  try {
    // JOIN cliente + póliza: se muestra el nombre del cliente, no su id
    const polizas = await consultar(
      `SELECT p.id_poliza, p.numero_poliza, p.id_cliente,
              c.apellido || ', ' || c.nombre AS cliente, c.dni,
              p.fecha_inicio, p.fecha_fin, p.estado,
              (SELECT COUNT(*) FROM poliza_cobertura pc WHERE pc.id_poliza = p.id_poliza) AS cant_coberturas
       FROM poliza p
       INNER JOIN cliente c ON c.id_cliente = p.id_cliente
       ${where}
       ORDER BY p.fecha_inicio DESC, p.id_poliza DESC`,
      args
    );
    return Response.json(polizas);
  } catch (e) {
    return errorSQL(e);
  }
}

export async function POST(request) {
  const d = await request.json();
  d.estado = d.estado || 'ACTIVA';

  const problema = await validarPoliza(d);
  if (problema) return error(problema);

  const [cli] = await consultar('SELECT activo FROM cliente WHERE id_cliente = ?', [d.id_cliente]);
  if (cli.activo === 0) return error('El cliente está dado de baja: reactivalo antes de crearle una póliza.');

  try {
    // Si no escribieron número, se genera uno: AP-2026-0013
    let numero = (d.numero_poliza || '').trim().toUpperCase();
    if (!numero) {
      const [{ siguiente }] = await consultar('SELECT COALESCE(MAX(id_poliza), 0) + 1 AS siguiente FROM poliza');
      numero = `AP-${d.fecha_inicio.slice(0, 4)}-${String(siguiente).padStart(4, '0')}`;
    }

    // batch = TRANSACCIÓN: se guarda la póliza Y sus coberturas, o nada.
    // Para las coberturas se busca el id de la póliza recién creada por su número.
    await db.batch([
      {
        sql: `INSERT INTO poliza (numero_poliza, id_cliente, fecha_inicio, fecha_fin, estado)
              VALUES (?, ?, ?, ?, ?)`,
        args: [numero, d.id_cliente, d.fecha_inicio, d.fecha_fin, d.estado],
      },
      ...(d.coberturas || []).map((cob) => ({
        sql: `INSERT INTO poliza_cobertura (id_poliza, id_cobertura, suma_asegurada)
              VALUES ((SELECT id_poliza FROM poliza WHERE numero_poliza = ?), ?, ?)`,
        args: [numero, cob.id_cobertura, Number(cob.suma_asegurada)],
      })),
    ], 'write');

    return Response.json({ ok: true, numero_poliza: numero }, { status: 201 });
  } catch (e) {
    return errorSQL(e);
  }
}
