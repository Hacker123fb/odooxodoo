# 🚚 TransitOps - Enterprise Fleet & Transport Logistics Platform

[![Live Web App](https://img.shields.io/badge/Production%20Web%20App-Vercel-black?style=for-the-badge&logo=vercel)](https://transitops-lemon-seven.vercel.app)
[![React](https://img.shields.io/badge/React%2018-Vite%20SPA-61DAFB?style=for-the-badge&logo=react)](https://transitops-lemon-seven.vercel.app)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-3NF%20Engine-336791?style=for-the-badge&logo=postgresql)](https://transitops-lemon-seven.vercel.app)
[![RBAC Security](https://img.shields.io/badge/Security-Zero--Trust%20RBAC-success?style=for-the-badge)](https://transitops-lemon-seven.vercel.app)
[![Currency](https://img.shields.io/badge/Currency-INR%20(%E2%82%B9)%20Localized-amber?style=for-the-badge)](https://transitops-lemon-seven.vercel.app)

---

## 🌐 Live Access Links

| Portal | URL | Description |
| :--- | :--- | :--- |
| **🚀 Live Application** | **[https://transitops-lemon-seven.vercel.app](https://transitops-lemon-seven.vercel.app)** | Production operations portal and public landing page |
| **🏢 Staff Login** | **[https://transitops-lemon-seven.vercel.app/login](https://transitops-lemon-seven.vercel.app/login)** | Secure staff authentication with automated lockout protection |
| **📝 Staff Registration** | **[https://transitops-lemon-seven.vercel.app/register](https://transitops-lemon-seven.vercel.app/register)** | Staff onboarding with OTP verification, masked password entry, and Terms & Privacy consent |
| **🌟 Platform Showcase** | **[https://transitops-lemon-seven.vercel.app/landing](https://transitops-lemon-seven.vercel.app/landing)** | Executive showcase with live telematics preview and dark/light theme switch |
| **📜 Terms & Conditions** | **[https://transitops-lemon-seven.vercel.app/terms](https://transitops-lemon-seven.vercel.app/terms)** | Comprehensive legal, dispatch compliance, and operating policies |
| **🔒 Privacy Policy** | **[https://transitops-lemon-seven.vercel.app/privacy](https://transitops-lemon-seven.vercel.app/privacy)** | Enterprise telemetry privacy, data retention, and security governance |

---

## 📖 Overview

**TransitOps** is an enterprise-grade commercial transport, dispatch, and fleet management system built for high reliability, uncompromising data integrity, and real-time operational clarity. 

Designed specifically for modern logistics operations, TransitOps provides end-to-end management over commercial vehicles (heavy trucks, medium haulers, and light delivery vans), driver certifications, conflict-free trip dispatches, fuel intelligence, preventive maintenance workflows, and expense audits—fully localized in **Indian Rupees (₹)** and structured on a 3NF **PostgreSQL** schema.

---

## ⚡ Core Features & Recent Enhancements

### 1. 🏎️ Ultra-Fast UI/UX & Dynamic Chunk Splitting
* **Synchronous Auth Initialization**: Eliminates full-page blocking spinners for guest visitors and returning users with active session caches, providing instant sub-second perceived load times.
* **Granular Rollup Chunks**: Automated vendor chunk isolation (`vendor-react`, `vendor-charts`, `vendor-icons`, `vendor-forms`, `vendor-axios`, `vendor-shared`).
* **Optimized Viewport Rendering**: Above-the-fold content renders instantly with an expanded `400px` root margin to prevent placeholder layout jumps.
* **4-Second Production Build**: Optimized Vite 6 pipeline delivering compressed 6–24 kB individual page chunks.

### 2. 🛡️ Strict Blocked IP Defense & Automated Security Cooldown
* **Landing Page IP Identification**: Asynchronously probes client IP lockout status on mount and immediately displays an active security notice banner.
* **Strict Route Guard (`BlockedIpGuard`)**: Completely blocks locked-out IPs from accessing `/login`, `/register`, `/verify-otp`, `/dashboard`, or any internal page. Blocked clients can only access the **Landing Page** and the dedicated **`/blocked`** cooldown view.
* **Real-Time Live Countdown Timer**: Dynamic live countdown ticks down the cooldown window (~15 mins to 24 hrs progressive tier escalation) before allowing retry attempts.
* **Progressive Cooldown Escalation**: Tier 1 (15m) ➔ Tier 2 (1h) ➔ Tier 3 (4h) ➔ Tier 4 (24h) brute-force defense against distributed attacks.

### 3. 🇮🇳 Indian Freight Context & Rupee (₹) Currency Localization
* **Complete Rupee (₹) Formatting**: All financial figures across vehicle acquisition values, fuel pump rates, workshop work orders, expense ledgers, and dashboard metrics use Indian numbering formatting (`en-IN`).
* **Commercial Indian Fleet Numbers**: Pre-seeded with 550+ authentic logistics records:
  - **25 Commercial Vehicles**: Heavy haulers, prime movers, and cargo vans (Tata Prima, Signa, Ashok Leyland Ecomet, BharatBenz, Mahindra Bolero Maxi, Eicher Pro; Diesel, CNG, Electric).
  - **18 Certified Drivers**: Authentic names, verified commercial license formats, and safety scores.
  - **202 Freight Journeys**: Active dispatches across key commercial freight corridors (Mumbai–Pune, Delhi–Jaipur, Bangalore–Chennai, Ahmedabad–Surat, Kolkata–Durgapur, Hyderabad–Vijayawada).
  - **131 Fuel Logs**: Realistic volumes, pump rates (₹89.50–94.80/L), progressive odometers, and verified fuel hubs.
  - **65 Maintenance Records**: Scheduled inspections, oil services, and repairs (₹3,200–45,000).
  - **110 Expense Records**: FASTag electronic toll receipts, state entry permits, driver allowances, and commercial insurance.

### 4. 🌓 Seamless Dark & Light Mode Theme Support
* **Universal Theme Switcher**: Available across both the authenticated dashboard interface and the public Landing page.
* **System Persistence**: Remembers theme preference across sessions with automatic OS contrast adaptation.

### 5. 🔐 Staff Onboarding Security & Legal Compliance
* **Masked Password Field**: Registration password field is strictly hidden to protect sensitive staff credentials.
* **Confirm Password Visibility Toggle**: Allows the user to inspect their typed confirm password to prevent typographical mismatch.
* **Mandatory Legal Agreement**: Mandatory checkbox requiring users to review and accept the Terms & Conditions and Privacy Policy with direct `"Learn more"` hyperlinks before submitting for verification OTP.

### 6. 🛣️ Automated Conflict Avoidance & Dispatch Engine
* **Conflict Prevention**: Rejects overlapping bookings for both vehicles and drivers during scheduled departure and arrival windows.
* **Strict Datetime Sequencing**: Validates that destination arrival date & time cannot precede departure date & time from source.
* **Odometer Integrity Protection**: Prevents backward odometer updates across trips, fuel logs, and maintenance events.

---

## 🔐 Role-Based Access Control (RBAC) Matrix

| Module / Route | Authorized Roles | Access Scope |
| :--- | :--- | :--- |
| **`/dashboard`** | All authenticated staff | Overview KPIs, Operational Charts & Activity Feed |
| **`/vehicles`** | `SUPER_ADMIN`, `FLEET_MANAGER` | Vehicle Fleet Inventory, Specifications & Acquisition Costs |
| **`/drivers`** | `SUPER_ADMIN`, `FLEET_MANAGER`, `SAFETY_OFFICER` | Driver Roster, Commercial Licenses, Safety Ratings |
| **`/trips`** | `SUPER_ADMIN`, `FLEET_MANAGER`, `DISPATCHER` | Trip Scheduling, Conflict-Free Dispatch & Route Tracking |
| **`/maintenance`**| `SUPER_ADMIN`, `FLEET_MANAGER` | Maintenance Work Orders, Technician Allocations, Repair Costs |
| **`/fuel`** | `SUPER_ADMIN`, `FLEET_MANAGER`, `FINANCIAL_ANALYST` | Fuel Logs, Station Invoices & Km/L Consumption Indexes |
| **`/expenses`** | `SUPER_ADMIN`, `FINANCIAL_ANALYST`, `FLEET_MANAGER` | Expense Claims, FASTag Tolls & Multi-Tier Approvals |
| **`/reports`** | `SUPER_ADMIN`, `FINANCIAL_ANALYST` | Operational Telemetry, Exportable CSVs & Cost Summaries |
| **`/blocked`** | Public (Security Cooldown) | Real-time IP Lockout Timer & Cooldown Information |
| **`/delete-account`** | All authenticated users | Full-Page Account Management & Danger Zone Safeguards |

---

## 🗄️ Database Architecture & Performance Indexing

TransitOps runs on a normalized **PostgreSQL 3NF** schema with dedicated composite indexing for high-frequency operational queries:

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
* **Vite 6** (Modern build tooling & granular Rollup chunk splitting)
* **React Router 6** (Declarative role-based routing & `<BlockedIpGuard>`)
* **React Hook Form** (Form validation, regex security, and error feedback)
* **Tailwind CSS** (Adaptive dark and light theme engine)
* **Axios** (Centralized API client with idempotency headers)
* **Chart.js & React-Chartjs-2** (Interactive telemetry and operational charts)
* **React Icons** (Feather and FontAwesome 6 icon suites)

### Backend
* **Node.js 22 LTS** & **Express.js 4**
* **PostgreSQL** via `pg` connection pool with parameter conversion
* **JWT (JSON Web Tokens)** & **Bcrypt** for secure authentication
* **Express Rate Limit** & **Double-Submit CSRF Protection**
* **Progressive IP & Account Lockout Defense Middleware**

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
CLIENT_URL=http://localhost:3000
```
Run database migrations and start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../client
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📜 License & Compliance

© 2026 TransitOps Logistics Systems. All rights reserved. Built for secure, scalable, and high-performance commercial freight operations.
