'use client';
// =====================================================================
// INICIO / DASHBOARD
// Todo lo que se ve sale de /api/dashboard, que consulta la base en el
// momento. Si se crea un cliente o se cierra un siniestro, al volver
// acá los números cambian solos.
// =====================================================================
import { useEffect, useState } from 'react';
import { api, pesos } from '@/lib/api';
import Grafico from '@/components/Grafico';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const mesCorto = (ym) => { const [a, m] = ym.split('-'); return `${MESES[Number(m) - 1]} ${a.slice(2)}`; };

function Kpi({ titulo, valor, nota, secundario }) {
  return (
    <div className={`kpi ${secundario ? 'secundario' : ''}`}>
      <small>{titulo}</small>
      <strong>{valor}</strong>
      {nota && <span>{nota}</span>}
    </div>
  );
}

function VerSQL({ sql }) {
  return (
    <details className="sql-ver">
      <summary>Ver consulta SQL</summary>
      <pre>{sql}</pre>
    </details>
  );
}

export default function Dashboard() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [actualizado, setActualizado] = useState(null);

  async function cargar() {
    try {
      setDatos(await api('/api/dashboard'));
      setActualizado(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { cargar(); }, []);

  if (error) return <div className="aviso error">No se pudo leer la base: {error}</div>;
  if (!datos) return <p className="contador">Cargando datos desde la base…</p>;

  const k = datos.indicadores;
  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Dashboard</h1>
          <p>Indicadores calculados en tiempo real desde la base{actualizado && ` · actualizado ${actualizado}`}</p>
        </div>
        <button className="btn" onClick={cargar}>↻ Actualizar</button>
      </div>

      <div className="kpis">
        <Kpi titulo="Clientes" valor={k.clientes} nota="activos" />
        <Kpi titulo="Pólizas activas" valor={k.polizasActivas} nota="estado = ACTIVA" />
        <Kpi titulo="Siniestros abiertos" valor={k.siniestrosAbiertos} nota="pendientes de resolución" />
        <Kpi titulo="Siniestros cerrados" valor={k.siniestrosCerrados} nota="resueltos" />
      </div>
      <div className="kpis">
        <Kpi secundario titulo="Total cobrado" valor={pesos(k.totalCobrado)} nota="pagos en estado PAGADO" />
        <Kpi secundario titulo="Pagos vencidos" valor={k.pagosVencidos} nota="cuotas sin cobrar" />
      </div>

      <div className="graficos">
        <div className="card">
          <h2>Pólizas por estado</h2>
          <div className="grafico-alto"><Grafico filas={datos.polizasPorEstado} nombre="Pólizas" /></div>
          <VerSQL sql={'SELECT estado, COUNT(*) AS cantidad\nFROM poliza\nGROUP BY estado;'} />
        </div>
        <div className="card">
          <h2>Siniestros por tipo</h2>
          <div className="grafico-alto"><Grafico filas={datos.siniestrosPorTipo} horizontal nombre="Siniestros" /></div>
          <VerSQL sql={'SELECT tipo, COUNT(*) AS cantidad\nFROM siniestro\nGROUP BY tipo;'} />
        </div>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h2>Siniestros por mes</h2>
          <div className="grafico-alto"><Grafico filas={datos.siniestrosPorMes} formatearEtiqueta={mesCorto} nombre="Siniestros" /></div>
          <VerSQL sql={"SELECT strftime('%Y-%m', fecha) AS mes, COUNT(*) AS cantidad\nFROM siniestro\nGROUP BY mes\nORDER BY mes;"} />
        </div>
      </div>
    </>
  );
}
