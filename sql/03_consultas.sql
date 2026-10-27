-- =====================================================================
-- TIC - Sistema de Seguros de Accidentes Personales
-- Script 3: CONSULTAS SQL
-- =====================================================================

-- =====================================================================
-- PARTE 5.10 - CONSULTAS OBLIGATORIAS
-- =====================================================================

-- 1. Mostrar todos los clientes
SELECT *
FROM cliente;

-- 2. Ordenar clientes alfabéticamente por apellido (y nombre si se repite)
SELECT apellido, nombre, dni, email, telefono
FROM cliente
ORDER BY apellido ASC, nombre ASC;

-- 3. Buscar clientes cuyo apellido comience con A
--    (% = cualquier cantidad de caracteres después de la A)
SELECT *
FROM cliente
WHERE apellido LIKE 'A%';

-- 4. Buscar una póliza por número
SELECT *
FROM poliza
WHERE numero_poliza = 'AP-2026-0003';

-- 5. Contar la cantidad de clientes
SELECT COUNT(*) AS cantidad_clientes
FROM cliente;

-- 6. Contar la cantidad de pólizas activas
SELECT COUNT(*) AS polizas_activas
FROM poliza
WHERE estado = 'ACTIVA';

-- 7. Contar la cantidad de siniestros
SELECT COUNT(*) AS cantidad_siniestros
FROM siniestro;

-- 8. Calcular el promedio de pagos
--    ROUND(..., 2) redondea a 2 decimales
SELECT ROUND(AVG(importe), 2) AS promedio_pagos
FROM pago;

-- 8 bis. Promedio solo de los pagos efectivamente cobrados
SELECT ROUND(AVG(importe), 2) AS promedio_pagos_cobrados
FROM pago
WHERE estado = 'PAGADO';


-- =====================================================================
-- PARTE 5.11 - CONSULTAS CON JOIN (muestran datos útiles, no solo IDs)
-- =====================================================================

-- JOIN 1: Cliente + Póliza
-- Qué póliza tiene cada cliente, con su vigencia y estado
SELECT c.apellido || ', ' || c.nombre AS cliente,
       c.dni,
       p.numero_poliza,
       p.fecha_inicio,
       p.fecha_fin,
       p.estado
FROM cliente c
INNER JOIN poliza p ON p.id_cliente = c.id_cliente
ORDER BY c.apellido, p.fecha_inicio;

-- JOIN 2: Póliza + Siniestro
-- Siniestros con el número de póliza al que pertenecen
SELECT p.numero_poliza,
       p.estado      AS estado_poliza,
       s.fecha       AS fecha_siniestro,
       s.tipo,
       s.descripcion,
       s.estado      AS estado_siniestro
FROM poliza p
INNER JOIN siniestro s ON s.id_poliza = p.id_poliza
ORDER BY s.fecha DESC;

-- JOIN 3: Cliente + Póliza + Siniestro
-- Quién tuvo cada siniestro, con qué póliza y en qué estado está
SELECT c.apellido || ', ' || c.nombre AS cliente,
       c.telefono,
       p.numero_poliza,
       s.fecha,
       s.tipo,
       s.estado
FROM cliente c
INNER JOIN poliza    p ON p.id_cliente = c.id_cliente
INNER JOIN siniestro s ON s.id_poliza  = p.id_poliza
ORDER BY s.fecha;


-- =====================================================================
-- CONSULTAS EXTRA (análisis / explotación)
-- =====================================================================

-- E1. LEFT JOIN: clientes SIN pólizas (el LEFT trae al cliente aunque
--     no tenga ninguna póliza, y en esos casos p.id_poliza queda NULL)
SELECT c.apellido, c.nombre, c.dni
FROM cliente c
LEFT JOIN poliza p ON p.id_cliente = c.id_cliente
WHERE p.id_poliza IS NULL;

-- E2. Coberturas de cada póliza con su suma asegurada (usa la tabla N:M)
SELECT p.numero_poliza,
       co.nombre AS cobertura,
       pc.suma_asegurada
FROM poliza p
INNER JOIN poliza_cobertura pc ON pc.id_poliza   = p.id_poliza
INNER JOIN cobertura        co ON co.id_cobertura = pc.id_cobertura
ORDER BY p.numero_poliza, co.nombre;

-- E3. Total cobrado por cliente (GROUP BY + SUM)
SELECT c.apellido || ', ' || c.nombre AS cliente,
       COUNT(pa.id_pago)              AS cantidad_pagos,
       SUM(pa.importe)                AS total_pagado
FROM cliente c
INNER JOIN poliza p  ON p.id_cliente = c.id_cliente
INNER JOIN pago   pa ON pa.id_poliza = p.id_poliza
WHERE pa.estado = 'PAGADO'
GROUP BY c.id_cliente
ORDER BY total_pagado DESC;

-- E4. Pagos vencidos (morosidad) con datos de contacto del cliente
SELECT c.apellido || ', ' || c.nombre AS cliente,
       c.telefono,
       p.numero_poliza,
       pa.fecha,
       pa.importe
FROM pago pa
INNER JOIN poliza  p ON p.id_poliza  = pa.id_poliza
INNER JOIN cliente c ON c.id_cliente = p.id_cliente
WHERE pa.estado = 'VENCIDO';


-- =====================================================================
-- CONSULTAS QUE USA EL DASHBOARD (app/api/dashboard/route.js)
-- =====================================================================

-- Indicadores
SELECT COUNT(*) FROM cliente WHERE activo = 1;
SELECT COUNT(*) FROM poliza WHERE estado = 'ACTIVA';
SELECT COUNT(*) FROM siniestro WHERE estado = 'ABIERTO';
SELECT COUNT(*) FROM siniestro WHERE estado = 'CERRADO';

-- Gráfico 1: Pólizas por estado
SELECT estado, COUNT(*) AS cantidad
FROM poliza
GROUP BY estado
ORDER BY cantidad DESC;

-- Gráfico 2: Siniestros por tipo
SELECT tipo, COUNT(*) AS cantidad
FROM siniestro
GROUP BY tipo
ORDER BY cantidad DESC;

-- Gráfico 3: Siniestros por mes
-- strftime('%Y-%m', fecha) convierte '2026-04-27' en '2026-04'
SELECT strftime('%Y-%m', fecha) AS mes, COUNT(*) AS cantidad
FROM siniestro
GROUP BY mes
ORDER BY mes;
