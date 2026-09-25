-- =============================================================================
-- TransitOps – Initial Seed Data for PostgreSQL
-- FILE : database/postgres_seed.sql
-- =============================================================================

-- 1. Insert Default Roles
INSERT INTO roles (name, description) VALUES 
('SUPER_ADMIN', 'Full system access — manages roles, users, and configurations'),
('FLEET_MANAGER', 'Fleet administrator — manages vehicles and drivers'),
('DISPATCHER', 'Operations dispatcher — schedules and assigns trips'),
('SAFETY_OFFICER', 'Compliance auditor — monitors logs and safety scores'),
('FINANCIAL_ANALYST', 'Financial tracker — reviews expenses and fuel efficiency')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- 2. Insert Fuel Types
INSERT INTO fuel_types (code, label, unit_label) VALUES
('DIESEL', 'Diesel', 'litre'),
('PETROL', 'Petrol / Gasoline', 'litre'),
('CNG', 'Compressed Natural Gas', 'kg'),
('ELECTRIC', 'Electricity (EV)', 'kWh'),
('HYBRID', 'Hybrid', 'litre')
ON CONFLICT (code) DO NOTHING;

-- 3. Insert Vehicle Types
INSERT INTO vehicle_types (name, description) VALUES
('TRUCK', 'Heavy cargo transport truck'),
('BUS', 'Passenger transport bus'),
('VAN', 'Delivery cargo or passenger van'),
('SEDAN', 'Corporate passenger sedan'),
('SUV', 'Executive transport SUV')
ON CONFLICT (name) DO NOTHING;

-- 4. Insert Vehicle Makes
INSERT INTO vehicle_makes (name, country_of_origin) VALUES
('Tata Motors', 'India'),
('Ashok Leyland', 'India'),
('Mahindra', 'India'),
('BharatBenz', 'Germany/India'),
('Eicher Motors', 'India'),
('Volvo', 'Sweden'),
('Toyota', 'Japan')
ON CONFLICT (name) DO NOTHING;

-- 5. Insert Vehicle Models
INSERT INTO vehicle_models (make_id, vehicle_type_id, name, seating_config)
SELECT m.id, t.id, 'Prima 4028.S', '2 Seater Sleeper'
FROM vehicle_makes m, vehicle_types t
WHERE m.name = 'Tata Motors' AND t.name = 'TRUCK'
ON CONFLICT (make_id, name) DO NOTHING;

INSERT INTO vehicle_models (make_id, vehicle_type_id, name, seating_config)
SELECT m.id, t.id, 'Signa 2823.K', '2 Seater Day Cab'
FROM vehicle_makes m, vehicle_types t
WHERE m.name = 'Tata Motors' AND t.name = 'TRUCK'
ON CONFLICT (make_id, name) DO NOTHING;

INSERT INTO vehicle_models (make_id, vehicle_type_id, name, seating_config)
SELECT m.id, t.id, 'Oyster Bus', '32 Seater'
FROM vehicle_makes m, vehicle_types t
WHERE m.name = 'Ashok Leyland' AND t.name = 'BUS'
ON CONFLICT (make_id, name) DO NOTHING;

INSERT INTO vehicle_models (make_id, vehicle_type_id, name, seating_config)
SELECT m.id, t.id, 'Bolero Maxi Truck Plus', '2 Seater'
FROM vehicle_makes m, vehicle_types t
WHERE m.name = 'Mahindra' AND t.name = 'TRUCK'
ON CONFLICT (make_id, name) DO NOTHING;

INSERT INTO vehicle_models (make_id, vehicle_type_id, name, seating_config)
SELECT m.id, t.id, 'Innova Crysta', '7 Seater'
FROM vehicle_makes m, vehicle_types t
WHERE m.name = 'Toyota' AND t.name = 'SUV'
ON CONFLICT (make_id, name) DO NOTHING;

-- 6. Insert Default Super Admin User (password: password123)
-- Hash generated via bcrypt 10 rounds: $2a$10$wE0vGvP5M5Lp7jH3qFqNve0N4vS49vL0Yn4lO2y7gO9wA0p8O8k2K or standard bcryptjs
INSERT INTO users (role_id, full_name, email, password_hash, status)
SELECT id, 'Admin', 'admin@transitops.com', '$2a$10$wT0lU0oR3rYp6kYj7/tJCe7gWJ0gGzS5P5N5O4v8fJ5lO2w1uQ6KG', 'ACTIVE'
FROM roles WHERE name = 'SUPER_ADMIN'
ON CONFLICT (email) DO NOTHING;

-- 7. Insert Locations
INSERT INTO locations (name, address, city, state, pincode) VALUES
('Central Depot Bangalore', 'Electronics City Phase 1', 'Bangalore', 'Karnataka', '560100'),
('Mumbai Logistics Hub', 'JNPT Port Area, Navi Mumbai', 'Mumbai', 'Maharashtra', '400707'),
('Delhi Regional Depot', 'Okhla Industrial Area Phase 3', 'Delhi', 'Delhi', '110020'),
('Hyderabad Hub', 'HITEC City Madhapur', 'Hyderabad', 'Telangana', '500081'),
('Chennai Port Depot', 'Rajaji Salai, George Town', 'Chennai', 'Tamil Nadu', '600001')
ON CONFLICT (name, city) DO NOTHING;
