'use client';
// =====================================================================
// PANTALLA PÓLIZAS: el cliente se ELIGE desde la base (select), no se
// escribe como texto libre. También se eligen las coberturas.
// =====================================================================
import { useEffect, useState } from 'react';
import { api, hoy, sumarAnios, fechaAR, pesos } from '@/lib/api';
import Aviso from '@/components/Aviso';

const ESTADOS = ['ACTIVA', 'VENCIDA', 'CANCELADA'];

function formVacio() {
  const inicio = hoy();
  return { id_cliente: '', numero_poliza: '', fecha_inicio: inicio, fecha_fin: sumarAnios(inicio, 1), estado: 'ACTIVA', coberturas: {} };
}

export default function PolizasPage() {
  const [polizas, setPolizas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [estado, setEstado] = useState('');
  const [form, setForm] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    try {
      const params = new URLSearchParams();
      if (buscar) params.set('buscar', buscar);
      if (estado) params.set('estado', estado);
      setPolizas(await api(`/api/polizas?${params}`));
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    }
  }

  // Clientes y coberturas para los selects del formulario
  useEffect(() => {
    api('/api/clientes').then(setClientes).catch((e) => setAviso({ tipo: 'error', texto: e.message }));
    api('/api/coberturas').then(setCatalogo).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
  }, [buscar, estado]); // eslint-disable-line react-hooks/exhaustive-deps

  function nuevo() {
    setEditandoId(null);
    setForm(formVacio());
    setDetalle(null);
    // por si se creó un cliente en otra pestaña, se recarga la lista
    api('/api/clientes').then(setClientes).catch(() => {});
  }

  async function editar(p) {
    try {
      const completa = await api(`/api/polizas/${p.id_poliza}`);
      const coberturas = {};
      for (const c of completa.coberturas) coberturas[c.id_cobertura] = c.suma_asegurada;
      setEditandoId(p.id_poliza);
      setForm({
        id_cliente: String(completa.id_cliente), numero_poliza: completa.numero_poliza,
        fecha_inicio: completa.fecha_inicio, fecha_fin: completa.fecha_fin, estado: completa.estado, coberturas,
      });
      setDetalle(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    }
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    // Se pasa de {id: suma} a una lista [{id_cobertura, suma_asegurada}]
    const datos = {
      ...form,
      id_cliente: Number(form.id_cliente),
      coberturas: Object.entries(form.coberturas).map(([id, suma]) => ({ id_cobertura: Number(id), suma_asegurada: suma })),
    };
    try {
      if (editandoId) {
        await api(`/api/polizas/${editandoId}`, 'PUT', datos);
        setAviso({ tipo: 'ok', texto: 'Póliza actualizada.' });
      } else {
        const r = await api('/api/polizas', 'POST', datos);
        setAviso({ tipo: 'ok', texto: `Póliza ${r.numero_poliza} creada.` });
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

  async function ver(p) {
    try {
      setDetalle(await api(`/api/polizas/${p.id_poliza}`));
      setForm(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    }
  }

  async function borrar(p) {
    if (!confirm(`¿Eliminar la póliza ${p.numero_poliza}? Si tiene siniestros o pagos se va a CANCELAR en lugar de borrarse.`)) return;
    try {
      const r = await api(`/api/polizas/${p.id_poliza}`, 'DELETE');
      setAviso({ tipo: 'ok', texto: r.mensaje });
      setDetalle(null);
      cargar();
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    }
  }

  function toggleCobertura(id) {
    const cob = { ...form.coberturas };
    if (id in cob) delete cob[id];
    else cob[id] = '';
    setForm({ ...form, coberturas: cob });
  }

  function cambiarInicio(valor) {
    // Al cambiar el inicio, se propone un vencimiento a 1 año
    setForm({ ...form, fecha_inicio: valor, fecha_fin: valor ? sumarAnios(valor, 1) : form.fecha_fin });
  }

  const campo = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Pólizas</h1>
          <p>Contratos de seguro de accidentes personales</p>
        </div>
        <button className="btn primario" onClick={nuevo}>+ Nueva póliza</button>
      </div>

      <Aviso aviso={aviso} cerrar={() => setAviso(null)} />

      {form && (
        <form className="card" onSubmit={guardar}>
          <h2>{editandoId ? 'Editar póliza' : 'Nueva póliza'}</h2>
          <div className="form-grid">
            <div className="campo ancho">
              <label htmlFor="cliente">Cliente *</label>
              <select id="cliente" required {...campo('id_cliente')}>
                <option value="">— Seleccioná un cliente —</option>
                {clientes.map((c) => (
                  <option key={c.id_cliente} value={c.id_cliente}
                    disabled={!c.activo && String(c.id_cliente) !== form.id_cliente}>
                    {c.apellido}, {c.nombre} — DNI {c.dni}{!c.activo ? ' (baja)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="numero">Número de póliza</label>
              <input id="numero" placeholder={editandoId ? '' : 'Se genera solo si lo dejás vacío'} required={!!editandoId} {...campo('numero_poliza')} />
            </div>
            <div className="campo"><label htmlFor="inicio">Fecha de inicio *</label><input id="inicio" type="date" required value={form.fecha_inicio} onChange={(e) => cambiarInicio(e.target.value)} /></div>
            <div className="campo"><label htmlFor="fin">Vencimiento *</label><input id="fin" type="date" required min={form.fecha_inicio} {...campo('fecha_fin')} /></div>
            <div className="campo">
              <label htmlFor="estado">Estado *</label>
              <select id="estado" {...campo('estado')}>{ESTADOS.map((e) => <option key={e}>{e}</option>)}</select>
            </div>
          </div>

          <h3>Coberturas incluidas</h3>
          <div className="coberturas">
            {catalogo.map((c) => {
              const elegida = c.id_cobertura in form.coberturas;
              return (
                <div key={c.id_cobertura} className="cob-item">
                  <input type="checkbox" id={`cob${c.id_cobertura}`} checked={elegida} onChange={() => toggleCobertura(c.id_cobertura)} />
                  <span><label htmlFor={`cob${c.id_cobertura}`}>{c.nombre}</label></span>
                  {elegida && (
                    <input type="number" min="1" step="1" required placeholder="Suma $" aria-label={`Suma asegurada ${c.nombre}`}
                      value={form.coberturas[c.id_cobertura]}
                      onChange={(e) => setForm({ ...form, coberturas: { ...form.coberturas, [c.id_cobertura]: e.target.value } })} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="form-pie">
            <button className="btn primario" disabled={guardando}>{guardando ? 'Guardando…' : 'GUARDAR'}</button>
            <button type="button" className="btn" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </form>
      )}

      {detalle && (
        <div className="card">
          <div className="encabezado" style={{ marginBottom: 14 }}>
            <h2 style={{ margin: 0 }}>Póliza {detalle.numero_poliza}</h2>
            <button className="btn chico" onClick={() => setDetalle(null)}>Cerrar</button>
          </div>
          <div className="detalle-grid">
            <div className="dato"><small>Cliente</small><b>{detalle.cliente}</b></div>
            <div className="dato"><small>DNI</small><b>{detalle.dni}</b></div>
            <div className="dato"><small>Vigencia</small><b>{fechaAR(detalle.fecha_inicio)} al {fechaAR(detalle.fecha_fin)}</b></div>
            <div className="dato"><small>Estado</small><span className={`badge ${detalle.estado}`}>{detalle.estado}</span></div>
          </div>

          <h3>Coberturas</h3>
          {detalle.coberturas.length === 0 ? <p className="contador">Sin coberturas cargadas.</p> : (
            <table><tbody>
              {detalle.coberturas.map((c) => <tr key={c.id_cobertura}><td>{c.nombre}</td><td className="num" style={{ textAlign: 'right' }}>{pesos(c.suma_asegurada)}</td></tr>)}
            </tbody></table>
          )}

          <h3>Siniestros ({detalle.siniestros.length})</h3>
          {detalle.siniestros.length === 0 ? <p className="contador">Sin siniestros.</p> : (
            <table><tbody>
              {detalle.siniestros.map((s) => <tr key={s.id_siniestro}><td>{fechaAR(s.fecha)}</td><td>{s.tipo}</td><td><span className={`badge ${s.estado}`}>{s.estado}</span></td></tr>)}
            </tbody></table>
          )}

          <h3>Pagos ({detalle.pagos.length})</h3>
          {detalle.pagos.length === 0 ? <p className="contador">Sin pagos.</p> : (
            <table><tbody>
              {detalle.pagos.map((p) => <tr key={p.id_pago}><td>{fechaAR(p.fecha)}</td><td className="num">{pesos(p.importe)}</td><td><span className={`badge ${p.estado}`}>{p.estado}</span></td></tr>)}
            </tbody></table>
          )}
        </div>
      )}

      <div className="card">
        <div className="filtros">
          <input placeholder="Buscar por número de póliza, apellido o DNI…" value={buscar} onChange={(e) => setBuscar(e.target.value)} aria-label="Buscar pólizas" />
          <select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => <option key={e}>{e}</option>)}
          </select>
        </div>
        <p className="contador">{polizas.length} póliza(s)</p>
        <div className="tabla-wrap">
          <table>
            <thead>
              <tr><th>Número</th><th>Cliente</th><th>Inicio</th><th>Vencimiento</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {polizas.length === 0 && <tr><td colSpan={6} className="vacio">No hay pólizas que coincidan.</td></tr>}
              {polizas.map((p) => (
                <tr key={p.id_poliza}>
                  <td><b>{p.numero_poliza}</b></td>
                  <td>{p.cliente}</td>
                  <td>{fechaAR(p.fecha_inicio)}</td>
                  <td>{fechaAR(p.fecha_fin)}</td>
                  <td><span className={`badge ${p.estado}`}>{p.estado}</span></td>
                  <td>
                    <div className="acciones">
                      <button className="btn chico" onClick={() => ver(p)}>Ver</button>
                      <button className="btn chico" onClick={() => editar(p)}>Editar</button>
                      {p.estado !== 'CANCELADA' && <button className="btn chico peligro" onClick={() => borrar(p)}>Eliminar</button>}
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
