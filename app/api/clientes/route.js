// =====================================================================
// API CLIENTES  ->  /api/clientes
//   GET  : lista clientes (READ). Acepta ?buscar=texto  y  ?activos=1
//   POST : crea un cliente (CREATE -> INSERT)
// =====================================================================
import { consultar, ejecutar, error, errorSQL } from '@/lib/db';

export const dynamic = 'force-dynamic'; // nunca cachear: siempre leer la base

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const buscar = (searchParams.get('buscar') || '').trim();
  const soloActivos = searchParams.get('activos') === '1';

  // Se arma el WHERE según los filtros. Los valores van con "?" (parámetros)
  // y nunca pegados en el texto del SQL: así se evita la inyección SQL.
  const condiciones = [];
  const args = [];
  if (buscar) {
    condiciones.push('(c.apellido LIKE ? OR c.nombre LIKE ? OR c.dni LIKE ?)');
    args.push(`${buscar}%`, `${buscar}%`, `${buscar}%`);
  }
  if (soloActivos) condiciones.push('c.activo = 1');
  const where = condiciones.length ? 'WHERE ' + condiciones.join(' AND ') : '';

  try {
    const clientes = await consultar(
      `SELECT c.*,
              (SELECT COUNT(*) FROM poliza p WHERE p.id_cliente = c.id_cliente) AS cant_polizas
       FROM cliente c
       ${where}
       ORDER BY c.apellido, c.nombre`,
      args
    );
    return Response.json(clientes);
  } catch (e) {
    return errorSQL(e);
  }
}

export async function POST(request) {
  const d = await request.json();
  const nombre = (d.nombre || '').trim();
  const apellido = (d.apellido || '').trim();
  const dni = (d.dni || '').trim();

  if (!nombre || !apellido || !dni) return error('Nombre, apellido y DNI son obligatorios.');
  if (!/^\d{7,8}$/.test(dni)) return error('El DNI debe tener 7 u 8 números, sin puntos.');

  try {
    const r = await ejecutar(
      `INSERT INTO cliente (nombre, apellido, dni, email, telefono)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, apellido, dni, d.email?.trim() || null, d.telefono?.trim() || null]
    );
    return Response.json({ ok: true, id_cliente: r.idNuevo }, { status: 201 });
  } catch (e) {
    return errorSQL(e);
  }
}
