'use client';
// =====================================================================
// PANTALLA CLIENTES: listar, buscar, crear, consultar, editar y dar de baja
// =====================================================================
import { useEffect, useState } from 'react';
import { api, fechaAR } from '@/lib/api';
import Aviso from '@/components/Aviso';

const VACIO = { nombre: '', apellido: '', dni: '', email: '', telefono: '' };

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [verInactivos, setVerInactivos] = useState(false);
  const [form, setForm] = useState(null);      // null = formulario cerrado
  const [editandoId, setEditandoId] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // READ: trae la lista desde la base (GET /api/clientes)
  async function cargar() {
    try {
      const params = new URLSearchParams();
      if (buscar) params.set('buscar', buscar);
      if (!verInactivos) params.set('activos', '1');
      setClientes(await api(`/api/clientes?${params}`));
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    }
  }

  // Se vuelve a consultar cada vez que cambia la búsqueda (con una pequeña espera)
  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
  }, [buscar, verInactivos]); // eslint-disable-line react-hooks/exhaustive-deps

  function nuevo() {
    setEditandoId(null);
    setForm({ ...VACIO });
    setDetalle(null);
  }

  function editar(c) {
    setEditandoId(c.id_cliente);
    setForm({ nombre: c.nombre, apellido: c.apellido, dni: c.dni, email: c.email || '', telefono: c.telefono || '', activo: c.activo });
    setDetalle(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // CREATE (POST -> INSERT) o UPDATE (PUT -> UPDATE)
  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editandoId) {
        await api(`/api/clientes/${editandoId}`, 'PUT', form);
        setAviso({ tipo: 'ok', texto: 'Cliente actualizado.' });
      } else {
        const r = await api('/api/clientes', 'POST', form);
        setAviso({ tipo: 'ok', texto: `Cliente guardado en la base con id ${r.id_cliente}.` });
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

  // READ de un registro: GET /api/clientes/:id
  async function ver(c) {
    try {
      setDetalle(await api(`/api/clientes/${c.id_cliente}`));
      setForm(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    }
  }

  // DELETE o BAJA lógica (lo decide la API según si tiene pólizas)
  async function borrar(c) {
    const texto = c.cant_polizas > 0
      ? `${c.apellido}, ${c.nombre} tiene pólizas. Se va a DAR DE BAJA (no se borra). ¿Continuar?`
      : `¿Eliminar definitivamente a ${c.apellido}, ${c.nombre}?`;
    if (!confirm(texto)) return;
    try {
      const r = await api(`/api/clientes/${c.id_cliente}`, 'DELETE');
      setAviso({ tipo: 'ok', texto: r.mensaje });
      setDetalle(null);
      cargar();
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    }
  }

  async function reactivar(c) {
    try {
      await api(`/api/clientes/${c.id_cliente}`, 'PUT', { ...c, activo: 1 });
      setAviso({ tipo: 'ok', texto: `${c.apellido}, ${c.nombre} fue reactivado.` });
      cargar();
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    }
  }

  const campo = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Clientes</h1>
          <p>Personas aseguradas</p>
        </div>
        <button className="btn primario" onClick={nuevo}>+ Nuevo cliente</button>
      </div>

      <Aviso aviso={aviso} cerrar={() => setAviso(null)} />

      {form && (
        <form className="card" onSubmit={guardar}>
          <h2>{editandoId ? 'Editar cliente' : 'Nuevo cliente'}</h2>
          <div className="form-grid">
            <div className="campo"><label htmlFor="nombre">Nombre *</label><input id="nombre" required {...campo('nombre')} /></div>
            <div className="campo"><label htmlFor="apellido">Apellido *</label><input id="apellido" required {...campo('apellido')} /></div>
            <div className="campo"><label htmlFor="dni">DNI *</label><input id="dni" required inputMode="numeric" pattern="\d{7,8}" title="7 u 8 números, sin puntos" placeholder="Sin puntos" {...campo('dni')} /></div>
            <div className="campo"><label htmlFor="email">Email</label><input id="email" type="email" {...campo('email')} /></div>
            <div className="campo"><label htmlFor="telefono">Teléfono</label><input id="telefono" {...campo('telefono')} /></div>
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
            <h2 style={{ margin: 0 }}>{detalle.apellido}, {detalle.nombre}</h2>
            <button className="btn chico" onClick={() => setDetalle(null)}>Cerrar</button>
          </div>
          <div className="detalle-grid">
            <div className="dato"><small>DNI</small><b>{detalle.dni}</b></div>
            <div className="dato"><small>Email</small><b>{detalle.email || '—'}</b></div>
            <div className="dato"><small>Teléfono</small><b>{detalle.telefono || '—'}</b></div>
            <div className="dato"><small>Estado</small><span className={`badge ${detalle.activo ? 'si' : 'no'}`}>{detalle.activo ? 'ACTIVO' : 'DADO DE BAJA'}</span></div>
          </div>
          <h3>Pólizas</h3>
          {detalle.polizas.length === 0 ? <p className="contador">No tiene pólizas.</p> : (
            <div className="tabla-wrap">
              <table>
                <thead><tr><th>Número</th><th>Inicio</th><th>Vencimiento</th><th>Estado</th><th>Siniestros</th></tr></thead>
                <tbody>
                  {detalle.polizas.map((p) => (
                    <tr key={p.numero_poliza}>
                      <td><b>{p.numero_poliza}</b></td><td>{fechaAR(p.fecha_inicio)}</td><td>{fechaAR(p.fecha_fin)}</td>
                      <td><span className={`badge ${p.estado}`}>{p.estado}</span></td><td className="num">{p.cant_siniestros}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="filtros">
          <input placeholder="Buscar por apellido, nombre o DNI…" value={buscar} onChange={(e) => setBuscar(e.target.value)} aria-label="Buscar clientes" />
          <label>
            <input type="checkbox" style={{ width: 'auto' }} checked={verInactivos} onChange={(e) => setVerInactivos(e.target.checked)} />
            Mostrar dados de baja
          </label>
        </div>
        <p className="contador">{clientes.length} cliente(s)</p>
        <div className="tabla-wrap">
          <table>
            <thead>
              <tr><th>Apellido y nombre</th><th>DNI</th><th>Email</th><th>Teléfono</th><th>Pólizas</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {clientes.length === 0 && <tr><td colSpan={6} className="vacio">No hay clientes que coincidan.</td></tr>}
              {clientes.map((c) => (
                <tr key={c.id_cliente} className={c.activo ? '' : 'inactivo'}>
                  <td><b>{c.apellido}</b>, {c.nombre} {!c.activo && <span className="badge no">BAJA</span>}</td>
                  <td className="num">{c.dni}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.telefono || '—'}</td>
                  <td className="num">{c.cant_polizas}</td>
                  <td>
                    <div className="acciones">
                      <button className="btn chico" onClick={() => ver(c)}>Ver</button>
                      <button className="btn chico" onClick={() => editar(c)}>Editar</button>
                      {c.activo
                        ? <button className="btn chico peligro" onClick={() => borrar(c)}>{c.cant_polizas > 0 ? 'Dar de baja' : 'Eliminar'}</button>
                        : <button className="btn chico" onClick={() => reactivar(c)}>Reactivar</button>}
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
