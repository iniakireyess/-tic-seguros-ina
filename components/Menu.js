'use client';
// Menú lateral. usePathname() indica en qué página estamos para resaltarla.
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const opciones = [
  { href: '/', texto: 'INICIO / DASHBOARD' },
  { href: '/clientes', texto: 'CLIENTES' },
  { href: '/polizas', texto: 'PÓLIZAS' },
  { href: '/siniestros', texto: 'SINIESTROS' },
];

export default function Menu() {
  const ruta = usePathname();
  return (
    <nav className="menu">
      {opciones.map((o) => (
        <Link key={o.href} href={o.href} className={ruta === o.href ? 'activo' : ''}>
          {o.texto}
        </Link>
      ))}
    </nav>
  );
}
