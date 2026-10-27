'use client';
// =====================================================================
// Gráfico de barras reutilizable (Chart.js). Recibe filas de la API con
// la forma [{ etiqueta, cantidad }] y las dibuja. Una sola serie, un solo
// color: las categorías se leen en el eje, no hace falta leyenda.
// =====================================================================
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const AZUL = '#2a78d6';
const TEXTO = '#52514e';
const GRILLA = '#eceef2';

export default function Grafico({ filas, horizontal = false, formatearEtiqueta = (x) => x, nombre = 'Cantidad' }) {
  const data = {
    labels: filas.map((f) => formatearEtiqueta(f.etiqueta)),
    datasets: [{
      label: nombre,
      data: filas.map((f) => f.cantidad),
      backgroundColor: AZUL,
      hoverBackgroundColor: '#1f66bd',
      borderRadius: 4,
      borderSkipped: 'start',        // redondeado solo en la punta de la barra
      maxBarThickness: 38,
    }],
  };

  const ejeValores = {
    beginAtZero: true,
    ticks: { precision: 0, color: TEXTO },   // sin decimales: son cantidades
    grid: { color: GRILLA },
    border: { display: false },
  };
  const ejeCategorias = {
    ticks: { color: TEXTO },
    grid: { display: false },
  };

  const options = {
    indexAxis: horizontal ? 'y' : 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#0f172a', padding: 10, displayColors: false },
    },
    scales: horizontal ? { x: ejeValores, y: ejeCategorias } : { x: ejeCategorias, y: ejeValores },
  };

  if (filas.length === 0) return <p className="vacio">Sin datos todavía.</p>;
  return <Bar data={data} options={options} aria-label={nombre} role="img" />;
}
