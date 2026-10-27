'use client';
// =====================================================================
// PANTALLA SINIESTROS: se registra eligiendo una póliza existente.
// Botón "Cerrar siniestro" = UPDATE del estado ABIERTO -> CERRADO.
// =====================================================================
import { useEffect, useState } from 'react';
import { api, hoy, fechaAR } from '@/lib/api';
import Aviso from '@/components/Aviso';

const TIPOS = ['Accidente de tránsito', 'Caída', 'Accidente laboral', 'Accidente deportivo', 'Accidente doméstico'];
const ESTADOS = ['ABIERTO', 'CERRADO'];

export default function SiniestrosPage() {
  const [siniestros, setSiniestros] = useState([]);
  const [polizas, setPolizas] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [estado, setEstado] = useState('');
  const [tipo, setTipo] = useState('');
  const [form, setForm] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    try {
      const params = new URLSearchParams();
      if (buscar) params.set('buscar', buscar);
      if (estado) params.set('estado', estado);
      if (tipo) params.set('tipo', tipo);
      setSiniestros(await api(`/api/siniestros?${params}`));
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    }
  }

  function cargarPolizas() {
    api('/api/polizas').then(setPolizas).catch((e) => setAviso({ tipo: 'error', texto: e.message }));
  }

  useEffect(cargarPolizas, []);
  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
  }, [buscar, estado, tipo]); // eslint-disable-line react-hooks/exhaustive-deps

  function nuevo() {
    setEditandoId(null);
    setForm({ id_poliza: '', fecha: hoy(), tipo: TIPOS[0], descripcion: '', estado: 'ABIERTO' });
    cargarPolizas();
  }

  function editar(s) {
    setEditandoId(s.id_siniestro);
    setForm({ id_poliza: String(s.id_poliza), fecha: s.fecha, tipo: s.tipo, descripcion: s.descripcion || '', estado: s.estado });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    const datos = { ...form, id_poliza: Number(form.id_poliza) };
    try {
      if (editandoId) {
        await api(`/api/siniestros/${editandoId}`, 'PUT', datos);
        setAviso({ tipo: 'ok', texto: 'Siniestro actualizado.' });
      } else {
        const r = await api('/api/siniestros', 'POST', datos);
        setAviso({ tipo: 'ok', texto: `Siniestro N.º ${r.id_siniestro} registrado.` });
      }
      setForm(null);
      setEditandoId(null);
      cargar();
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    } finally {
      setGuardando(false);
    }
  }

  // Cambio rápido de estado (lo que se muestra en la demo frente al profesor)
  async function cambiarEstado(s, nuevoEstado) {
    try {
      await api(`/api/siniestros/${s.id_siniestro}`, 'PUT', { ...s, estado: nuevoEstado });
      setAviso({ tipo: 'ok', texto: `Siniestro N.º ${s.id_siniestro} pasó a ${nuevoEstado}.` });
      cargar();
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    }
  }

  async function borrar(s) {
    if (!confirm(`¿Eliminar el siniestro N.º ${s.id_siniestro} (${s.tipo}, ${fechaAR(s.fecha)})?`)) return;
    try {
      const r = await api(`/api/siniestros/${s.id_siniestro}`, 'DELETE');
      setAviso({ tipo: 'ok', texto: r.mensaje });
      cargar();
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    }
  }

  // Para registrar: solo pólizas ACTIVAS. Al editar se mantiene la que ya tenía.
  const polizasElegibles = polizas.filter(
    (p) => p.estado === 'ACTIVA' || String(p.id_poliza) === form?.id_poliza
  );
  const polizaElegida = polizas.find((p) => String(p.id_poliza) === form?.id_poliza);
  const campo = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Siniestros</h1>
          <p>Accidentes denunciados por los asegurados</p>
        </div>
        <button className="btn primario" onClick={nuevo}>+ Registrar siniestro</button>
      </div>

      <Aviso aviso={aviso} cerrar={() => setAviso(null)} />

      {form && (
        <form className="card" onSubmit={guardar}>
          <h2>{editandoId ? `Editar siniestro N.º ${editandoId}` : 'Registrar siniestro'}</h2>
          <div className="form-grid">
            <div className="campo ancho">
              <label htmlFor="poliza">Póliza *</label>
              <select id="poliza" required {...campo('id_poliza')}>
                <option value="">— Seleccioná una póliza activa —</option>
                {polizasElegibles.map((p) => (
                  <option key={p.id_poliza} value={p.id_poliza}>{p.numero_poliza} — {p.cliente}</option>
                ))}
              </select>
              {polizaElegida && (
                <small style={{ color: 'var(--muted)' }}>
                  Vigencia: {fechaAR(polizaElegida.fecha_inicio)} al {fechaAR(polizaElegida.fecha_fin)}
                </small>
              )}
            </div>
            <div className="campo">
              <label htmlFor="fecha">Fecha *</label>
              <input id="fecha" type="date" required min={polizaElegida?.fecha_inicio} max={polizaElegida?.fecha_fin} {...campo('fecha')} />
            </div>
            <div className="campo">
              <label htmlFor="tipo">Tipo *</label>
              <select id="tipo" {...campo('tipo')}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</select>
            </div>
            <div className="campo">
              <label htmlFor="estado">Estado *</label>
              <select id="estado" {...campo('estado')}>{ESTADOS.map((e) => <option key={e}>{e}</option>)}</select>
            </div>
            <div className="campo ancho">
              <label htmlFor="descripcion">Descripción</label>
              <textarea id="descripcion" placeholder="Qué pasó, lesiones, lugar…" {...campo('descripcion')} />
            </div>
          </div>
          <div className="form-pie">
            <button className="btn primario" disabled={guardando}>{guardando ? 'Guardando…' : 'GUARDAR'}</button>
            <button type="button" className="btn" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="filtros">
          <input placeholder="Buscar por póliza, apellido o descripción…" value={buscar} onChange={(e) => setBuscar(e.target.value)} aria-label="Buscar siniestros" />
          <select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => <option key={e}>{e}</option>)}
          </select>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Filtrar por tipo">
            <option value="">Todos los tipos</option>
            {TIPOS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <p className="contador">{siniestros.length} siniestro(s)</p>
        <div className="tabla-wrap">
          <table>
            <thead>
              <tr><th>N.º</th><th>Fecha</th><th>Póliza</th><th>Cliente</th><th>Tipo</th><th>Descripción</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {siniestros.length === 0 && <tr><td colSpan={8} className="vacio">No hay siniestros que coincidan.</td></tr>}
              {siniestros.map((s) => (
                <tr key={s.id_siniestro}>
                  <td className="num">{s.id_siniestro}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fechaAR(s.fecha)}</td>
                  <td><b>{s.numero_poliza}</b></td>
                  <td>{s.cliente}</td>
                  <td>{s.tipo}</td>
                  <td style={{ maxWidth: 260, color: 'var(--text-2)' }}>{s.descripcion || '—'}</td>
                  <td><span className={`badge ${s.estado}`}>{s.estado}</span></td>
                  <td>
                    <div className="acciones">
                      {s.estado === 'ABIERTO'
                        ? <button className="btn chico primario" onClick={() => cambiarEstado(s, 'CERRADO')}>Cerrar siniestro</button>
                        : <button className="btn chico" onClick={() => cambiarEstado(s, 'ABIERTO')}>Reabrir</button>}
                      <button className="btn chico" onClick={() => editar(s)}>Editar</button>
                      <button className="btn chico peligro" onClick={() => borrar(s)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
