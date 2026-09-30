# 🚚 TransitOps - Smart Transport Operations Platform (Enterprise v2.4)

[![Live Web App](https://img.shields.io/badge/Production%20Web%20App-Vercel-black?style=for-the-badge&logo=vercel)](https://transitops-lemon-seven.vercel.app)
[![Backend API](https://img.shields.io/badge/Production%20API-Render-46E3B7?style=for-the-badge&logo=render)](https://transitops-backend-nkkb.onrender.com/api/v1/health)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-3NF%20Engine-336791?style=for-the-badge&logo=postgresql)](https://transitops-lemon-seven.vercel.app)
[![Security](https://img.shields.io/badge/Security-Zero--Trust%20RBAC-success?style=for-the-badge)](https://transitops-lemon-seven.vercel.app)
[![Idempotency](https://img.shields.io/badge/Mutations-Idempotency%20Guaranteed-blue?style=for-the-badge)](https://transitops-lemon-seven.vercel.app)

---

## 🌐 Direct Deployment Links

| Resource | URL | Description |
| :--- | :--- | :--- |
| **🚀 Live Application Portal** | **[https://transitops-lemon-seven.vercel.app](https://transitops-lemon-seven.vercel.app)** | Production frontend with high-converting Landing Page & Operations Portal |
| **🏢 Staff Login Portal** | **[https://transitops-lemon-seven.vercel.app/login](https://transitops-lemon-seven.vercel.app/login)** | Executive staff login with password visibility toggle & brute-force shield |
| **🌟 Platform Showcase** | **[https://transitops-lemon-seven.vercel.app/landing](https://transitops-lemon-seven.vercel.app/landing)** | Interactive architecture, achievements, and technology showcase |
| **⚡ Backend Health Endpoint** | **[https://transitops-backend-nkkb.onrender.com/api/v1/health](https://transitops-backend-nkkb.onrender.com/api/v1/health)** | Self-healing Node/Express backend with live database latency checks |

---

## 📖 Executive Summary

**TransitOps** is an enterprise-grade Transport & Logistics Management System built from the ground up for high reliability, zero-trust security, and sub-millisecond query performance. 

Engineered with a **PostgreSQL 3NF** relational architecture, authoritative server-side **Role-Based Access Control (RBAC)** across 100% of endpoints, **dual-layer mutation idempotency**, and **Vite-powered code-split chunks**, TransitOps eliminates operational bottlenecks while providing an uncompromising security fortress against unauthorized access and URL tampering.

---

## 🏆 Major Engineering Achievements

### 1. 🛡️ Zero-Trust Server-Side RBAC & Route Clearance
- **Authoritative Server Clearance**: Every single endpoint enforces strict role validation (`restrictTo`). Bypassing the frontend UI is impossible; direct API hits from unauthorized roles receive an immediate `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`).
- **URL Parameter Tampering Protection**: If an unauthorized user attempts to manipulate URL parameters (e.g. changing `/vehicles/3` to `/vehicles/1` or `/expenses/edit/999`), client-side pre-guards halt execution and redirect to dedicated `/401 Unauthorized` or `/403 Forbidden` barriers.
- **Strict Numeric ID Validation**: Controllers reject non-numeric and out-of-range IDs with `400 Bad Request` and missing entities with `404 Not Found`.

### 2. 🔁 Dual-Layer Mutation Idempotency Protection
- **No Duplicate Inserts on Double-Clicks**: Mutating operations (`POST`, `PUT`, `DELETE`) pass through an in-flight mutex lock. If a user clicks a button twice rapidly or experiences network lag, identical concurrent requests receive `409 Conflict`.
- **Cached Replay Stream**: Successfully processed mutations cache their output against a client-generated UUIDv4 `Idempotency-Key` or request signature, returning `X-Idempotent-Replay: true` without re-writing to the database.

### 3. ⚡ PostgreSQL 3NF & High-Read Partial Indexing
- **Database Indexing for High-Read / Low-Write Operations**: 
  - Master and lookup tables (`vehicle_models`, `vehicle_makes`, `fuel_types`, `roles`) feature dedicated B-tree foreign key indexes, slashing multi-table `JOIN` overhead.
  - **PostgreSQL Partial Indexes** (e.g. `CREATE INDEX idx_vehicles_active ON vehicles(id, registration_number) WHERE status = 'ACTIVE'`) enable pure index-only scans for high-frequency queries while introducing zero write overhead on non-matching rows.
  - Sub-queries checking active trip collisions (`EXISTS (SELECT 1 FROM trips WHERE vehicle_id = v.id AND status = 'IN_PROGRESS')`) execute in $< 1\text{ms}$.

### 4. 🚀 Ultra-Fast Modular UI (< 3s Vite Production Build)
- **On-Demand Dynamic Code Splitting**: All pages and heavyweight modules (Recharts, Forms, Details) are split into standalone chunks via `React.lazy()` and `Suspense`, achieving instantaneous initial page loads.
- **Smart Client-Side Caching**: Cached GET requests eliminate redundant network calls when navigating between views, instantly invalidating when mutating actions take place.
- **Password Visibility Toggles**: Interactive show/hide password buttons (`FiEye` / `FiEyeOff`) integrated into both Login and Registration forms.

### 5. 🧱 Defensive Security Fortress
- **Anti-Brute-Force & Account Lockout**: Exponential IP cooldowns (`/blocked`) protect staff accounts from credential stuffing.
- **CSRF Token Verification**: Double-submit cookie verification (`x-csrf-token`) prevents cross-site request forgery.
- **HMAC Backend Signature Verification**: High-risk operations (account deletion, security resets) require server-verified cryptographic signatures.

---

## 🛠️ Complete Feature Modules

### 🚛 1. Vehicle Lifecycle Management
- Complete vehicle inventory tracking (Registration Plate, Make, Model, Type, Year, Seating/Cargo Capacity, Purchase Cost).
- Real-time automated status mapping: `Available`, `On Trip`, `In Shop`, `Retired`.
- Active trip dependency locks: vehicles cannot be deleted or assigned to maintenance while on an active journey.
- Live odometer progression updated automatically upon trip completion.

### 👨‍✈️ 2. Driver Administration & Compliance
- Full operator profile roster (Employee ID, License Class, Contact, Expiry Dates).
- Automatic license expiry warning banners (highlighting licenses expiring within 30 days).
- Real-time safety score tracking (0–100 scale).
- Assignment availability state (prevents double-booking drivers on overlapping trips).

### 🛣️ 3. Smart Trip Scheduling & Dispatch
- End-to-end trip state machine: `SCHEDULED` ➔ `IN_PROGRESS` ➔ `COMPLETED` or `CANCELLED`.
- Automated dispatch validation: checks driver validity and vehicle readiness prior to departure.
- Distance (km) and estimated fuel consumption metrics.
- Conflict avoidance engine preventing scheduling of unavailable assets.

### 🔧 4. Maintenance & Workshop Tracking
- Comprehensive service logs (Preventive Maintenance, Corrective Repairs, Inspections).
- Service center recording, technician assignments, and cost audits.
- Automatically transitions vehicle status to `In Shop` while service is open, releasing it upon completion.

### ⛽ 5. Fuel Consumption Intelligence
- Detailed refill logs linked directly to vehicles and optional trips.
- Cost-per-liter tracking and total transaction cost auto-calculation.
- Odometer verification preventing backward mileage entry.
- Fuel type categorization matching engine specifications.

### 💰 6. Financial Expense Audits
- Operational expense filing across 5 categories: `FUEL`, `MAINTENANCE`, `TOLL`, `PARKING`, `MISCELLANEOUS`.
- Multi-tier role permissions: Staff create, Financial Analysts and Super Admins approve/reject/reimburse.
- Audit notes and approval timestamp tracking.

### 📊 7. Executive Analytics & Reports
- Live executive KPI dashboard with operational telemetry and activity audit trail.
- 6 parameterized report configurations:
  1. Fleet Utilization Ratios
  2. Fuel Efficiency & Consumption by Vehicle
  3. Maintenance Cost Breakdown
  4. Driver Performance & Safety Distribution
  5. Expense Category Ledgers
  6. Trip Route Execution Statistics

---

## 🔐 Role-Based Access Control (RBAC) Matrix

| Portal Route | Authorized Roles | Access Scope |
| :--- | :--- | :--- |
| **`/dashboard`** | All authenticated staff | Overview KPIs & Activity Feed |
| **`/vehicles`** | `SUPER_ADMIN`, `FLEET_MANAGER` | Full Fleet Inventory & CRUD |
| **`/drivers`** | `SUPER_ADMIN`, `FLEET_MANAGER`, `SAFETY_OFFICER` | Driver Roster, Compliance, Safety |
| **`/trips`** | `SUPER_ADMIN`, `FLEET_MANAGER`, `DISPATCHER` | Trip Scheduling, Dispatch, Status Tracking |
| **`/maintenance`**| `SUPER_ADMIN`, `FLEET_MANAGER` | Repair Logs, Workshop Service Management |
| **`/fuel`** | `SUPER_ADMIN`, `FLEET_MANAGER`, `FINANCIAL_ANALYST` | Refill Logs, Fuel Cost Tracking |
| **`/expenses`** | `SUPER_ADMIN`, `FINANCIAL_ANALYST`, `FLEET_MANAGER` | Approvals & Expense Ledgers |
| **`/reports`** | `SUPER_ADMIN`, `FINANCIAL_ANALYST` | Analytics & Financial Exports |

---

## 🗄️ Database Architecture & Performance Indexing

TransitOps runs on a normalized **PostgreSQL 3NF** schema comprising 12 primary tables.

```
       [users] ───────────── [roles]
          │
          ├── [drivers]
          │      │
          ├── [trips] ─────── [vehicles] ───── [vehicle_models] ── [vehicle_makes]
          │      │                │                     │
          │      ├── [fuel_logs] ─┴─ [fuel_types]       └── [vehicle_types]
          │      │
          │      └── [expenses]
          │
          └── [maintenance_logs]
```

### High-Read Performance Indexes Applied

```sql
-- 1. Master & Dimension Lookups (Almost Nil Writes, High Reads)
CREATE INDEX idx_vehicle_models_make_id ON vehicle_models(make_id);
CREATE INDEX idx_vehicle_models_type_id ON vehicle_models(vehicle_type_id);
CREATE INDEX idx_vehicles_model_id ON vehicles(model_id);
CREATE INDEX idx_vehicles_fuel_type_id ON vehicles(fuel_type_id);
CREATE INDEX idx_vehicles_reg_no ON vehicles(registration_number);

-- 2. Authentication & User Lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active_email ON users(email, is_active);

-- 3. Composite Schedule & Operational Indexes
CREATE INDEX idx_trips_driver_status ON trips(driver_id, status);
CREATE INDEX idx_trips_vehicle_status ON trips(vehicle_id, status);
CREATE INDEX idx_trips_schedule ON trips(scheduled_departure, scheduled_arrival);
CREATE INDEX idx_fuel_vehicle_date ON fuel_logs(vehicle_id, fueling_date);
CREATE INDEX idx_maintenance_vehicle_date ON maintenance_logs(vehicle_id, start_date);
CREATE INDEX idx_expenses_category_date ON expenses(category, expense_date);

-- 4. PostgreSQL Partial Indexes (0 Write Overhead on Other Rows)
CREATE INDEX idx_trips_in_progress ON trips(vehicle_id, driver_id) WHERE status = 'IN_PROGRESS';
CREATE INDEX idx_vehicles_active ON vehicles(id, registration_number) WHERE status = 'ACTIVE';
CREATE INDEX idx_drivers_available ON drivers(id, full_name, phone) WHERE status = 'AVAILABLE';
CREATE INDEX idx_expenses_pending ON expenses(id, amount, expense_date) WHERE payment_status = 'PENDING';
CREATE INDEX idx_maintenance_open ON maintenance_logs(vehicle_id, status) WHERE status IN ('SCHEDULED', 'IN_PROGRESS');
```

---

## 💻 Tech Stack

### Frontend
- **React 18** + **Vite 6**
- **React Router 6** (Dynamic lazy route boundaries)
- **React Hook Form** (Schema validation & field autofocus)
- **Tailwind CSS** (Adaptive dark/light theme engine)
- **Axios** (Centralized interceptors, idempotency headers, auto-routing 401/403)
- **Recharts** (Interactive telemetry charts)
- **React Icons** (Feather icon set)

### Backend
- **Node.js 22 LTS** + **Express.js 4**
- **PostgreSQL** via `pg` connection pool + **Prisma ORM**
- **JWT (JSON Web Tokens)** + **Bcrypt** (Secure hashing)
- **Express Rate Limit** (Anti-brute-force defense)
- **Self-Healing Keep-Alive Worker** (Permanently keeps Render instance warm)

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js** >= 18.0.0
- **PostgreSQL** >= 14
- **npm** >= 9.0.0

### 1. Clone the Repository
```bash
git clone https://github.com/Hacker123fb/odooxodoo.git
cd odooxodoo
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
```
Configure your `.env` parameters:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/transitops_db
JWT_ACCESS_SECRET=your_jwt_access_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
CLIENT_URL=http://localhost:5173
```
Run database setup and start the server:
```bash
npm run db:setup
npm run dev
```

### 3. Frontend Setup
```bash
cd ../client
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 📜 License

TransitOps is licensed under the **MIT License**.
Developed with ❤️ for mission-critical logistics operations.
