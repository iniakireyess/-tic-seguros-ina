-- =====================================================================
-- TIC - Sistema de Seguros de Accidentes Personales
-- Script 1: CREACIÓN DE TABLAS (SQLite / Turso-libSQL)
-- Base: seguros.db
-- =====================================================================
-- Orden de creación: primero las tablas "padre" (sin FK) y después las
-- "hijas", porque una FK solo puede apuntar a una tabla que ya existe.
-- =====================================================================

PRAGMA foreign_keys = ON;

-- Si se vuelve a ejecutar el script, se borra todo en orden inverso
DROP TABLE IF EXISTS pago;
DROP TABLE IF EXISTS siniestro;
DROP TABLE IF EXISTS poliza_cobertura;
DROP TABLE IF EXISTS poliza;
DROP TABLE IF EXISTS cobertura;
DROP TABLE IF EXISTS cliente;

-- ---------------------------------------------------------------------
-- CLIENTE: la persona asegurada.
-- "activo" permite la BAJA LÓGICA: si el cliente tiene pólizas no se
-- puede borrar (se perdería el historial), entonces se marca activo = 0.
-- ---------------------------------------------------------------------
CREATE TABLE cliente (
    id_cliente  INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre      TEXT    NOT NULL,
    apellido    TEXT    NOT NULL,
    dni         TEXT    NOT NULL UNIQUE,
    email       TEXT,
    telefono    TEXT,
    activo      INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
);

-- ---------------------------------------------------------------------
-- COBERTURA: catálogo de lo que puede cubrir una póliza
-- (muerte accidental, invalidez, gastos médicos, etc.)
-- ---------------------------------------------------------------------
CREATE TABLE cobertura (
    id_cobertura INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre       TEXT NOT NULL UNIQUE,
    descripcion  TEXT
);

-- ---------------------------------------------------------------------
-- POLIZA: el contrato. Un cliente puede tener muchas pólizas (1:N).
-- ---------------------------------------------------------------------
CREATE TABLE poliza (
    id_poliza     INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_poliza TEXT    NOT NULL UNIQUE,
    id_cliente    INTEGER NOT NULL,
    fecha_inicio  DATE    NOT NULL,
    fecha_fin     DATE    NOT NULL,
    estado        TEXT    NOT NULL DEFAULT 'ACTIVA'
                  CHECK (estado IN ('ACTIVA', 'VENCIDA', 'CANCELADA')),
    CHECK (fecha_fin > fecha_inicio),
    FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente)
);

-- ---------------------------------------------------------------------
-- POLIZA_COBERTURA: tabla intermedia para la relación MUCHOS A MUCHOS.
-- Una póliza tiene varias coberturas y una cobertura está en varias
-- pólizas. La suma asegurada depende de la COMBINACIÓN póliza+cobertura,
-- por eso va acá y no en poliza ni en cobertura (3FN).
-- ---------------------------------------------------------------------
CREATE TABLE poliza_cobertura (
    id_poliza       INTEGER NOT NULL,
    id_cobertura    INTEGER NOT NULL,
    suma_asegurada  REAL    NOT NULL CHECK (suma_asegurada > 0),
    PRIMARY KEY (id_poliza, id_cobertura),
    FOREIGN KEY (id_poliza)    REFERENCES poliza(id_poliza),
    FOREIGN KEY (id_cobertura) REFERENCES cobertura(id_cobertura)
);

-- ---------------------------------------------------------------------
-- SINIESTRO: el accidente denunciado. Una póliza puede tener muchos
-- siniestros (1:N). No guarda id_cliente: el cliente se obtiene a través
-- de la póliza (guardarlo sería redundante y violaría 3FN).
-- ---------------------------------------------------------------------
CREATE TABLE siniestro (
    id_siniestro INTEGER PRIMARY KEY AUTOINCREMENT,
    id_poliza    INTEGER NOT NULL,
    fecha        DATE    NOT NULL,
    tipo         TEXT    NOT NULL
                 CHECK (tipo IN ('Accidente de tránsito', 'Caída',
                                 'Accidente laboral', 'Accidente deportivo',
                                 'Accidente doméstico')),
    descripcion  TEXT,
    estado       TEXT    NOT NULL DEFAULT 'ABIERTO'
                 CHECK (estado IN ('ABIERTO', 'CERRADO')),
    FOREIGN KEY (id_poliza) REFERENCES poliza(id_poliza)
);

-- ---------------------------------------------------------------------
-- PAGO: cada cuota que se paga de una póliza (1:N).
-- ---------------------------------------------------------------------
CREATE TABLE pago (
    id_pago   INTEGER PRIMARY KEY AUTOINCREMENT,
    id_poliza INTEGER NOT NULL,
    fecha     DATE    NOT NULL,
    importe   REAL    NOT NULL CHECK (importe > 0),
    estado    TEXT    NOT NULL DEFAULT 'PENDIENTE'
              CHECK (estado IN ('PAGADO', 'PENDIENTE', 'VENCIDO')),
    FOREIGN KEY (id_poliza) REFERENCES poliza(id_poliza)
);

-- Índices sobre las FK para que los JOIN sean más rápidos
CREATE INDEX idx_poliza_cliente   ON poliza(id_cliente);
CREATE INDEX idx_siniestro_poliza ON siniestro(id_poliza);
CREATE INDEX idx_pago_poliza      ON pago(id_poliza);
