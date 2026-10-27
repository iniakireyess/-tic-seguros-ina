// =====================================================================
// Validaciones compartidas por las rutas de la API.
// Se valida en el servidor (aunque el formulario también valide) porque
// cualquiera podría llamar a la API directamente salteando el formulario.
// Devuelven un texto con el problema, o null si está todo bien.
// =====================================================================
import { consultar } from '@/lib/db';

export const ESTADOS_POLIZA = ['ACTIVA', 'VENCIDA', 'CANCELADA'];
export const ESTADOS_SINIESTRO = ['ABIERTO', 'CERRADO'];
export const TIPOS_SINIESTRO = [
  'Accidente de tránsito',
  'Caída',
  'Accidente laboral',
  'Accidente deportivo',
  'Accidente doméstico',
];

export async function validarPoliza(d) {
  if (!d.id_cliente) return 'Tenés que seleccionar un cliente.';
  if (!d.fecha_inicio || !d.fecha_fin) return 'Las fechas de inicio y fin son obligatorias.';
  if (d.fecha_fin <= d.fecha_inicio) return 'La fecha de fin debe ser posterior a la de inicio.';
  if (!ESTADOS_POLIZA.includes(d.estado)) return 'Estado de póliza inválido.';
  for (const cob of d.coberturas || []) {
    if (!(Number(cob.suma_asegurada) > 0)) return 'Cada cobertura elegida necesita una suma asegurada mayor a 0.';
  }
  const [cli] = await consultar('SELECT id_cliente FROM cliente WHERE id_cliente = ?', [d.id_cliente]);
  if (!cli) return 'El cliente seleccionado no existe.';
  return null;
}

export async function validarSiniestro(d) {
  if (!d.id_poliza) return 'Tenés que seleccionar una póliza.';
  if (!d.fecha) return 'La fecha es obligatoria.';
  if (!TIPOS_SINIESTRO.includes(d.tipo)) return 'Tipo de siniestro inválido.';
  if (!ESTADOS_SINIESTRO.includes(d.estado)) return 'Estado de siniestro inválido.';

  // El siniestro tiene que haber ocurrido mientras la póliza estaba vigente
  const [pol] = await consultar(
    'SELECT numero_poliza, fecha_inicio, fecha_fin FROM poliza WHERE id_poliza = ?',
    [d.id_poliza]
  );
  if (!pol) return 'La póliza seleccionada no existe.';
  if (d.fecha < pol.fecha_inicio || d.fecha > pol.fecha_fin) {
    return `La fecha está fuera de la vigencia de la póliza ${pol.numero_poliza} (${pol.fecha_inicio} al ${pol.fecha_fin}).`;
  }
  return null;
}
