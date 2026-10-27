# Bitácora de uso de IA

**Herramienta usada:** Claude (Anthropic)
**Alumna:** Iña

> Los 5 registros salen de la sesión real de desarrollo. Antes de entregar, revisalos y reescribí "Qué se aprendió" con tus palabras: es lo que el profesor va a querer escucharte explicar.

---

### Prompt 1 — Diseño de las tablas

**Qué se pidió:** "Creame las tablas en SQLite para un sistema de seguros de accidentes personales con clientes, pólizas, coberturas, pagos y siniestros, respetando claves primarias, foráneas y restricciones, normalizado hasta 3FN."

**Qué devolvió la IA:** El script `01_crear_tablas.sql` con las 5 tablas pedidas y una sexta, `poliza_cobertura`, más restricciones `CHECK` para los estados y las fechas, e índices sobre las claves foráneas.

**Qué se corrigió / revisó:** La consigna no decía cómo se relacionan pólizas y coberturas. Se revisó la propuesta: como una póliza tiene varias coberturas y una cobertura está en muchas pólizas, la relación es N:M y necesita la tabla intermedia. También se decidió agregar `cliente.activo` para poder dar de baja sin borrar.

**Qué se aprendió:** Una relación muchos a muchos no se puede resolver con una sola FK. La suma asegurada va en la tabla intermedia porque depende de la combinación póliza + cobertura (eso es 2FN). No se guarda `id_cliente` en `siniestro` porque se obtiene a través de la póliza (eso es 3FN).

---

### Prompt 2 — Datos de prueba coherentes

**Qué se pidió:** "Generá datos ficticios pero coherentes: al menos 10 clientes, 10 pólizas, 5 coberturas, 15 pagos y 10 siniestros, que los siniestros y pagos caigan dentro de la vigencia de la póliza."

**Qué devolvió la IA:** El script `02_cargar_datos.sql` con 12 clientes, 6 coberturas, 12 pólizas, 20 pagos y 12 siniestros repartidos entre enero y octubre de 2026.

**Qué se corrigió / revisó:** No se confió en que los datos "estaban bien": se verificaron con consultas. Por ejemplo, para comprobar que ningún siniestro quedara fuera de la vigencia:
```sql
SELECT COUNT(*) FROM siniestro s
JOIN poliza p ON p.id_poliza = s.id_poliza
WHERE s.fecha NOT BETWEEN p.fecha_inicio AND p.fecha_fin;   -- dio 0
```
También se controló con `PRAGMA foreign_key_check` que todas las FK apunten a filas existentes.

**Qué se aprendió:** Los datos generados por IA hay que validarlos con SQL antes de usarlos. Se dejó a propósito un cliente sin pólizas (Romero) para poder mostrar un `LEFT JOIN` y probar el borrado real.

---

### Prompt 3 — Consultas obligatorias y JOIN

**Qué se pidió:** "Escribí las 8 consultas obligatorias y 3 consultas con JOIN (cliente+póliza, póliza+siniestro, cliente+póliza+siniestro) que muestren información útil y no solo IDs."

**Qué devolvió la IA:** El script `03_consultas.sql`, con los JOIN mostrando apellido y nombre del cliente, número de póliza, tipo y estado del siniestro, y consultas extra (clientes sin pólizas, total cobrado por cliente, pagos vencidos).

**Qué se corrigió:** Al ejecutar el script completo separando las consultas por `;`, una falló con `syntax error near "en"`. La causa era un **punto y coma dentro de un comentario** (`-- ...póliza; en esos casos...`), que cortaba la consulta por la mitad. Se reescribió el comentario sin `;`.

**Qué se aprendió:** El `;` marca el fin de una sentencia, y algunas herramientas no distinguen si está dentro de un comentario. También: `LIKE 'A%'` en SQLite distingue acentos, así que un apellido como "Álvarez" no aparecería buscando con `'A%'`.

---

### Prompt 4 — API y pantallas en Next.js

**Qué se pidió:** "Creame la API en Next.js para el CRUD de clientes, pólizas y siniestros, y las pantallas con formulario, búsqueda, editar y eliminar. El cliente de la póliza tiene que elegirse desde la base."

**Qué devolvió la IA:** Las rutas `app/api/.../route.js` (GET, POST, PUT, DELETE) y las pantallas `clientes`, `polizas` y `siniestros`.

**Qué se corrigió:** En la primera versión, la función `validarPoliza` se exportaba desde el archivo `route.js` de pólizas para reutilizarla. Next.js no lo permite: un `route.js` solo puede exportar los métodos HTTP (`GET`, `POST`, etc.) y algunas opciones. Se movieron las validaciones a `lib/validaciones.js`. Además, al probar la pantalla en tamaño celular, el checkbox de "Mostrar dados de baja" se estiraba y los botones de acción se apilaban: se ajustó el CSS.

**Qué se aprendió:** Cada carpeta dentro de `app/api` es una URL, y cada función exportada (`GET`, `POST`, `PUT`, `DELETE`) responde a ese método. Las validaciones se hacen en el servidor aunque el formulario también valide, porque alguien podría llamar a la API directamente. Los datos van como parámetros `?` en el SQL para evitar inyección SQL.

---

### Prompt 5 — Conectar Turso y publicar en Vercel

**Qué se pidió:** "¿Cómo conecto Turso con Next.js para que la app publicada en Vercel pueda guardar datos, usando el mismo código que con seguros.db?"

**Qué devolvió la IA:** Usar `@libsql/client`, que acepta tanto `file:seguros.db` como una URL `libsql://...turso.io`. La conexión (`lib/db.js`) lee las variables `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`; si no existen, usa el archivo local. Un script (`npm run db:init`) ejecuta los mismos `.sql` sobre la base que corresponda.

**Qué se corrigió:** Se agregó `serverExternalPackages: ['@libsql/client']` en `next.config.mjs` para que Next no intente empaquetar los módulos nativos de la librería. Se agregó `.env.local` al `.gitignore` para no subir el token a GitHub.

**Qué se aprendió:** Vercel no guarda archivos entre ejecuciones, por eso un `seguros.db` no sirve para la versión publicada y hace falta una base en la nube. Las credenciales se pasan como variables de entorno y nunca se escriben en el código.

_(Si al publicar aparece algún error en Vercel y lo resolvés con IA, podés reemplazar o sumar ese caso acá: es un ejemplo muy bueno para la bitácora.)_
