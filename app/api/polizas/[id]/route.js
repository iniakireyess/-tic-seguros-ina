// =====================================================================
// API PÓLIZA INDIVIDUAL  ->  /api/polizas/3
//   GET    : consulta la póliza con cliente, coberturas, siniestros y pagos
//   PUT    : modifica la póliza y reemplaza sus coberturas (UPDATE)
//   DELETE : elimina o cancela (DELETE / UPDATE)
// =====================================================================
import { db, consultar, ejecutar, error, errorSQL } from '@/lib/db';
import { validarPoliza } from '@/lib/validaciones';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const [poliza] = await consultar(
      `SELECT p.*, c.apellido || ', ' || c.nombre AS cliente, c.dni
       FROM poliza p
       INNER JOIN cliente c ON c.id_cliente = p.id_cliente
       WHERE p.id_poliza = ?`,
      [id]
    );
    if (!poliza) return error('Póliza no encontrada.', 404);

    poliza.coberturas = await consultar(
      `SELECT pc.id_cobertura, co.nombre, pc.suma_asegurada
       FROM poliza_cobertura pc
       INNER JOIN cobertura co ON co.id_cobertura = pc.id_cobertura
       WHERE pc.id_poliza = ?
       ORDER BY co.nombre`,
      [id]
    );
    poliza.siniestros = await consultar(
      'SELECT id_siniestro, fecha, tipo, estado FROM siniestro WHERE id_poliza = ? ORDER BY fecha DESC',
      [id]
    );
    poliza.pagos = await consultar(
      'SELECT id_pago, fecha, importe, estado FROM pago WHERE id_poliza = ? ORDER BY fecha DESC',
      [id]
    );
    return Response.json(poliza);
  } catch (e) {
    return errorSQL(e);
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const d = await request.json();

  const problema = await validarPoliza(d);
  if (problema) return error(problema);
  const numero = (d.numero_poliza || '').trim().toUpperCase();
  if (!numero) return error('El número de póliza es obligatorio.');

  try {
    const [existe] = await consultar('SELECT id_poliza FROM poliza WHERE id_poliza = ?', [id]);
    if (!existe) return error('Póliza no encontrada.', 404);

    // Transacción: se actualiza la póliza y se reemplazan sus coberturas
    await db.batch([
      {
        sql: `UPDATE poliza
              SET numero_poliza = ?, id_cliente = ?, fecha_inicio = ?, fecha_fin = ?, estado = ?
              WHERE id_poliza = ?`,
        args: [numero, d.id_cliente, d.fecha_inicio, d.fecha_fin, d.estado, id],
      },
      { sql: 'DELETE FROM poliza_cobertura WHERE id_poliza = ?', args: [id] },
      ...(d.coberturas || []).map((cob) => ({
        sql: 'INSERT INTO poliza_cobertura (id_poliza, id_cobertura, suma_asegurada) VALUES (?, ?, ?)',
        args: [id, cob.id_cobertura, Number(cob.suma_asegurada)],
      })),
    ], 'write');

    return Response.json({ ok: true });
  } catch (e) {
    return errorSQL(e);
  }
}

// Regla de negocio:
//  - Si la póliza tiene siniestros o pagos -> se CANCELA (UPDATE estado)
//    porque esos registros dependen de ella (FK) y son historial.
//  - Si no tiene nada asociado -> se borra (primero sus coberturas).
export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const [{ sin, pag }] = await consultar(
      `SELECT (SELECT COUNT(*) FROM siniestro WHERE id_poliza = ?) AS sin,
              (SELECT COUNT(*) FROM pago      WHERE id_poliza = ?) AS pag`,
      [id, id]
    );

    if (sin > 0 || pag > 0) {
      await ejecutar("UPDATE poliza SET estado = 'CANCELADA' WHERE id_poliza = ?", [id]);
      return Response.json({ ok: true, accion: 'cancelada',
        mensaje: `La póliza tiene ${sin} siniestro(s) y ${pag} pago(s): se marcó como CANCELADA en lugar de borrarla.` });
    }

    const r = await db.batch([
      { sql: 'DELETE FROM poliza_cobertura WHERE id_poliza = ?', args: [id] },
      { sql: 'DELETE FROM poliza WHERE id_poliza = ?', args: [id] },
    ], 'write');
    if (r[1].rowsAffected === 0) return error('Póliza no encontrada.', 404);
    return Response.json({ ok: true, accion: 'eliminada', mensaje: 'Póliza eliminada.' });
  } catch (e) {
    return errorSQL(e);
  }
}
