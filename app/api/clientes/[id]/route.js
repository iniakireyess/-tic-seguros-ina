// =====================================================================
// API CLIENTE INDIVIDUAL  ->  /api/clientes/5
//   GET    : consulta un cliente y sus pólizas (READ)
//   PUT    : modifica el cliente (UPDATE)
//   DELETE : elimina o da de baja (DELETE / UPDATE)
// =====================================================================
import { consultar, ejecutar, error, errorSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const [cliente] = await consultar('SELECT * FROM cliente WHERE id_cliente = ?', [id]);
    if (!cliente) return error('Cliente no encontrado.', 404);

    // JOIN para traer sus pólizas con información útil
    cliente.polizas = await consultar(
      `SELECT p.numero_poliza, p.fecha_inicio, p.fecha_fin, p.estado,
              (SELECT COUNT(*) FROM siniestro s WHERE s.id_poliza = p.id_poliza) AS cant_siniestros
       FROM poliza p
       WHERE p.id_cliente = ?
       ORDER BY p.fecha_inicio DESC`,
      [id]
    );
    return Response.json(cliente);
  } catch (e) {
    return errorSQL(e);
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const d = await request.json();
  const nombre = (d.nombre || '').trim();
  const apellido = (d.apellido || '').trim();
  const dni = (d.dni || '').trim();

  if (!nombre || !apellido || !dni) return error('Nombre, apellido y DNI son obligatorios.');
  if (!/^\d{7,8}$/.test(dni)) return error('El DNI debe tener 7 u 8 números, sin puntos.');

  try {
    const r = await ejecutar(
      `UPDATE cliente
       SET nombre = ?, apellido = ?, dni = ?, email = ?, telefono = ?, activo = ?
       WHERE id_cliente = ?`,
      [nombre, apellido, dni, d.email?.trim() || null, d.telefono?.trim() || null,
       d.activo === 0 ? 0 : 1, id]
    );
    if (r.filasAfectadas === 0) return error('Cliente no encontrado.', 404);
    return Response.json({ ok: true });
  } catch (e) {
    return errorSQL(e);
  }
}

// Regla de negocio:
//  - Si el cliente NO tiene pólizas -> se borra de verdad (DELETE)
//  - Si tiene pólizas -> no se puede borrar sin perder el historial,
//    entonces se hace una BAJA LÓGICA (UPDATE activo = 0)
export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const [{ n }] = await consultar('SELECT COUNT(*) AS n FROM poliza WHERE id_cliente = ?', [id]);

    if (n > 0) {
      await ejecutar('UPDATE cliente SET activo = 0 WHERE id_cliente = ?', [id]);
      return Response.json({ ok: true, accion: 'baja',
        mensaje: `El cliente tiene ${n} póliza(s): se dio de BAJA (no se borró para conservar el historial).` });
    }

    const r = await ejecutar('DELETE FROM cliente WHERE id_cliente = ?', [id]);
    if (r.filasAfectadas === 0) return error('Cliente no encontrado.', 404);
    return Response.json({ ok: true, accion: 'eliminado', mensaje: 'Cliente eliminado.' });
  } catch (e) {
    return errorSQL(e);
  }
}
