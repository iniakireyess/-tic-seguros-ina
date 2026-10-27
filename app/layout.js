import './globals.css';
import Menu from '@/components/Menu';

export const metadata = {
  title: 'TIC Seguros · Accidentes Personales',
  description: 'Sistema web de Seguros de Accidentes Personales - ISFT N.º 199',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <div className="app">
          <aside className="sidebar">
            <div className="logo">
              <div className="logo-mark">AP</div>
              <div>
                <b>TIC Seguros</b>
                <small>Accidentes Personales</small>
              </div>
            </div>
            <Menu />
          </aside>
          <main className="contenido">{children}</main>
        </div>
      </body>
    </html>
  );
}
