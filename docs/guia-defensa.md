# Guía para la defensa

La consigna dice que tenés que poder explicar **todo** el proyecto. Esta guía junta las preguntas más probables y respuestas cortas para que las digas con tus palabras. Leela con el código abierto al lado.

---

## La idea en 30 segundos

> "Es una app web para administrar seguros de accidentes personales. Los datos se cargan desde formularios, la pantalla le manda los datos a la API, la API ejecuta el SQL contra la base (SQLite en mi compu, Turso en la versión publicada) y el dashboard vuelve a consultar la base para mostrar indicadores y gráficos. No hay ningún número escrito a mano."

---

## Base de datos

**¿Qué es una PK y una FK?**
La PK (clave primaria) identifica cada fila de forma única, por ejemplo `id_cliente`. La FK (clave foránea) es una columna que apunta a la PK de otra tabla, por ejemplo `poliza.id_cliente` apunta a `cliente.id_cliente`. Así una póliza no puede pertenecer a un cliente que no existe.

**¿Qué cardinalidades tiene el modelo?**
Un cliente tiene muchas pólizas (1:N). Una póliza tiene muchos siniestros y muchos pagos (1:N). Pólizas y coberturas es muchos a muchos (N:M), resuelta con la tabla `poliza_cobertura`.

**¿Por qué agregaste la tabla `poliza_cobertura`?**
Porque una póliza puede tener varias coberturas y una cobertura está en muchas pólizas. Eso no se puede resolver con una sola FK. Además la suma asegurada depende de la combinación póliza + cobertura, entonces va ahí.

**¿Qué es 3FN y cómo la cumplís?**
- 1FN: cada celda tiene un solo valor (no hay listas de coberturas en una celda, ni columnas `pago1`, `pago2`).
- 2FN: en la tabla con clave compuesta (`poliza_cobertura`), los datos dependen de la clave completa. Por eso el nombre de la cobertura está en `cobertura` y no se repite.
- 3FN: ningún dato depende de otro que no sea la clave. Por ejemplo, la póliza no guarda el nombre ni el teléfono del cliente, solo su `id_cliente`. Y el siniestro no guarda `id_cliente`: se llega al cliente a través de la póliza.

**¿Qué redundancia evitaste?** (ejemplo concreto)
Si la póliza guardara el teléfono del cliente y el cliente tuviera 2 pólizas, al cambiar el teléfono habría que actualizarlo en 2 lugares, y si se olvida uno, los datos quedan contradictorios.

**¿Para qué sirven los `CHECK`?**
Para que la base rechace datos inválidos aunque vengan de otro lado: estados que no existen, importes negativos, una póliza que vence antes de empezar.

**¿Qué hace `AUTOINCREMENT`?**
Que la base asigne sola el próximo número de id y que no reutilice ids de filas borradas.

---

## SQL

**Explicame `WHERE apellido LIKE 'A%'`.**
`LIKE` compara con un patrón. `%` significa "cualquier cosa". `'A%'` = empieza con A y después cualquier cosa.

**¿Qué diferencia hay entre `INNER JOIN` y `LEFT JOIN`?**
`INNER JOIN` trae solo las filas que tienen pareja en las dos tablas. `LEFT JOIN` trae todas las filas de la tabla de la izquierda aunque no tengan pareja (las columnas de la otra quedan en NULL). Lo uso para encontrar clientes sin pólizas: `WHERE p.id_poliza IS NULL`.

**¿Cómo funciona el gráfico de siniestros por mes?**
`strftime('%Y-%m', fecha)` convierte `2026-04-27` en `2026-04`. Después `GROUP BY` agrupa por ese valor y `COUNT(*)` cuenta cuántos hay en cada mes.

**¿`COUNT(*)` vs `AVG(importe)`?**
`COUNT` cuenta filas, `AVG` calcula el promedio de una columna. `ROUND(…, 2)` redondea a 2 decimales.

---

## Aplicación

**¿Cómo viaja el dato cuando aprieto GUARDAR?** (mostrarlo en el código)
1. `app/clientes/page.js` → la función `guardar()` llama a `api('/api/clientes', 'POST', form)`.
2. `lib/api.js` → hace el `fetch` con los datos en formato JSON.
3. `app/api/clientes/route.js` → la función `POST` valida y ejecuta `INSERT INTO cliente … VALUES (?, ?, ?, ?, ?)`.
4. `lib/db.js` → `@libsql/client` manda el SQL a la base.
5. El dashboard (`app/api/dashboard/route.js`) hace `SELECT COUNT(*) FROM cliente` y el número sube.

**¿Por qué los `?` en el SQL en lugar de pegar los valores?**
Son parámetros. La librería los inserta de forma segura. Si pegara el texto directamente, alguien podría escribir código SQL en un campo del formulario y romper o borrar la base (inyección SQL).

**¿Por qué validás en el formulario y también en la API?**
El formulario avisa rápido al usuario. La API vuelve a validar porque es la que realmente escribe en la base, y alguien podría llamarla directamente salteando el formulario.

**¿Cuándo se borra y cuándo se da de baja?**
- Cliente sin pólizas → `DELETE`. Cliente con pólizas → `UPDATE cliente SET activo = 0` (baja lógica), porque borrarlo dejaría pólizas apuntando a un cliente inexistente y se perdería el historial.
- Póliza sin siniestros ni pagos → `DELETE`. Con siniestros o pagos → `UPDATE estado = 'CANCELADA'`.
- Siniestro → `DELETE` directo, porque ninguna tabla depende de él.

**¿Qué es una transacción y dónde la usás?**
Un grupo de operaciones que se hacen todas o ninguna. Al crear una póliza se inserta la póliza y después sus coberturas con `db.batch(...)`: si falla una cobertura, tampoco queda guardada la póliza a medias.

**¿Qué es `useState` / `useEffect`?** (por si pregunta de React)
`useState` guarda datos de la pantalla (la lista, el formulario). `useEffect` ejecuta algo cuando la pantalla se abre o cuando cambia un valor; lo uso para volver a consultar la API cuando escribís en el buscador.

---

## Publicación

**¿Por qué Turso y no `seguros.db` en Vercel?**
Vercel ejecuta la app en servidores temporales que no guardan archivos. Lo que se escribiera en `seguros.db` se perdería. Turso es SQLite en la nube: mismo SQL, pero los datos persisten.

**¿Cómo sabe la app a qué base conectarse?**
Por variables de entorno. Si existe `TURSO_DATABASE_URL` usa Turso; si no, usa `file:seguros.db`. En Vercel están cargadas en *Settings → Environment Variables*. El token no está en GitHub porque `.env.local` está en el `.gitignore`.

**¿Cómo se cargaron las tablas en Turso?**
Con `npm run db:init`, que ejecuta los mismos `01_crear_tablas.sql` y `02_cargar_datos.sql` que se usaron para `seguros.db`.

---

## Ensayo de la demo (hacelo al menos una vez antes)

1. Entrar a la URL de Vercel. Mirar el Dashboard y **anotar** los números (clientes, pólizas activas, siniestros abiertos y cerrados).
2. Clientes → **+ Nuevo cliente** → completar → **GUARDAR**. Aparece el aviso con el id.
3. Escribir el apellido en el buscador → aparece. Botón **Ver**.
4. Pólizas → **+ Nueva póliza** → elegir el cliente en el desplegable → tildar una o dos coberturas con su suma → **GUARDAR**.
5. Siniestros → **+ Registrar siniestro** → elegir la póliza nueva → fecha de hoy → tipo → descripción → **GUARDAR**. Queda ABIERTO.
6. En esa fila → **Cerrar siniestro**. Pasa a CERRADO.
7. Volver al Dashboard → clientes +1, pólizas activas +1, siniestros cerrados +1. Abrir "Ver consulta SQL" para mostrar de dónde sale cada gráfico.

Consejo: el día anterior corré `npm run db:init` (con el `.env.local` de Turso) para arrancar la demo con los datos de prueba limpios.
