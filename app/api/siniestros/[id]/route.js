// =====================================================================
// API SINIESTRO INDIVIDUAL  ->  /api/siniestros/8
//   GET    : consulta un siniestro (READ)
//   PUT    : modifica el siniestro, ej. ABIERTO -> CERRADO (UPDATE)
//   DELETE : elimina el siniestro (DELETE)
// =====================================================================
import { consultar, ejecutar, error, errorSQL } from '@/lib/db';
import { validarSiniestro } from '@/lib/validaciones';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const [siniestro] = await consultar(
      `SELECT s.*, p.numero_poliza, c.apellido || ', ' || c.nombre AS cliente
       FROM siniestro s
       INNER JOIN poliza  p ON p.id_poliza  = s.id_poliza
       INNER JOIN cliente c ON c.id_cliente = p.id_cliente
       WHERE s.id_siniestro = ?`,
      [id]
    );
    if (!siniestro) return error('Siniestro no encontrado.', 404);
    return Response.json(siniestro);
  } catch (e) {
    return errorSQL(e);
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const d = await request.json();

  const problema = await validarSiniestro(d);
  if (problema) return error(problema);

  try {
    const r = await ejecutar(
      `UPDATE siniestro
       SET id_poliza = ?, fecha = ?, tipo = ?, descripcion = ?, estado = ?
       WHERE id_siniestro = ?`,
      [d.id_poliza, d.fecha, d.tipo, d.descripcion?.trim() || null, d.estado, id]
    );
    if (r.filasAfectadas === 0) return error('Siniestro no encontrado.', 404);
    return Response.json({ ok: true });
  } catch (e) {
    return errorSQL(e);
  }
}

// Un siniestro no tiene tablas que dependan de él, se puede borrar directo
export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const r = await ejecutar('DELETE FROM siniestro WHERE id_siniestro = ?', [id]);
    if (r.filasAfectadas === 0) return error('Siniestro no encontrado.', 404);
    return Response.json({ ok: true, mensaje: 'Siniestro eliminado.' });
  } catch (e) {
    return errorSQL(e);
  }
}
