// =====================================================================
// API DASHBOARD  ->  /api/dashboard
// Todos los valores salen de consultas SQL en el momento: no hay ningún
// número escrito a mano en el código.
// =====================================================================
import { consultar, errorSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Devuelve el primer valor de la primera fila (para los COUNT/SUM)
async function valor(sql) {
  const [fila] = await consultar(sql);
  return Object.values(fila)[0] ?? 0;
}

export async function GET() {
  try {
    // Se lanzan todas las consultas a la vez y se espera a que terminen
    const [
      clientes, polizasActivas, siniestrosAbiertos, siniestrosCerrados,
      totalCobrado, pagosVencidos,
      polizasPorEstado, siniestrosPorTipo, siniestrosPorMes,
    ] = await Promise.all([
      valor('SELECT COUNT(*) FROM cliente WHERE activo = 1'),
      valor("SELECT COUNT(*) FROM poliza WHERE estado = 'ACTIVA'"),
      valor("SELECT COUNT(*) FROM siniestro WHERE estado = 'ABIERTO'"),
      valor("SELECT COUNT(*) FROM siniestro WHERE estado = 'CERRADO'"),
      valor("SELECT COALESCE(SUM(importe), 0) FROM pago WHERE estado = 'PAGADO'"),
      valor("SELECT COUNT(*) FROM pago WHERE estado = 'VENCIDO'"),

      // Gráfico 1: Pólizas por estado
      consultar(`SELECT estado AS etiqueta, COUNT(*) AS cantidad
                 FROM poliza GROUP BY estado ORDER BY cantidad DESC`),
      // Gráfico 2: Siniestros por tipo
      consultar(`SELECT tipo AS etiqueta, COUNT(*) AS cantidad
                 FROM siniestro GROUP BY tipo ORDER BY cantidad DESC`),
      // Gráfico 3: Siniestros por mes  ('2026-04-27' -> '2026-04')
      consultar(`SELECT strftime('%Y-%m', fecha) AS etiqueta, COUNT(*) AS cantidad
                 FROM siniestro GROUP BY etiqueta ORDER BY etiqueta`),
    ]);

    return Response.json({
      indicadores: { clientes, polizasActivas, siniestrosAbiertos, siniestrosCerrados, totalCobrado, pagosVencidos },
      polizasPorEstado,
      siniestrosPorTipo,
      siniestrosPorMes: completarMeses(siniestrosPorMes),
    });
  } catch (e) {
    return errorSQL(e);
  }
}

// Si un mes no tuvo siniestros, la consulta no lo devuelve. Para que el
// gráfico no "salte" meses, se agregan esos meses con cantidad 0.
function completarMeses(filas) {
  if (filas.length === 0) return [];
  const mapa = Object.fromEntries(filas.map((f) => [f.etiqueta, f.cantidad]));
  const resultado = [];
  let [anio, mes] = filas[0].etiqueta.split('-').map(Number);
  const ultimo = filas[filas.length - 1].etiqueta;
  while (true) {
    const clave = `${anio}-${String(mes).padStart(2, '0')}`;
    resultado.push({ etiqueta: clave, cantidad: mapa[clave] || 0 });
    if (clave === ultimo || resultado.length > 240) break;
    mes++;
    if (mes > 12) { mes = 1; anio++; }
  }
  return resultado;
}
