# TIC Seguros · Sistema Web de Seguros de Accidentes Personales

Trabajo Integrador Cuatrimestral — **Análisis de Datos y Explotación**
ISFT N.º 199 · Tecnicatura Superior en Ciencia de Datos e Inteligencia Artificial

**Alumna:** Iña
**URL pública:** _(completar después del deploy, ej. https://tic-seguros-ina.vercel.app)_

```
PROBLEMA → DATOS → MODELO → SQLITE → FRONT-END → DASHBOARD → ANÁLISIS
```

## Tecnologías

| Componente | Tecnología |
|---|---|
| App / Front-End | Next.js 16 (App Router, JavaScript) |
| Base local | SQLite (`seguros.db`) |
| Base publicada | Turso / libSQL |
| Conexión a la base | `@libsql/client` (el mismo código sirve para SQLite local y Turso) |
| Gráficos | Chart.js + react-chartjs-2 |
| Hosting | Vercel (plan gratuito) |

## Estructura del proyecto

```
seguros.db                  ← base SQLite local (entregable)
sql/
  01_crear_tablas.sql       ← script de creación de tablas (PK, FK, CHECK)
  02_cargar_datos.sql       ← script de carga de datos de prueba
  03_consultas.sql          ← consultas obligatorias, JOINs y consultas del dashboard
scripts/init-db.mjs         ← ejecuta los .sql sobre SQLite local o sobre Turso
lib/
  db.js                     ← conexión a la base + funciones consultar() / ejecutar()
  validaciones.js           ← reglas de negocio que se validan en el servidor
  api.js                    ← funciones del front para llamar a la API
app/
  page.js                   ← INICIO / DASHBOARD
  clientes/page.js          ← pantalla Clientes
  polizas/page.js           ← pantalla Pólizas
  siniestros/page.js        ← pantalla Siniestros
  api/…/route.js            ← API: acá se ejecutan los INSERT, SELECT, UPDATE, DELETE
components/                 ← menú, avisos y gráfico reutilizable
docs/
  DER.png / DER.svg         ← Diagrama Entidad-Relación
  documento-explicativo.md  ← descripción del sistema, modelo, normalización
  bitacora-ia.md            ← bitácora de 5 prompts de IA
  guia-deploy.md            ← paso a paso GitHub + Turso + Vercel
  guia-defensa.md           ← preguntas probables del profesor y cómo responderlas
```

## Cómo correrlo en la compu

Requisito: tener instalado [Node.js](https://nodejs.org) (versión 20 o más).

```bash
npm install          # instala las dependencias (una sola vez)
npm run db:init      # (opcional) recrea seguros.db desde los scripts SQL
npm run dev          # levanta la app en http://localhost:3000
```

Sin archivo `.env.local`, la app usa `seguros.db`. Con `.env.local` (ver `.env.example`) usa Turso.

## Recorrido del dato

```
FORMULARIO → FRONT-END → API / FUNCIÓN → SQL → BASE → CONSULTA → DASHBOARD
(clientes/page.js) → fetch('/api/clientes', POST) → app/api/clientes/route.js → INSERT INTO cliente … → Turso → SELECT COUNT(*) … → app/page.js
```

## CRUD

| Operación | Acción del usuario | Ruta de la API | SQL |
|---|---|---|---|
| CREATE | Botón GUARDAR en "Nuevo…" | `POST /api/clientes` | `INSERT` |
| READ | Lista, búsqueda, botón Ver | `GET /api/clientes`, `GET /api/clientes/:id` | `SELECT` |
| UPDATE | Botón Editar / Cerrar siniestro | `PUT /api/clientes/:id` | `UPDATE` |
| DELETE / BAJA | Botón Eliminar / Dar de baja | `DELETE /api/clientes/:id` | `DELETE` o `UPDATE` |

Lo mismo para `/api/polizas` y `/api/siniestros`.
