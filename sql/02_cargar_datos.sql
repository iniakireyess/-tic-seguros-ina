-- =====================================================================
-- TIC - Sistema de Seguros de Accidentes Personales
-- Script 2: CARGA DE DATOS DE PRUEBA (ficticios pero coherentes)
-- Ejecutar DESPUÉS de 01_crear_tablas.sql
-- =====================================================================
-- Reglas de coherencia que se respetaron al armar los datos:
--   * Toda póliza VENCIDA tiene fecha_fin anterior a hoy (oct-2026).
--   * Toda póliza ACTIVA está vigente hoy.
--   * Cada siniestro ocurre DENTRO de la vigencia de su póliza.
--   * Cada pago tiene fecha dentro de la vigencia de su póliza.
--   * Un cliente (Romero) no tiene pólizas -> sirve para probar DELETE
--     y para mostrar un LEFT JOIN.
-- =====================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------- CLIENTES (12)
INSERT INTO cliente (nombre, apellido, dni, email, telefono) VALUES
('Lucía',     'Acosta',    '38451276', 'lucia.acosta@mail.com',     '11-4521-3390'),
('Martín',    'Aguirre',   '35112908', 'martin.aguirre@mail.com',   '11-3367-8812'),
('Sofía',     'Arias',     '40223561', 'sofia.arias@mail.com',      '11-5874-2201'),
('Diego',     'Benítez',   '33908714', 'diego.benitez@mail.com',    '11-4410-7765'),
('Valentina', 'Castro',    '41567032', 'vale.castro@mail.com',      '11-6203-1148'),
('Javier',    'Díaz',      '29874451', 'javier.diaz@mail.com',      '11-4789-5532'),
('Camila',    'Fernández', '39012347', 'cami.fernandez@mail.com',   '11-3945-6620'),
('Nicolás',   'Gómez',     '36745820', 'nico.gomez@mail.com',       '11-5521-9073'),
('Florencia', 'Herrera',   '37890125', 'flor.herrera@mail.com',     '11-4632-1907'),
('Tomás',     'Medina',    '42301598', 'tomas.medina@mail.com',     '11-6078-4415'),
('Agustina',  'Pereyra',   '34567219', 'agus.pereyra@mail.com',     '11-3812-2096'),
('Federico',  'Romero',    '31209874', 'fede.romero@mail.com',      '11-4958-3371');

-- ---------------------------------------------------------------- COBERTURAS (6)
INSERT INTO cobertura (nombre, descripcion) VALUES
('Muerte accidental',               'Indemnización a beneficiarios por fallecimiento a causa de un accidente'),
('Invalidez total y permanente',    'Pago único si el accidente produce una incapacidad total e irreversible'),
('Invalidez parcial',               'Pago proporcional al grado de incapacidad parcial permanente'),
('Asistencia médico-farmacéutica',  'Reintegro de gastos médicos, estudios y medicamentos por el accidente'),
('Gastos de sepelio',               'Cobertura de los gastos de sepelio en caso de muerte accidental'),
('Renta diaria por internación',    'Monto fijo por cada día de internación a causa de un accidente');

-- ---------------------------------------------------------------- PÓLIZAS (12)
INSERT INTO poliza (numero_poliza, id_cliente, fecha_inicio, fecha_fin, estado) VALUES
('AP-2025-0001',  1, '2025-11-01', '2026-10-31', 'ACTIVA'),
('AP-2025-0002',  2, '2025-12-01', '2026-11-30', 'ACTIVA'),
('AP-2026-0003',  3, '2026-01-15', '2027-01-14', 'ACTIVA'),
('AP-2026-0004',  4, '2026-02-01', '2027-01-31', 'ACTIVA'),
('AP-2026-0005',  5, '2026-03-10', '2027-03-09', 'ACTIVA'),
('AP-2026-0006',  6, '2026-04-01', '2027-03-31', 'ACTIVA'),
('AP-2026-0007',  7, '2026-05-20', '2027-05-19', 'ACTIVA'),
('AP-2025-0008',  8, '2025-01-01', '2025-12-31', 'VENCIDA'),
('AP-2025-0009',  9, '2025-03-01', '2026-02-28', 'VENCIDA'),
('AP-2025-0010', 10, '2025-06-01', '2026-05-31', 'VENCIDA'),
('AP-2026-0011',  1, '2026-02-15', '2027-02-14', 'CANCELADA'),
('AP-2026-0012', 11, '2026-07-01', '2027-06-30', 'ACTIVA');

-- ---------------------------------------------------------------- PÓLIZA x COBERTURA
-- Todas las pólizas tienen muerte accidental (1) + otras según el plan
INSERT INTO poliza_cobertura (id_poliza, id_cobertura, suma_asegurada) VALUES
(1, 1, 15000000), (1, 2, 15000000), (1, 4, 2000000),
(2, 1, 10000000), (2, 4, 1500000),
(3, 1, 20000000), (3, 2, 20000000), (3, 3, 10000000), (3, 4, 3000000),
(4, 1, 10000000), (4, 5, 1000000),
(5, 1, 12000000), (5, 4, 2000000), (5, 6, 50000),
(6, 1, 25000000), (6, 2, 25000000), (6, 4, 4000000),
(7, 1, 10000000), (7, 3, 5000000),
(8, 1, 8000000),
(9, 1, 8000000), (9, 4, 1000000),
(10, 1, 10000000), (10, 6, 40000),
(11, 1, 5000000),
(12, 1, 15000000), (12, 2, 15000000), (12, 6, 60000);

-- ---------------------------------------------------------------- PAGOS (20)
INSERT INTO pago (id_poliza, fecha, importe, estado) VALUES
( 1, '2026-08-05', 12500, 'PAGADO'),
( 1, '2026-09-05', 12500, 'PAGADO'),
( 1, '2026-10-05', 12500, 'PENDIENTE'),
( 2, '2026-08-10',  9800, 'PAGADO'),
( 2, '2026-09-10',  9800, 'VENCIDO'),
( 3, '2026-08-15', 18900, 'PAGADO'),
( 3, '2026-09-15', 18900, 'PAGADO'),
( 3, '2026-10-15', 18900, 'PAGADO'),
( 4, '2026-09-01',  8700, 'PAGADO'),
( 4, '2026-10-01',  8700, 'PENDIENTE'),
( 5, '2026-09-10', 11200, 'PAGADO'),
( 6, '2026-09-01', 21500, 'PAGADO'),
( 6, '2026-10-01', 21500, 'PAGADO'),
( 7, '2026-09-20',  9300, 'VENCIDO'),
( 8, '2025-11-01',  7600, 'PAGADO'),
( 8, '2025-12-01',  7600, 'PAGADO'),
( 9, '2026-01-01',  8100, 'PAGADO'),
(10, '2026-04-01',  9900, 'PAGADO'),
(10, '2026-05-01',  9900, 'VENCIDO'),
(12, '2026-10-01', 14700, 'PAGADO');

-- ---------------------------------------------------------------- SINIESTROS (12)
INSERT INTO siniestro (id_poliza, fecha, tipo, descripcion, estado) VALUES
( 1, '2026-01-12', 'Caída',                 'Caída en escalera del subte, esguince de tobillo',          'CERRADO'),
( 2, '2026-02-03', 'Accidente de tránsito', 'Choque en moto en Av. Rivadavia, fractura de muñeca',       'CERRADO'),
( 9, '2026-02-20', 'Accidente deportivo',   'Lesión de rodilla jugando al fútbol',                       'CERRADO'),
( 3, '2026-03-08', 'Accidente doméstico',   'Corte profundo en la mano con vidrio, requirió sutura',      'CERRADO'),
(10, '2026-04-14', 'Accidente laboral',     'Golpe en la espalda al levantar mercadería en depósito',    'CERRADO'),
( 4, '2026-04-27', 'Accidente de tránsito', 'Atropellado por bicicleta al cruzar la calle',              'CERRADO'),
( 5, '2026-05-19', 'Caída',                 'Resbalón en vereda mojada, contusión en cadera',            'CERRADO'),
( 6, '2026-06-30', 'Accidente deportivo',   'Fractura de clavícula andando en bicicleta',                'ABIERTO'),
( 2, '2026-07-22', 'Caída',                 'Caída desde escalera al pintar, internación de 2 días',      'ABIERTO'),
( 7, '2026-08-09', 'Accidente de tránsito', 'Choque leve en auto, latigazo cervical',                     'ABIERTO'),
(12, '2026-09-15', 'Accidente laboral',     'Quemadura en el brazo con máquina de café en el trabajo',    'ABIERTO'),
( 3, '2026-10-05', 'Accidente doméstico',   'Caída de mueble sobre el pie, fisura de metatarso',          'ABIERTO');
