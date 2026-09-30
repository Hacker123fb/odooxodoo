# 🚚 TransitOps - Smart Transport Operations Platform

[![Live Web App](https://img.shields.io/badge/Production%20Web%20App-Vercel-black?style=for-the-badge&logo=vercel)](https://transitops-lemon-seven.vercel.app)
[![React](https://img.shields.io/badge/React%2018-Vite%20SPA-61DAFB?style=for-the-badge&logo=react)](https://transitops-lemon-seven.vercel.app)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-3NF%20Engine-336791?style=for-the-badge&logo=postgresql)](https://transitops-lemon-seven.vercel.app)
[![RBAC Security](https://img.shields.io/badge/Security-Zero--Trust%20RBAC-success?style=for-the-badge)](https://transitops-lemon-seven.vercel.app)

---

## 🌐 Live Access Links

| Portal | URL | Description |
| :--- | :--- | :--- |
| **🚀 Live Application** | **[https://transitops-lemon-seven.vercel.app](https://transitops-lemon-seven.vercel.app)** | Production operations portal and public landing page |
| **🏢 Staff Login** | **[https://transitops-lemon-seven.vercel.app/login](https://transitops-lemon-seven.vercel.app/login)** | Secure staff authentication with show/hide password toggle |
| **🌟 Platform Showcase** | **[https://transitops-lemon-seven.vercel.app/landing](https://transitops-lemon-seven.vercel.app/landing)** | Overview of platform capabilities, features, and workflows |

---

## 📖 Overview

**TransitOps** is an enterprise-grade Transport & Logistics Operations Management System designed for high reliability, data integrity, and operational clarity.

Built on a normalized **PostgreSQL 3NF** schema with authoritative **Role-Based Access Control (RBAC)** across all endpoints and client-side modules, TransitOps provides end-to-end visibility and control over fleet vehicles, drivers, trips, maintenance, fuel consumption, and operational expenses.

---

## ⚡ Core Features

### 🚛 1. Fleet & Vehicle Lifecycle
* **Complete Inventory Roster**: Tracks registration plate, manufacturer make, model, category, manufacturing year, load capacity, and purchase cost.
* **Automatic Duty Statuses**: Real-time asset statuses (`Available`, `On Trip`, `In Shop`, `Retired`) updated dynamically based on operational state.
* **Odometer Integrity Protection**: Validates continuous mileage progression; prevents backward odometer entries on updates.
* **Operational Locks**: Active vehicles on dispatched trips cannot be retired or scheduled for workshop maintenance.

### 👨‍✈️ 2. Driver Roster & Regulatory Safety
* **Driver Profiles**: Stores employee ID, contact information, license number, license class, and safety rating scores.
* **Proactive Expiry Warnings**: Automatic notifications and visual indicators for licenses approaching expiration within 30 days.
* **In-Transit Compliance Engine**: Enforces that assigned drivers possess valid, non-expired credentials throughout the scheduled journey window.
* **Assignment State Management**: Prevents double-booking drivers across concurrent or overlapping trip schedules.

### 🛣️ 3. Intelligent Trip Scheduling & Dispatch
* **End-to-End Lifecycle**: Manages full dispatch lifecycle: `SCHEDULED` ➔ `IN_PROGRESS` ➔ `COMPLETED` / `CANCELLED`.
* **Conflict Avoidance Engine**: Rejects overlapping bookings for both vehicles and drivers during scheduled time windows.
* **Strict Datetime Sequencing**: Validates that destination arrival date & time cannot precede departure date & time from source.
* **Route Validation**: Distance ($> 0$), estimated fuel usage, cargo descriptions, and location checks.
* **Preserved Selections**: Robust data synchronization ensures assigned assets and drivers remain selected upon editing records.

### 🔧 4. Maintenance & Workshop Orders
* **Work Order Management**: Tracks preventive services, inspections, oil changes, engine repairs, and unscheduled maintenance.
* **Positive Cost Verification**: Strict validation ensuring maintenance expenditures are non-zero positive amounts.
* **Automated Status Handoff**: Places vehicles into `In Shop` (`IN_MAINTENANCE`) upon work scheduling, returning them to `Available` upon completion.
* **Service Details**: Records service centers, assigned technicians, completion milestones, and repair notes.

### ⛽ 5. Fuel Intelligence & Consumption Logging
* **Fuel Transaction Entries**: Captures fuel quantity (L), cost per liter, station name, invoice number, and payment method.
* **Automatic Cost Calculation**: Auto-computes transaction totals dynamically upon quantity and price input.
* **Mileage Verification**: Verifies pump odometer against current recorded vehicle odometer to safeguard mileage tracking.
* **Trip Attribution**: Direct attribution of fuel receipts to specific trips and vehicles.

### 💰 6. Financial Expense Audits
* **Comprehensive Categories**: Covers Fuel, Maintenance, Toll, Parking, Driver Allowance, Office, and Miscellaneous costs.
* **Multi-Tier Approval Workflow**: Staff members file claims; Financial Analysts and Super Admins review, approve, or reject.
* **Audit Trail**: Preserves timestamps, vendor identities, invoice references, and financial review notes.

### 📊 7. Executive Telemetry & Reporting
* **Interactive KPI Dashboard**: Real-time fleet utilization rates, active trip counters, maintenance alert feeds, and financial summaries.
* **Parameterized Operational Reports**:
  1. Fleet Asset Utilization
  2. Fuel Efficiency Analysis
  3. Maintenance Expenditure Breakdown
  4. Driver Safety Distribution
  5. Expense Category Ledgers
  6. Route Performance Statistics

### 🛡️ 8. Zero-Trust Access Control & Security
* **Role-Based Route Barriers**: Client-side role routing (`RoleRoute`) and server-side middleware (`restrictTo`) across all routes.
* **Tamper-Resistant Navigation**: URL manipulation triggers dedicated `/401 Unauthorized` or `/403 Forbidden` response pages.
* **Idempotency Protection**: Dual-layer mutation guards block duplicate database writes on rapid button clicks or network retries.
* **Account Deletion Safety**: Full-page danger zone with credential verification, explicit consequences review, and confirmation safeguards.

---

## 🔐 Role-Based Access Control (RBAC) Matrix

| Module / Route | Authorized Roles | Access Scope |
| :--- | :--- | :--- |
| **`/dashboard`** | All authenticated staff | Overview KPIs & Activity Feed |
| **`/vehicles`** | `SUPER_ADMIN`, `FLEET_MANAGER` | Vehicle Fleet Inventory & Management |
| **`/drivers`** | `SUPER_ADMIN`, `FLEET_MANAGER`, `SAFETY_OFFICER` | Driver Roster, Compliance, Safety Scores |
| **`/trips`** | `SUPER_ADMIN`, `FLEET_MANAGER`, `DISPATCHER` | Trip Scheduling, Dispatch & Route Tracking |
| **`/maintenance`**| `SUPER_ADMIN`, `FLEET_MANAGER` | Maintenance Logs & Workshop Work Orders |
| **`/fuel`** | `SUPER_ADMIN`, `FLEET_MANAGER`, `FINANCIAL_ANALYST` | Fuel Logs & Consumption Analytics |
| **`/expenses`** | `SUPER_ADMIN`, `FINANCIAL_ANALYST`, `FLEET_MANAGER` | Expense Claims & Financial Approvals |
| **`/reports`** | `SUPER_ADMIN`, `FINANCIAL_ANALYST` | Operational Telemetry & Audit Reports |
| **`/delete-account`** | All authenticated users | Full-Page Account Management & Danger Zone |

---

## 🗄️ Database Architecture & Performance Indexing

TransitOps runs on a normalized **PostgreSQL 3NF** schema with dedicated indexing for high-frequency reads:

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
-- Master & Lookup Indexes
CREATE INDEX idx_vehicle_models_make_id ON vehicle_models(make_id);
CREATE INDEX idx_vehicle_models_type_id ON vehicle_models(vehicle_type_id);
CREATE INDEX idx_vehicles_model_id ON vehicles(model_id);
CREATE INDEX idx_vehicles_fuel_type_id ON vehicles(fuel_type_id);
CREATE INDEX idx_vehicles_reg_no ON vehicles(registration_number);

-- Composite Schedule & Query Indexes
CREATE INDEX idx_trips_driver_status ON trips(driver_id, status);
CREATE INDEX idx_trips_vehicle_status ON trips(vehicle_id, status);
CREATE INDEX idx_trips_schedule ON trips(scheduled_departure, scheduled_arrival);
CREATE INDEX idx_fuel_vehicle_date ON fuel_logs(vehicle_id, fueling_date);
CREATE INDEX idx_maintenance_vehicle_date ON maintenance_logs(vehicle_id, start_date);
CREATE INDEX idx_expenses_category_date ON expenses(category, expense_date);

-- Partial Indexes for Operational Queries
CREATE INDEX idx_trips_in_progress ON trips(vehicle_id, driver_id) WHERE status = 'IN_PROGRESS';
CREATE INDEX idx_vehicles_active ON vehicles(id, registration_number) WHERE status = 'ACTIVE';
CREATE INDEX idx_drivers_available ON drivers(id, full_name, phone) WHERE status = 'AVAILABLE';
CREATE INDEX idx_expenses_pending ON expenses(id, amount, expense_date) WHERE payment_status = 'PENDING';
CREATE INDEX idx_maintenance_open ON maintenance_logs(vehicle_id, status) WHERE status IN ('SCHEDULED', 'IN_PROGRESS');
```

---

## 💻 Tech Stack

### Frontend
* **React 18** (Component-driven architecture)
* **Vite 6** (Modern build tooling & dynamic code splitting)
* **React Router 6** (Declarative role-based routing)
* **React Hook Form** (Form validation & error feedback)
* **Tailwind CSS** (Adaptive dark and light theme engine)
* **Axios** (Centralized API client with idempotency headers)
* **Recharts** (Interactive telemetry and operational charts)
* **React Icons** (Feather icon suite)

### Backend
* **Node.js 22 LTS** & **Express.js 4**
* **PostgreSQL** via `pg` connection pool
* **JWT (JSON Web Tokens)** & **Bcrypt** for secure authentication
* **Express Rate Limit** & **Double-Submit CSRF Protection**

---

## 🚀 Local Development Setup

### Prerequisites
* **Node.js** >= 18.0.0
* **PostgreSQL** >= 14
* **npm** >= 9.0.0

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
Run database migrations and start the backend:
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
