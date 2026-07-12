# 🚚 TransitOps - Smart Transport Operations Platform

> A modern Fleet & Transport Management System built with **React, Node.js, Express.js, and MySQL**.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Node](https://img.shields.io/badge/Node.js-22-green?logo=node.js)
![Express](https://img.shields.io/badge/Express.js-Backend-black?logo=express)
![MySQL](https://img.shields.io/badge/MySQL-Database-orange?logo=mysql)
![JWT](https://img.shields.io/badge/Auth-JWT-success)
![Nodemailer](https://img.shields.io/badge/Email-SMTP-blue)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 📖 Overview

TransitOps is a centralized transport operations platform that digitizes fleet management, driver administration, trip scheduling, maintenance tracking, and expense management.

The system enables logistics companies to efficiently manage vehicles, drivers, dispatch operations, fuel consumption, maintenance records, and analytics while enforcing business rules.

---

# ✨ Features

## 🔐 Authentication & Security (Upgraded)

- **Secure Glassmorphic Login**: Fully centered, responsive authentication layout.
- **Email OTP Verification**: Registration requires a secure 6-digit verification code.
  - OTP expires dynamically in **3 minutes**.
  - Rate limited to maximum **5 verification attempts** (with automatic locking).
  - Resend allowed only after a **60-second cooldown**.
  - Server-side bcrypt-hashed OTP storage.
- **SMTP Sandbox & Debug Fallback**: If no SMTP server is configured, the server creates an automatic sandbox account on `ethereal.email` (printing a preview link in the console) or writes the OTP instantly to `server/otp-debug.txt` if offline.
- **Role-Based Access Control (RBAC)**: Protects UI components and API endpoints based on user roles (`SUPER_ADMIN`, `FLEET_MANAGER`, `DISPATCHER`, `SAFETY_OFFICER`, `FINANCIAL_ANALYST`).

---

## 📊 Dashboard

- Fleet KPIs (Active/Available/Maintenance Vehicles)
- Active & Pending Trips count
- Drivers On Duty telemetry
- Real-time Fleet Utilization rate
- Interactive Charts & Analytics
- Live chronological activity timeline

---

## 🚛 Vehicle Management

- Add Vehicle / Edit Vehicle
- Delete Vehicle (locked if assigned to active trips)
- Vehicle Status registry
- Odometer & Capacity Tracking
- Acquisition cost tracking

---

## 👨‍✈️ Driver Management

- Driver Registration profile
- Contact details & License tracking
- Automated license expiry alerts (within 30 days)
- Safety Score mapping (0-100)
- Driver active status checks

---

## 🛣️ Trip Management

- Create/Dispatch Trip
- Driver & Vehicle availability checks
- Native clock time pickers
- Cargo capacity validations
- Active trip state-machine lifecycle (Draft -> Scheduled -> In Progress -> Completed or Cancelled)

---

## 🔧 Maintenance

- Maintenance log records (repairs, oil changes, service history)
- Maintenance due alert triggers
- Automatic vehicle status locking while "In Shop"
- Real-time repair cost tracking

---

## ⛽ Fuel & Expense

- Fuel transaction logs & efficiency ratios
- Toll & parking logs
- Expense categorization and verification
- Operational cost calculations

---

## 📈 Reports & Analytics

- 6 operational report templates (utilization, driver performance, fuel consumption, efficiency metrics, repairs, expenses)
- Contextual filter parameters
- Print-ready PDF, Excel, and CSV download exports

---

# 🛡️ Business Rules

✔ Unique Vehicle Registration Number

✔ Cargo cannot exceed vehicle capacity

✔ Expired license drivers cannot be assigned

✔ Suspended drivers cannot be assigned

✔ Vehicle already on trip cannot be reused

✔ Driver already on trip cannot be reused

✔ Vehicle under maintenance cannot be dispatched

✔ Completing trip automatically restores availability

✔ Maintenance automatically changes vehicle status

---

# 🏗️ Tech Stack

## Frontend

- React
- React Router (v6)
- Axios
- Tailwind CSS
- Chart.js

---

## Backend

- Node.js
- Express.js
- JWT Authentication
- bcryptjs
- Nodemailer
- REST API

---

## Database

- MySQL

---

# 🗄 Database Schema

```
Users
│
├── Roles
│
├── Vehicles
│
├── Drivers
│
├── Trips
│
├── MaintenanceLogs
│
├── FuelLogs
│
└── Expenses
```

---

# 📁 Project Structure

```
TransitOps/
│
├── client/
│   ├── public/
│   ├── src/
│   │
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── services/
│   ├── hooks/
│   ├── context/
│   ├── routes/
│   ├── assets/
│   └── App.jsx
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
│
├── database/
│   └── schema.sql
│   └── seed.sql
│
├── README.md
│   └── package.json
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/transitops.git

cd transitops
```

---

## Install Frontend

```bash
cd client

npm install

npm run dev
```

---

## Install Backend

```bash
cd server

npm install

npm run dev
```

---

## MySQL

Create Database

```sql
CREATE DATABASE transitops_db;
```

Import

```bash
mysql -u root -p transitops_db < database/schema.sql
mysql -u root -p transitops_db < database/seed.sql
```

---

# 🔑 Environment Variables

Create **.env** in `server/` directory:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=transitops_db

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h

# SMTP configuration (Optional - fallback to Ethereal sandbox test account)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM=no-reply@transitops.com
```

---

# 🚀 API Endpoints

## Authentication

```
POST /api/v1/auth/login

POST /api/v1/auth/register

POST /api/v1/auth/verify-otp

POST /api/v1/auth/resend-otp

GET  /api/v1/auth/me
```

---

## Vehicles

```
GET    /api/v1/vehicles

POST   /api/v1/vehicles

PUT    /api/v1/vehicles/:id

DELETE /api/v1/vehicles/:id
```

---

## Drivers

```
GET    /api/v1/drivers

POST   /api/v1/drivers

PUT    /api/v1/drivers/:id

DELETE /api/v1/drivers/:id
```

---

## Trips

```
GET    /api/v1/trips

POST   /api/v1/trips

PUT    /api/v1/trips/:id

DELETE /api/v1/trips/:id
```

---

## Maintenance

```
GET    /api/v1/maintenance

POST   /api/v1/maintenance

PUT    /api/v1/maintenance/:id

DELETE /api/v1/maintenance/:id
```

---

## Fuel Logs

```
GET    /api/v1/fuel

POST   /api/v1/fuel

PUT    /api/v1/fuel/:id

DELETE /api/v1/fuel/:id
```

---

## Expenses

```
GET    /api/v1/expenses

POST   /api/v1/expenses

PUT    /api/v1/expenses/:id

DELETE /api/v1/expenses/:id
```

---

# 📸 Screenshots

## Login

> Add Screenshot

---

## Dashboard

> Add Screenshot

---

## Vehicle Management

> Add Screenshot

---

## Driver Management

> Add Screenshot

---

## Trip Management

> Add Screenshot

---

## Maintenance

> Add Screenshot

---

## Reports

> Add Screenshot

---

# 🔄 Workflow

```
Vehicle Registration
        │
        ▼
Driver Registration
        │
        ▼
Trip Creation
        │
        ▼
Validation
        │
        ▼
Dispatch
        │
        ▼
Vehicle = On Trip
Driver = On Trip
        │
        ▼
Trip Completed
        │
        ▼
Vehicle Available
Driver Available
        │
        ▼
Maintenance
        │
        ▼
Reports Updated
```

---

# 📌 Future Improvements

- Email Notifications
- SMS Alerts
- GPS Tracking
- Live Vehicle Map
- Document Upload
- PDF Reports
- Dark Mode
- Mobile App
- AI Route Optimization

---

# 👨‍💻 Contributors

| Name | Role |
|------|------|
| Your Name | Full Stack Developer |

---

# ⭐ Support

If you like this project,

⭐ Star the repository

🍴 Fork it

🐛 Report Issues

💡 Suggest Features

---

# 📜 License

This project is licensed under the MIT License.

---

## ❤️ Built with

React • Node.js • Express.js • MySQL