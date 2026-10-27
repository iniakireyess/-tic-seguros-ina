// =====================================================================
// Conexión a la base de datos
// ---------------------------------------------------------------------
// Usamos @libsql/client, que habla con SQLite local Y con Turso.
//  - En tu PC (sin variables de entorno)  -> archivo seguros.db
//  - En Vercel (con TURSO_DATABASE_URL)   -> base Turso en la nube
// El resto del código no cambia: siempre se escribe SQL normal.
// =====================================================================
import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || 'file:seguros.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient({ url, authToken });

// Ejecuta una consulta y devuelve las filas como objetos comunes
// Ejemplo: await consultar('SELECT * FROM cliente WHERE id_cliente = ?', [3])
export async function consultar(sql, args = []) {
  const r = await db.execute({ sql, args });
  return r.rows.map((fila) =>
    Object.fromEntries(r.columns.map((col) => [col, fila[col]]))
  );
}

// Ejecuta un INSERT / UPDATE / DELETE y devuelve info útil
export async function ejecutar(sql, args = []) {
  const r = await db.execute({ sql, args });
  return {
    filasAfectadas: r.rowsAffected,
    idNuevo: r.lastInsertRowid !== undefined ? Number(r.lastInsertRowid) : null,
  };
}

// Respuesta de error en formato JSON (la usan todas las rutas de la API)
export function error(mensaje, status = 400) {
  return Response.json({ error: mensaje }, { status });
}

// Traduce errores de SQLite a mensajes entendibles para el usuario
export function errorSQL(e) {
  const msg = String(e?.message || e);
  if (msg.includes('UNIQUE') && msg.includes('dni')) return error('Ya existe un cliente con ese DNI.', 409);
  if (msg.includes('UNIQUE') && msg.includes('numero_poliza')) return error('Ya existe una póliza con ese número.', 409);
  if (msg.includes('CHECK')) return error('Algún dato no cumple las reglas de la base (revisá fechas, estado o tipo).', 400);
  console.error(e);
  return error('Error en la base de datos: ' + msg, 500);
}
