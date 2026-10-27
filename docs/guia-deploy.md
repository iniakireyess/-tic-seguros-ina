# Guía de publicación: GitHub → Turso → Vercel

Orden recomendado: primero la base en Turso (para tener las credenciales), después GitHub y por último Vercel.
Tiempo estimado: 30 a 45 minutos la primera vez.

> Los nombres exactos de los botones pueden cambiar un poco porque las páginas se actualizan seguido. Si algo no coincide, buscá la opción equivalente.

---

## 0. Preparar la compu

1. Instalar **Node.js** (versión LTS) desde https://nodejs.org
2. Instalar **Git** desde https://git-scm.com (en Windows, dejar todas las opciones por defecto).
3. Descomprimir el proyecto, abrir la carpeta con **Visual Studio Code** y abrir una terminal (menú *Terminal → New Terminal*).
4. Ejecutar:
   ```bash
   npm install
   npm run dev
   ```
   Entrar a http://localhost:3000 → tiene que verse el Dashboard con datos (usa `seguros.db`). Cortar con `Ctrl + C`.

---

## 1. Turso (la base en la nube)

¿Por qué? Vercel no guarda archivos: si la app publicada escribiera en `seguros.db`, los cambios se perderían. Turso es una base compatible con SQLite que vive en internet.

1. Entrar a https://turso.tech y registrarse con la cuenta de **GitHub** (plan gratuito).
2. Crear una base nueva llamada `seguros` (elegí la región más cercana, por ejemplo São Paulo si aparece).
3. Dentro de la base, copiar la **URL** (empieza con `libsql://…turso.io`).
4. Generar un **token** de acceso (opción *Generate Token* / *Create Token*, con permiso de lectura y escritura) y copiarlo. **No lo compartas ni lo subas a GitHub.**
5. En la carpeta del proyecto, copiar el archivo `.env.example` y renombrar la copia a `.env.local`. Completar:
   ```
   TURSO_DATABASE_URL="libsql://seguros-tuusuario.turso.io"
   TURSO_AUTH_TOKEN="el-token-que-copiaste"
   ```
6. Crear las tablas y cargar los datos en Turso ejecutando:
   ```bash
   npm run db:init
   ```
   Tiene que decir `Conectando a: Turso (...)` y listar las filas de cada tabla (12 clientes, 12 pólizas, etc.).
7. Probar: `npm run dev` → ahora la app local ya está usando Turso.

---

## 2. GitHub (el código)

1. En https://github.com crear un repositorio nuevo llamado **`tic-seguros-ina`** (puede ser público o privado). No agregues README (el proyecto ya tiene uno).
2. En la terminal de VS Code, dentro de la carpeta del proyecto:
   ```bash
   git init
   git add .
   git commit -m "TP integrador: sistema de seguros de accidentes personales"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/tic-seguros-ina.git
   git push -u origin main
   ```
   Si es la primera vez que usás Git, te va a pedir que configures nombre y email:
   ```bash
   git config --global user.name "Tu Nombre"
   git config --global user.email "tu@mail.com"
   ```
3. Verificá en GitHub que estén las carpetas `app`, `sql`, `docs` y el archivo `seguros.db`.
   El archivo `.env.local` **no** tiene que aparecer (el `.gitignore` lo excluye a propósito porque tiene el token).

---

## 3. Vercel (la publicación)

1. Entrar a https://vercel.com y registrarse con **GitHub** (plan *Hobby*, gratuito).
2. *Add New → Project* → elegir el repositorio `tic-seguros-ina` → *Import*.
3. Vercel detecta solo que es Next.js. Antes de publicar, abrir **Environment Variables** y agregar las dos variables (los mismos valores del `.env.local`):
   | Name | Value |
   |---|---|
   | `TURSO_DATABASE_URL` | `libsql://seguros-tuusuario.turso.io` |
   | `TURSO_AUTH_TOKEN` | el token |
4. *Deploy*. En 1–2 minutos te da la URL pública, por ejemplo `https://tic-seguros-ina.vercel.app`.
5. Anotá esa URL en el `README.md` y en el documento explicativo.

Cada vez que hagas `git push`, Vercel vuelve a publicar automáticamente.

---

## Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| El Dashboard publicado dice "No se pudo leer la base" | Faltan las variables en Vercel o están mal copiadas | *Settings → Environment Variables*, revisarlas (sin comillas ni espacios), y *Deployments → Redeploy* |
| Error `no such table: cliente` | No se ejecutó `npm run db:init` contra Turso | Revisar `.env.local` y correr `npm run db:init` |
| Error `401` / `Unauthorized` | Token vencido o mal copiado | Generar un token nuevo en Turso y actualizarlo en `.env.local` y en Vercel |
| `git push` pide usuario y contraseña | GitHub ya no acepta contraseña | Usar la ventana de login que abre Git en Windows o configurar GitHub Desktop |
| Antes de la demo querés datos "limpios" | — | `npm run db:init` (con `.env.local` de Turso) borra todo y vuelve a cargar los datos de prueba |

---

## Checklist de entrega

- [ ] URL pública de Vercel
- [ ] Repositorio de GitHub
- [ ] `seguros.db`
- [ ] `sql/01_crear_tablas.sql` (script de creación de tablas)
- [ ] `sql/02_cargar_datos.sql` (script de carga de datos)
- [ ] `sql/03_consultas.sql` (script de consultas)
- [ ] `docs/DER.png` (Diagrama Entidad-Relación)
- [ ] Código fuente completo (el repositorio)
- [ ] Documento explicativo
- [ ] Bitácora con 5 prompts de IA
