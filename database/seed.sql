-- =============================================================================
-- TransitOps – Smart Transport Operations Platform
-- FILE : database/seed.sql
-- Run  : mysql -u root -p transitops_db < database/seed.sql
--        (run schema.sql first)
-- =============================================================================
-- Contains : All INSERT statements for default / reference data.
-- Order    : roles → vehicle_types → fuel_types → vehicle_makes → vehicle_models
-- All INSERTs use ON DUPLICATE KEY UPDATE — fully idempotent / re-runnable.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ROLES  (required before any user can be created)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO roles (name, description) VALUES
  ('SUPER_ADMIN', 'Full system access — manages roles, users, and all configuration'),
  ('ADMIN',       'Fleet administrator — manages vehicles, drivers, and system settings'),
  ('MANAGER',     'Operations manager — creates trips, approves expenses, views reports'),
  ('DRIVER',      'Driver portal access — views own trips and submits fuel/expense logs'),
  ('VIEWER',      'Read-only access — can view dashboards and reports without editing')
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  updated_at  = CURRENT_TIMESTAMP;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. VEHICLE TYPES  (required before vehicle_models)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO vehicle_types (name, description) VALUES
  ('BUS',        'Large passenger carrier — typically 20+ seats'),
  ('TRUCK',      'Heavy goods vehicle for cargo and freight transport'),
  ('VAN',        'Medium-sized vehicle — passenger or light cargo use'),
  ('CAR',        'Light motor vehicle for small passenger groups'),
  ('MOTORCYCLE', 'Two-wheeled motor vehicle — courier or scout use'),
  ('OTHER',      'Any vehicle not fitting the above categories')
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  updated_at  = CURRENT_TIMESTAMP;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. FUEL TYPES  (required before vehicles and fuel_logs)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO fuel_types (code, label, unit_label) VALUES
  ('DIESEL',   'Diesel',                    'litre'),
  ('PETROL',   'Petrol / Gasoline',         'litre'),
  ('CNG',      'Compressed Natural Gas',    'kg'),
  ('LPG',      'Liquefied Petroleum Gas',   'litre'),
  ('ELECTRIC', 'Electric',                  'kWh'),
  ('HYBRID',   'Hybrid (Petrol + Electric)','litre')
ON DUPLICATE KEY UPDATE
  label      = VALUES(label),
  unit_label = VALUES(unit_label),
  updated_at = CURRENT_TIMESTAMP;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. VEHICLE MAKES  (required before vehicle_models)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO vehicle_makes (name, country_of_origin) VALUES
  ('Tata Motors',   'India'),
  ('Ashok Leyland', 'India'),
  ('VECV (Eicher)', 'India'),
  ('Mahindra',      'India'),
  ('Maruti Suzuki', 'India'),
  ('Force Motors',  'India'),
  ('Bajaj Auto',    'India'),
  ('Toyota',        'Japan'),
  ('Mercedes-Benz', 'Germany'),
  ('Volvo Buses',   'Sweden'),
  ('Other / Custom', NULL)
ON DUPLICATE KEY UPDATE
  country_of_origin = VALUES(country_of_origin),
  updated_at        = CURRENT_TIMESTAMP;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. VEHICLE MODELS  (depends on vehicle_makes + vehicle_types)
--    JOIN-based INSERT resolves name strings to FK IDs automatically.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO vehicle_models (make_id, vehicle_type_id, name, seating_config)
SELECT vm.id, vt.id, m.name, m.seating_config
FROM (
  SELECT 'Tata Motors'    AS make, 'BUS'        AS type, 'Starbus Ultra 54'  AS name, '2+2' AS seating_config UNION ALL
  SELECT 'Tata Motors',            'BUS',                'Starbus Ultra 45',            '2+2'                 UNION ALL
  SELECT 'Tata Motors',            'TRUCK',              'Prima 4928.S',               NULL                   UNION ALL
  SELECT 'Tata Motors',            'TRUCK',              'LPT 1918',                   NULL                   UNION ALL
  SELECT 'Tata Motors',            'VAN',                'Winger',                     '2+1'                  UNION ALL
  SELECT 'Tata Motors',            'CAR',                'Indica eV2',                 '2+3'                  UNION ALL
  SELECT 'Ashok Leyland',          'BUS',                'Viking',                     '2+3'                  UNION ALL
  SELECT 'Ashok Leyland',          'BUS',                'Lynx',                       '2+2'                  UNION ALL
  SELECT 'Ashok Leyland',          'TRUCK',              'U-Truck 2518',               NULL                   UNION ALL
  SELECT 'Ashok Leyland',          'TRUCK',              'Captain 5525',               NULL                   UNION ALL
  SELECT 'VECV (Eicher)',           'TRUCK',              'Pro 6028',                   NULL                   UNION ALL
  SELECT 'VECV (Eicher)',           'VAN',                'Skyline Pro 12',             '2+1'                  UNION ALL
  SELECT 'Mahindra',               'VAN',                'Tourister Cosmo 17',         '2+1'                  UNION ALL
  SELECT 'Mahindra',               'CAR',                'Scorpio N',                  '2+3'                  UNION ALL
  SELECT 'Mahindra',               'CAR',                'Bolero Power+',              '2+3'                  UNION ALL
  SELECT 'Maruti Suzuki',          'CAR',                'Ertiga',                     '2+3'                  UNION ALL
  SELECT 'Maruti Suzuki',          'VAN',                'Super Carry',                NULL                   UNION ALL
  SELECT 'Force Motors',           'VAN',                'Traveller 3700',             '2+1'                  UNION ALL
  SELECT 'Force Motors',           'VAN',                'Trump 40',                   '2+2'                  UNION ALL
  SELECT 'Bajaj Auto',             'MOTORCYCLE',         'Platina',                    NULL                   UNION ALL
  SELECT 'Toyota',                 'CAR',                'Innova Crysta',              '2+3'                  UNION ALL
  SELECT 'Toyota',                 'BUS',                'Coaster',                    '2+2'                  UNION ALL
  SELECT 'Mercedes-Benz',          'BUS',                'Travego',                    '2+1'                  UNION ALL
  SELECT 'Volvo Buses',            'BUS',                'B9R',                        '2+2'                  UNION ALL
  SELECT 'Other / Custom',         'OTHER',              'Custom / Other',             NULL
) AS m
JOIN vehicle_makes vm ON vm.name = m.make
JOIN vehicle_types vt ON vt.name = m.type
ON DUPLICATE KEY UPDATE
  vehicle_type_id = VALUES(vehicle_type_id),
  seating_config  = VALUES(seating_config),
  updated_at      = CURRENT_TIMESTAMP;


