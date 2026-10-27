// =====================================================================
// Funciones que usa el FRONT-END para hablar con la API.
// Recorrido del dato: formulario -> api() -> /api/... -> SQL -> base
// =====================================================================

// Llama a la API y devuelve el JSON. Si la API responde con error,
// lanza una excepción con el mensaje para mostrarlo en pantalla.
export async function api(url, metodo = 'GET', datos) {
  const resp = await fetch(url, {
    method: metodo,
    headers: datos ? { 'Content-Type': 'application/json' } : undefined,
    body: datos ? JSON.stringify(datos) : undefined,
    cache: 'no-store',
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(json.error || `Error ${resp.status}`);
  return json;
}

// Fecha de hoy en formato YYYY-MM-DD (el formato que usa SQLite y <input type="date">)
export function hoy() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

// Suma años a una fecha YYYY-MM-DD (para proponer el vencimiento de una póliza)
export function sumarAnios(fecha, anios) {
  const [a, m, d] = fecha.split('-').map(Number);
  const r = new Date(Date.UTC(a + anios, m - 1, d));
  r.setUTCDate(r.getUTCDate() - 1);
  return r.toISOString().slice(0, 10);
}

// 2026-04-27 -> 27/04/2026
export function fechaAR(f) {
  if (!f) return '—';
  const [a, m, d] = f.split('-');
  return `${d}/${m}/${a}`;
}

export function pesos(n) {
  return Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}
