-- =============================================================================
-- TransitOps – Smart Transport Operations Platform
-- FILE : database/schema.sql
-- Run  : mysql -u root -p transitops_db < database/schema.sql
--        (create the database first — see README for full command sequence)
-- =============================================================================
-- Contains : All CREATE TABLE, PRIMARY KEY, FOREIGN KEY,
--            INDEX, and CONSTRAINT statements.
-- Normalization : BCNF + 4NF
-- Engine        : InnoDB  |  Charset : utf8mb4_unicode_ci  |  MySQL 8.0+
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';


-- ─────────────────────────────────────────────────────────────────────────────
-- REFERENCE / LOOKUP TABLES  (must exist before core tables reference them)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vehicle_makes (
  id                SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name              VARCHAR(80)       NOT NULL,
  country_of_origin VARCHAR(60)       NULL,
  created_at        TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vehicle_makes_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Vehicle manufacturer / brand catalogue';


CREATE TABLE IF NOT EXISTS vehicle_types (
  id          TINYINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name        VARCHAR(30)       NOT NULL,
  description VARCHAR(150)      NULL,
  created_at  TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vehicle_types_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Vehicle category / type catalogue';


CREATE TABLE IF NOT EXISTS fuel_types (
  id         TINYINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  code       VARCHAR(20)       NOT NULL,
  label      VARCHAR(40)       NOT NULL,
  unit_label VARCHAR(20)       NOT NULL DEFAULT 'litre',
  created_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fuel_types_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Fuel / energy type catalogue — shared by vehicles and fuel_logs';


CREATE TABLE IF NOT EXISTS vehicle_models (
  id              SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  make_id         SMALLINT UNSIGNED NOT NULL,
  vehicle_type_id TINYINT UNSIGNED  NOT NULL,
  name            VARCHAR(80)       NOT NULL,
  seating_config  VARCHAR(30)       NULL,
  created_at      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vehicle_models_make_name (make_id, name),
  KEY idx_vehicle_models_make_id         (make_id),
  KEY idx_vehicle_models_type_id         (vehicle_type_id),
  CONSTRAINT fk_vehicle_models_make_id
    FOREIGN KEY (make_id) REFERENCES vehicle_makes (id) ON UPDATE CASCADE,
  CONSTRAINT fk_vehicle_models_vehicle_type_id
    FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Vehicle model catalogue — resolves make and type transitive dependency';


CREATE TABLE IF NOT EXISTS locations (
  id         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100)    NOT NULL,
  address    VARCHAR(255)    NULL,
  city       VARCHAR(80)     NOT NULL,
  state      VARCHAR(60)     NOT NULL,
  pincode    VARCHAR(10)     NULL,
  latitude   DECIMAL(10, 7)  NULL,
  longitude  DECIMAL(10, 7)  NULL,
  is_active  TINYINT(1)      NOT NULL DEFAULT 1,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_locations_name_city (name, city),
  KEY idx_locations_city  (city),
  KEY idx_locations_state (state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Canonical location catalogue — depots, hubs, customer sites';


CREATE TABLE IF NOT EXISTS vendors (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100)  NOT NULL,
  contact_phone VARCHAR(20)   NULL,
  contact_email VARCHAR(150)  NULL,
  address       TEXT          NULL,
  vendor_type   ENUM('MAINTENANCE','FUEL','INSURANCE','REGISTRATION','TOLLS','OTHER') NOT NULL DEFAULT 'OTHER',
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendors_name (name),
  KEY idx_vendors_type      (vendor_type),
  KEY idx_vendors_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Vendor / supplier catalogue — shared by maintenance_logs and expenses';


CREATE TABLE IF NOT EXISTS fuel_stations (
  id         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100)    NOT NULL,
  address    VARCHAR(255)    NULL,
  city       VARCHAR(80)     NOT NULL,
  state      VARCHAR(60)     NOT NULL,
  latitude   DECIMAL(10, 7)  NULL,
  longitude  DECIMAL(10, 7)  NULL,
  is_active  TINYINT(1)      NOT NULL DEFAULT 1,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_fuel_stations_city      (city),
  KEY idx_fuel_stations_state     (state),
  KEY idx_fuel_stations_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Fuel station catalogue — shared by all fuel_logs entries';


-- ─────────────────────────────────────────────────────────────────────────────
-- CORE DOMAIN TABLES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS roles (
  id          TINYINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name        VARCHAR(50)       NOT NULL,
  description VARCHAR(255)      NULL,
  created_at  TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='RBAC permission levels';


CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  role_id       TINYINT UNSIGNED  NOT NULL,
  full_name     VARCHAR(100)      NOT NULL,
  email         VARCHAR(150)      NOT NULL,
  password_hash VARCHAR(255)      NOT NULL,
  phone         VARCHAR(20)       NULL,
  status        ENUM('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  last_login    TIMESTAMP         NULL,
  created_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_id     (role_id),
  KEY idx_users_status      (status),
  CONSTRAINT fk_users_role_id
    FOREIGN KEY (role_id) REFERENCES roles (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='System user accounts — all human actors';


CREATE TABLE IF NOT EXISTS vehicles (
  id                  INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  registration_number VARCHAR(20)       NOT NULL,
  model_id            SMALLINT UNSIGNED NOT NULL,
  fuel_type_id        TINYINT UNSIGNED  NOT NULL,
  year                YEAR              NOT NULL,
  capacity            SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  color               VARCHAR(30)       NULL,
  chassis_number      VARCHAR(50)       NULL,
  engine_number       VARCHAR(50)       NULL,
  insurance_expiry    DATE              NULL,
  license_expiry      DATE              NULL,
  purchase_date       DATE              NULL,
  purchase_price      DECIMAL(12, 2)    NULL,
  current_odometer    INT UNSIGNED      NOT NULL DEFAULT 0,
  status              ENUM('ACTIVE','INACTIVE','IN_MAINTENANCE','RETIRED') NOT NULL DEFAULT 'ACTIVE',
  notes               TEXT              NULL,
  created_by          INT UNSIGNED      NOT NULL,
  created_at          TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vehicles_registration (registration_number),
  UNIQUE KEY uq_vehicles_chassis      (chassis_number),
  KEY idx_vehicles_model_id           (model_id),
  KEY idx_vehicles_fuel_type_id       (fuel_type_id),
  KEY idx_vehicles_status             (status),
  KEY idx_vehicles_insurance_expiry   (insurance_expiry),
  KEY idx_vehicles_license_expiry     (license_expiry),
  KEY idx_vehicles_created_by         (created_by),
  CONSTRAINT fk_vehicles_model_id
    FOREIGN KEY (model_id)     REFERENCES vehicle_models (id) ON UPDATE CASCADE,
  CONSTRAINT fk_vehicles_fuel_type_id
    FOREIGN KEY (fuel_type_id) REFERENCES fuel_types     (id) ON UPDATE CASCADE,
  CONSTRAINT fk_vehicles_created_by
    FOREIGN KEY (created_by)   REFERENCES users           (id) ON UPDATE CASCADE,
  CONSTRAINT chk_vehicles_capacity
    CHECK (capacity >= 1),
  CONSTRAINT chk_vehicles_purchase_price
    CHECK (purchase_price IS NULL OR purchase_price >= 0),
  CONSTRAINT chk_vehicles_odometer
    CHECK (current_odometer >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Fleet vehicle inventory — physical units';


CREATE TABLE IF NOT EXISTS drivers (
  id                      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id                 INT UNSIGNED  NULL,
  employee_id             VARCHAR(20)   NOT NULL,
  full_name               VARCHAR(100)  NOT NULL,
  email                   VARCHAR(150)  NULL,
  phone                   VARCHAR(20)   NOT NULL,
  license_number          VARCHAR(30)   NOT NULL,
  license_expiry          DATE          NOT NULL,
  license_class           VARCHAR(30)   NOT NULL,
  date_of_birth           DATE          NULL,
  address                 TEXT          NULL,
  emergency_contact_name  VARCHAR(100)  NULL,
  emergency_contact_phone VARCHAR(20)   NULL,
  joining_date            DATE          NOT NULL,
  status                  ENUM('AVAILABLE','ON_TRIP','ON_LEAVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'AVAILABLE',
  profile_image           VARCHAR(255)  NULL,
  notes                   TEXT          NULL,
  created_by              INT UNSIGNED  NOT NULL,
  created_at              TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_drivers_employee_id    (employee_id),
  UNIQUE KEY uq_drivers_license_number (license_number),
  UNIQUE KEY uq_drivers_user_id        (user_id),
  KEY idx_drivers_status               (status),
  KEY idx_drivers_license_expiry       (license_expiry),
  KEY idx_drivers_created_by           (created_by),
  CONSTRAINT fk_drivers_user_id
    FOREIGN KEY (user_id)    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_drivers_created_by
    FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Driver profiles — employment, licensing, availability';


CREATE TABLE IF NOT EXISTS trips (
  id                   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  trip_number          VARCHAR(30)     NOT NULL,
  vehicle_id           INT UNSIGNED    NOT NULL,
  driver_id            INT UNSIGNED    NOT NULL,
  origin_id            INT UNSIGNED    NOT NULL,
  destination_id       INT UNSIGNED    NOT NULL,
  created_by           INT UNSIGNED    NOT NULL,
  scheduled_departure  DATETIME        NOT NULL,
  scheduled_arrival    DATETIME        NOT NULL,
  actual_departure     DATETIME        NULL,
  actual_arrival       DATETIME        NULL,
  status               ENUM('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED','DELAYED') NOT NULL DEFAULT 'SCHEDULED',
  distance_km          DECIMAL(8, 2)   NULL,
  passenger_count      SMALLINT UNSIGNED NULL DEFAULT 0,
  cargo_weight_kg      DECIMAL(8, 2)   NULL,
  purpose              VARCHAR(255)    NULL,
  cancellation_reason  TEXT            NULL,
  notes                TEXT            NULL,
  created_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_trips_trip_number          (trip_number),
  KEY idx_trips_vehicle_id                 (vehicle_id),
  KEY idx_trips_driver_id                  (driver_id),
  KEY idx_trips_origin_id                  (origin_id),
  KEY idx_trips_destination_id             (destination_id),
  KEY idx_trips_status                     (status),
  KEY idx_trips_scheduled_departure        (scheduled_departure),
  KEY idx_trips_scheduled_arrival          (scheduled_arrival),
  KEY idx_trips_created_by                 (created_by),
  KEY idx_trips_vehicle_status_sched       (vehicle_id, status, scheduled_departure, scheduled_arrival),
  KEY idx_trips_driver_status_sched        (driver_id,  status, scheduled_departure, scheduled_arrival),
  CONSTRAINT fk_trips_vehicle_id
    FOREIGN KEY (vehicle_id)     REFERENCES vehicles  (id) ON UPDATE CASCADE,
  CONSTRAINT fk_trips_driver_id
    FOREIGN KEY (driver_id)      REFERENCES drivers   (id) ON UPDATE CASCADE,
  CONSTRAINT fk_trips_origin_id
    FOREIGN KEY (origin_id)      REFERENCES locations (id) ON UPDATE CASCADE,
  CONSTRAINT fk_trips_destination_id
    FOREIGN KEY (destination_id) REFERENCES locations (id) ON UPDATE CASCADE,
  CONSTRAINT fk_trips_created_by
    FOREIGN KEY (created_by)     REFERENCES users     (id) ON UPDATE CASCADE,
  CONSTRAINT chk_trips_arrival_after_departure
    CHECK (scheduled_arrival > scheduled_departure),
  CONSTRAINT chk_trips_actual_arrival_valid
    CHECK (actual_arrival IS NULL OR actual_departure IS NULL OR actual_arrival >= actual_departure),
  CONSTRAINT chk_trips_passenger_count
    CHECK (passenger_count IS NULL OR passenger_count >= 0),
  CONSTRAINT chk_trips_distance
    CHECK (distance_km IS NULL OR distance_km > 0),
  CONSTRAINT chk_trips_cargo_weight
    CHECK (cargo_weight_kg IS NULL OR cargo_weight_kg >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Transport assignments — scheduled and completed trips';


CREATE TABLE IF NOT EXISTS maintenance_logs (
  id                        INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  vehicle_id                INT UNSIGNED    NOT NULL,
  vendor_id                 INT UNSIGNED    NULL,
  maintenance_type          ENUM('ROUTINE','REPAIR','INSPECTION','EMERGENCY','RECALL') NOT NULL,
  description               TEXT            NOT NULL,
  cost                      DECIMAL(12, 2)  NOT NULL DEFAULT 0.00,
  odometer_reading          INT UNSIGNED    NULL,
  start_date                DATE            NOT NULL,
  end_date                  DATE            NULL,
  status                    ENUM('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
  next_maintenance_date     DATE            NULL,
  next_maintenance_odometer INT UNSIGNED    NULL,
  parts_replaced            TEXT            NULL,
  notes                     TEXT            NULL,
  created_by                INT UNSIGNED    NOT NULL,
  created_at                TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_maintenance_vehicle_id   (vehicle_id),
  KEY idx_maintenance_vendor_id    (vendor_id),
  KEY idx_maintenance_status       (status),
  KEY idx_maintenance_type         (maintenance_type),
  KEY idx_maintenance_start_date   (start_date),
  KEY idx_maintenance_next_date    (next_maintenance_date),
  KEY idx_maintenance_created_by   (created_by),
  KEY idx_maintenance_vehicle_date (vehicle_id, start_date),
  CONSTRAINT fk_maintenance_vehicle_id
    FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON UPDATE CASCADE,
  CONSTRAINT fk_maintenance_vendor_id
    FOREIGN KEY (vendor_id)  REFERENCES vendors  (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_maintenance_created_by
    FOREIGN KEY (created_by) REFERENCES users    (id) ON UPDATE CASCADE,
  CONSTRAINT chk_maintenance_cost
    CHECK (cost >= 0),
  CONSTRAINT chk_maintenance_end_after_start
    CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT chk_maintenance_odometer
    CHECK (odometer_reading IS NULL OR odometer_reading >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Vehicle maintenance work orders and history';


CREATE TABLE IF NOT EXISTS fuel_logs (
  id               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  vehicle_id       INT UNSIGNED     NOT NULL,
  driver_id        INT UNSIGNED     NULL,
  trip_id          INT UNSIGNED     NULL,
  fuel_type_id     TINYINT UNSIGNED NOT NULL,
  fuel_station_id  INT UNSIGNED     NULL,
  quantity         DECIMAL(8, 2)    NOT NULL,
  price_per_unit   DECIMAL(8, 2)    NOT NULL,
  total_cost       DECIMAL(10, 2)   NOT NULL,
  odometer_reading INT UNSIGNED     NULL,
  fueling_date     DATETIME         NOT NULL,
  receipt_number   VARCHAR(50)      NULL,
  is_full_tank     TINYINT(1)       NOT NULL DEFAULT 1,
  notes            TEXT             NULL,
  created_by       INT UNSIGNED     NOT NULL,
  created_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_fuel_vehicle_id    (vehicle_id),
  KEY idx_fuel_driver_id     (driver_id),
  KEY idx_fuel_trip_id       (trip_id),
  KEY idx_fuel_fuel_type_id  (fuel_type_id),
  KEY idx_fuel_station_id    (fuel_station_id),
  KEY idx_fuel_fueling_date  (fueling_date),
  KEY idx_fuel_created_by    (created_by),
  KEY idx_fuel_vehicle_date  (vehicle_id, fueling_date),
  CONSTRAINT fk_fuel_vehicle_id
    FOREIGN KEY (vehicle_id)      REFERENCES vehicles      (id) ON UPDATE CASCADE,
  CONSTRAINT fk_fuel_driver_id
    FOREIGN KEY (driver_id)       REFERENCES drivers       (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_fuel_trip_id
    FOREIGN KEY (trip_id)         REFERENCES trips         (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_fuel_fuel_type_id
    FOREIGN KEY (fuel_type_id)    REFERENCES fuel_types    (id) ON UPDATE CASCADE,
  CONSTRAINT fk_fuel_station_id
    FOREIGN KEY (fuel_station_id) REFERENCES fuel_stations (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_fuel_created_by
    FOREIGN KEY (created_by)      REFERENCES users         (id) ON UPDATE CASCADE,
  CONSTRAINT chk_fuel_quantity
    CHECK (quantity > 0),
  CONSTRAINT chk_fuel_price
    CHECK (price_per_unit > 0),
  CONSTRAINT chk_fuel_total_cost
    CHECK (total_cost > 0),
  CONSTRAINT chk_fuel_odometer
    CHECK (odometer_reading IS NULL OR odometer_reading >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Vehicle fueling events — quantity, cost, and odometer readings';


CREATE TABLE IF NOT EXISTS expenses (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  expense_number  VARCHAR(30)     NOT NULL,
  category        ENUM('FUEL','MAINTENANCE','TOLL','INSURANCE','REGISTRATION','SALARY','PENALTY','OTHER') NOT NULL,
  vehicle_id      INT UNSIGNED    NULL,
  driver_id       INT UNSIGNED    NULL,
  trip_id         INT UNSIGNED    NULL,
  vendor_id       INT UNSIGNED    NULL,
  amount          DECIMAL(12, 2)  NOT NULL,
  currency        CHAR(3)         NOT NULL DEFAULT 'INR',
  description     TEXT            NOT NULL,
  receipt_number  VARCHAR(50)     NULL,
  expense_date    DATE            NOT NULL,
  payment_method  ENUM('CASH','CARD','BANK_TRANSFER','UPI','CHEQUE') NOT NULL DEFAULT 'CASH',
  payment_status  ENUM('PENDING','PAID','REJECTED','REIMBURSED') NOT NULL DEFAULT 'PENDING',
  approved_by     INT UNSIGNED    NULL,
  approved_at     TIMESTAMP       NULL,
  notes           TEXT            NULL,
  created_by      INT UNSIGNED    NOT NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_expenses_expense_number (expense_number),
  KEY idx_expenses_category             (category),
  KEY idx_expenses_vehicle_id           (vehicle_id),
  KEY idx_expenses_driver_id            (driver_id),
  KEY idx_expenses_trip_id              (trip_id),
  KEY idx_expenses_vendor_id            (vendor_id),
  KEY idx_expenses_expense_date         (expense_date),
  KEY idx_expenses_payment_status       (payment_status),
  KEY idx_expenses_approved_by          (approved_by),
  KEY idx_expenses_created_by           (created_by),
  KEY idx_expenses_category_date        (category, expense_date),
  CONSTRAINT fk_expenses_vehicle_id
    FOREIGN KEY (vehicle_id)  REFERENCES vehicles (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_expenses_driver_id
    FOREIGN KEY (driver_id)   REFERENCES drivers  (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_expenses_trip_id
    FOREIGN KEY (trip_id)     REFERENCES trips    (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_expenses_vendor_id
    FOREIGN KEY (vendor_id)   REFERENCES vendors  (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_expenses_approved_by
    FOREIGN KEY (approved_by) REFERENCES users    (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_expenses_created_by
    FOREIGN KEY (created_by)  REFERENCES users    (id) ON UPDATE CASCADE,
  CONSTRAINT chk_expenses_amount
    CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='General expense ledger — all operational costs';


SET FOREIGN_KEY_CHECKS = 1;
