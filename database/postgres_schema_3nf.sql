-- =============================================================================
-- TransitOps – Smart Transport Operations Platform
-- FILE : database/postgres_schema_3nf.sql
-- DIALECT: PostgreSQL 14+ / Neon / Supabase / Render Postgres
-- NORMALIZATION: Strict 3NF / BCNF
-- =============================================================================

-- Enable UUID extension (optional, for cryptographically random identifiers)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. REFERENCE / LOOKUP ENTITIES (Eliminate Transitive Dependencies)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vehicle_makes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    country_of_origin VARCHAR(60),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fuel_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    label VARCHAR(40) NOT NULL,
    unit_label VARCHAR(20) NOT NULL DEFAULT 'litre',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle_models (
    id SERIAL PRIMARY KEY,
    make_id INT NOT NULL REFERENCES vehicle_makes(id) ON UPDATE CASCADE,
    vehicle_type_id INT NOT NULL REFERENCES vehicle_types(id) ON UPDATE CASCADE,
    name VARCHAR(80) NOT NULL,
    seating_config VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_vehicle_models_make_name UNIQUE (make_id, name)
);

CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(80) NOT NULL,
    state VARCHAR(60) NOT NULL,
    pincode VARCHAR(10),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    is_active SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_locations_name_city UNIQUE (name, city)
);

CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(150),
    address TEXT,
    vendor_type VARCHAR(30) NOT NULL DEFAULT 'OTHER' CHECK (vendor_type IN ('MAINTENANCE', 'FUEL', 'INSURANCE', 'REGISTRATION', 'TOLLS', 'OTHER')),
    is_active SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fuel_stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(80) NOT NULL,
    state VARCHAR(60) NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    is_active SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CORE USERS & AUTHENTICATION
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    role_id INT NOT NULL REFERENCES roles(id) ON UPDATE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. FLEET VEHICLES & DRIVERS (Strict Constraints & Validation)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    registration_number VARCHAR(20) NOT NULL UNIQUE,
    model_id INT NOT NULL REFERENCES vehicle_models(id) ON UPDATE CASCADE,
    fuel_type_id INT NOT NULL REFERENCES fuel_types(id) ON UPDATE CASCADE,
    year SMALLINT NOT NULL,
    capacity SMALLINT NOT NULL DEFAULT 1 CHECK (capacity >= 1),
    color VARCHAR(30),
    chassis_number VARCHAR(50) UNIQUE,
    engine_number VARCHAR(50),
    insurance_expiry DATE,
    license_expiry DATE,
    purchase_date DATE,
    purchase_price NUMERIC(12, 2) CHECK (purchase_price IS NULL OR purchase_price >= 0),
    current_odometer INT NOT NULL DEFAULT 0 CHECK (current_odometer >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'IN_MAINTENANCE', 'RETIRED')),
    notes TEXT,
    created_by INT NOT NULL REFERENCES users(id) ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    employee_id VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    license_number VARCHAR(30) NOT NULL UNIQUE,
    license_expiry DATE NOT NULL,
    license_class VARCHAR(30) NOT NULL,
    date_of_birth DATE,
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    joining_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ON_TRIP', 'ON_LEAVE', 'INACTIVE', 'SUSPENDED')),
    profile_image VARCHAR(255),
    notes TEXT,
    created_by INT NOT NULL REFERENCES users(id) ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_drivers_license_valid CHECK (license_expiry >= joining_date)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. TRIPS & SCHEDULES (Edge Case Constraints)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    trip_number VARCHAR(30) NOT NULL UNIQUE,
    vehicle_id INT NOT NULL REFERENCES vehicles(id) ON UPDATE CASCADE,
    driver_id INT NOT NULL REFERENCES drivers(id) ON UPDATE CASCADE,
    source_location VARCHAR(100) NOT NULL,
    destination_location VARCHAR(100) NOT NULL,
    scheduled_departure TIMESTAMPTZ NOT NULL,
    scheduled_arrival TIMESTAMPTZ NOT NULL,
    actual_departure TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED')),
    distance_km NUMERIC(8, 2) CHECK (distance_km IS NULL OR distance_km > 0),
    passenger_count SMALLINT DEFAULT 0 CHECK (passenger_count IS NULL OR passenger_count >= 0),
    cargo_weight_kg NUMERIC(8, 2) CHECK (cargo_weight_kg IS NULL OR cargo_weight_kg >= 0),
    purpose VARCHAR(255),
    cancellation_reason TEXT,
    notes TEXT,
    created_by INT NOT NULL REFERENCES users(id) ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_trips_arrival_after_departure CHECK (scheduled_arrival > scheduled_departure),
    CONSTRAINT chk_trips_actual_arrival_valid CHECK (actual_arrival IS NULL OR actual_departure IS NULL OR actual_arrival >= actual_departure)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. FLEET OPERATIONS: MAINTENANCE, FUEL, EXPENSES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS maintenance_logs (
    id SERIAL PRIMARY KEY,
    vehicle_id INT NOT NULL REFERENCES vehicles(id) ON UPDATE CASCADE,
    vendor_id INT REFERENCES vendors(id) ON DELETE SET NULL ON UPDATE CASCADE,
    maintenance_type VARCHAR(20) NOT NULL CHECK (maintenance_type IN ('ROUTINE', 'REPAIR', 'INSPECTION', 'EMERGENCY', 'RECALL')),
    description TEXT NOT NULL,
    cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (cost >= 0),
    odometer_reading INT CHECK (odometer_reading IS NULL OR odometer_reading >= 0),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    next_maintenance_date DATE,
    next_maintenance_odometer INT,
    parts_replaced TEXT,
    notes TEXT,
    created_by INT NOT NULL REFERENCES users(id) ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_maintenance_end_after_start CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS fuel_logs (
    id SERIAL PRIMARY KEY,
    vehicle_id INT NOT NULL REFERENCES vehicles(id) ON UPDATE CASCADE,
    driver_id INT REFERENCES drivers(id) ON DELETE SET NULL ON UPDATE CASCADE,
    trip_id INT REFERENCES trips(id) ON DELETE SET NULL ON UPDATE CASCADE,
    fuel_type_id INT NOT NULL REFERENCES fuel_types(id) ON UPDATE CASCADE,
    fuel_station_id INT REFERENCES fuel_stations(id) ON DELETE SET NULL ON UPDATE CASCADE,
    quantity NUMERIC(8, 2) NOT NULL CHECK (quantity > 0),
    price_per_unit NUMERIC(8, 2) NOT NULL CHECK (price_per_unit > 0),
    total_cost NUMERIC(10, 2) NOT NULL CHECK (total_cost > 0),
    odometer_reading INT CHECK (odometer_reading IS NULL OR odometer_reading >= 0),
    fueling_date TIMESTAMPTZ NOT NULL,
    receipt_number VARCHAR(50),
    is_full_tank SMALLINT NOT NULL DEFAULT 1,
    notes TEXT,
    created_by INT NOT NULL REFERENCES users(id) ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    expense_number VARCHAR(30) NOT NULL UNIQUE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('FUEL', 'MAINTENANCE', 'TOLL', 'INSURANCE', 'REGISTRATION', 'SALARY', 'PENALTY', 'OTHER')),
    vehicle_id INT REFERENCES vehicles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    driver_id INT REFERENCES drivers(id) ON DELETE SET NULL ON UPDATE CASCADE,
    trip_id INT REFERENCES trips(id) ON DELETE SET NULL ON UPDATE CASCADE,
    vendor_id INT REFERENCES vendors(id) ON DELETE SET NULL ON UPDATE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    description TEXT NOT NULL,
    receipt_number VARCHAR(50),
    expense_date DATE NOT NULL,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'CHEQUE')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'REJECTED', 'REIMBURSED')),
    approved_by INT REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_by INT NOT NULL REFERENCES users(id) ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. SECURITY & TRANSACTION LEDGERS (Notifications, OTPs)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registration_otp (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    registration_data TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_otp (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. PERFORMANCE & HIGH-READ QUERY OPTIMIZATION INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Master & Dimension Tables (Almost NIL Writes, Heavily Read on every Join)
CREATE INDEX IF NOT EXISTS idx_vehicle_models_make_id ON vehicle_models(make_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_models_type_id ON vehicle_models(vehicle_type_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_model_id ON vehicles(model_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_fuel_type_id ON vehicles(fuel_type_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_by ON vehicles(created_by);
CREATE INDEX IF NOT EXISTS idx_vehicles_reg_no ON vehicles(registration_number);

-- 2. User & Auth Lookups (High Read on Every Request Auth Middleware)
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active_email ON users(email, is_active);

-- 3. Driver Lookups & Compliance Filters
CREATE INDEX IF NOT EXISTS idx_drivers_status_expiry ON drivers(status, license_expiry);
CREATE INDEX IF NOT EXISTS idx_drivers_license_no ON drivers(license_number);
CREATE INDEX IF NOT EXISTS idx_drivers_employee_id ON drivers(employee_id);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);

-- 4. Trips Query & Schedule Optimization
CREATE INDEX IF NOT EXISTS idx_trips_driver_status ON trips(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_status ON trips(vehicle_id, status);
CREATE INDEX IF NOT EXISTS idx_trips_trip_number ON trips(trip_number);
CREATE INDEX IF NOT EXISTS idx_trips_schedule ON trips(scheduled_departure, scheduled_arrival);
CREATE INDEX IF NOT EXISTS idx_trips_created_by ON trips(created_by);

-- 5. Operational Logs: Fuel, Maintenance, Expenses
CREATE INDEX IF NOT EXISTS idx_fuel_vehicle_date ON fuel_logs(vehicle_id, fueling_date);
CREATE INDEX IF NOT EXISTS idx_fuel_trip_id ON fuel_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_fuel_fuel_type_id ON fuel_logs(fuel_type_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_date ON maintenance_logs(vehicle_id, start_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_logs(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_service_center ON maintenance_logs(service_center);

CREATE INDEX IF NOT EXISTS idx_expenses_category_date ON expenses(category, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_id ON expenses(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_status ON expenses(payment_status);
CREATE INDEX IF NOT EXISTS idx_expenses_approved_by ON expenses(approved_by);

-- 6. Notifications & Security
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_reg_otp_email ON registration_otp(email);
CREATE INDEX IF NOT EXISTS idx_pwd_otp_email ON password_reset_otp(email);

-- 7. High-Performance Partial Indexes (PostgreSQL Specific: 0 Write Overhead for Other Rows)
-- Pure index-only speed for subqueries checking if a vehicle is currently on a trip
CREATE INDEX IF NOT EXISTS idx_trips_in_progress ON trips(vehicle_id, driver_id) WHERE status = 'IN_PROGRESS';
-- Lightning-fast lookups for active inventory in select dropdowns
CREATE INDEX IF NOT EXISTS idx_vehicles_active ON vehicles(id, registration_number) WHERE status = 'ACTIVE';
-- Fast lookups for available drivers ready for dispatch
CREATE INDEX IF NOT EXISTS idx_drivers_available ON drivers(id, full_name, phone) WHERE status = 'AVAILABLE';
-- Managers reviewing pending expenses
CREATE INDEX IF NOT EXISTS idx_expenses_pending ON expenses(id, amount, expense_date) WHERE payment_status = 'PENDING';
-- Open maintenance logs requiring attention
CREATE INDEX IF NOT EXISTS idx_maintenance_open ON maintenance_logs(vehicle_id, status) WHERE status IN ('SCHEDULED', 'IN_PROGRESS');

