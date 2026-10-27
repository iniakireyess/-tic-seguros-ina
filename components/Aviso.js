'use client';
// Mensaje de éxito o error que se muestra arriba de cada pantalla
export default function Aviso({ aviso, cerrar }) {
  if (!aviso) return null;
  return (
    <div className={`aviso ${aviso.tipo}`} role={aviso.tipo === 'error' ? 'alert' : 'status'}>
      <span>{aviso.texto}</span>
      <button onClick={cerrar} aria-label="Cerrar">×</button>
    </div>
  );
}
