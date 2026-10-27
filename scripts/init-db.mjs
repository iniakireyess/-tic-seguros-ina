// =====================================================================
// Crea las tablas y carga los datos de prueba.
//
//   npm run db:init
//
// - Si NO hay variables de entorno de Turso -> trabaja sobre seguros.db (local)
// - Si existen TURSO_DATABASE_URL y TURSO_AUTH_TOKEN -> trabaja sobre Turso
//
// Ejecuta los mismos archivos .sql que se entregan en la carpeta /sql,
// así la base local y la publicada quedan idénticas.
// =====================================================================
import { createClient } from '@libsql/client';
import { readFileSync, existsSync } from 'node:fs';

// Carga .env.local si existe (para no tener que exportar variables a mano)
if (existsSync('.env.local')) {
  for (const linea of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const url = process.env.TURSO_DATABASE_URL || 'file:seguros.db';
const authToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient({ url, authToken });

console.log(`Conectando a: ${url.startsWith('file:') ? url : 'Turso (' + url + ')'}`);

for (const archivo of ['sql/01_crear_tablas.sql', 'sql/02_cargar_datos.sql']) {
  const sql = readFileSync(archivo, 'utf8');
  await db.executeMultiple(sql);
  console.log(`  ✔ ${archivo}`);
}

// Verificación: cuántas filas quedaron en cada tabla
for (const tabla of ['cliente', 'cobertura', 'poliza', 'poliza_cobertura', 'pago', 'siniestro']) {
  const r = await db.execute(`SELECT COUNT(*) AS n FROM ${tabla}`);
  console.log(`  ${tabla.padEnd(17)} ${r.rows[0].n} filas`);
}

db.close();
console.log('Base lista.');
