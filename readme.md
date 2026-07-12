# 🚚 TransitOps - Smart Transport Operations Platform

> A modern Fleet & Transport Management System built with **React, Node.js, Express.js, and MySQL**.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Node](https://img.shields.io/badge/Node.js-22-green?logo=node.js)
![Express](https://img.shields.io/badge/Express.js-Backend-black?logo=express)
![MySQL](https://img.shields.io/badge/MySQL-Database-orange?logo=mysql)
![JWT](https://img.shields.io/badge/Auth-JWT-success)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 📖 Overview

TransitOps is a centralized transport operations platform that digitizes fleet management, driver administration, trip scheduling, maintenance tracking, and expense management.

The system enables logistics companies to efficiently manage vehicles, drivers, dispatch operations, fuel consumption, maintenance records, and analytics while enforcing business rules.

---

# ✨ Features

## 🔐 Authentication

- Secure Login
- JWT Authentication
- Role-Based Access Control (RBAC)
- Protected Routes

---

## 📊 Dashboard

- Fleet KPIs
- Active Vehicles
- Available Vehicles
- Vehicles in Maintenance
- Active Trips
- Pending Trips
- Drivers On Duty
- Fleet Utilization
- Charts & Analytics

---

## 🚛 Vehicle Management

- Add Vehicle
- Update Vehicle
- Delete Vehicle
- Vehicle Status
- Vehicle Capacity
- Odometer Tracking
- Acquisition Cost
- Vehicle Registry

---

## 👨‍✈️ Driver Management

- Driver Registration
- License Tracking
- License Expiry
- Safety Score
- Driver Status
- Contact Information

---

## 🛣️ Trip Management

- Create Trip
- Assign Driver
- Assign Vehicle
- Route Planning
- Cargo Validation
- Trip Lifecycle

```
Draft
   ↓
Dispatched
   ↓
Completed

or

Cancelled
```

---

## 🔧 Maintenance

- Maintenance Records
- Oil Change
- Repairs
- Service History
- Automatic Vehicle Status Update

---

## ⛽ Fuel & Expense

- Fuel Logs
- Fuel Cost
- Toll Expenses
- Maintenance Expenses
- Operational Cost Calculation

---

## 📈 Reports

- Fuel Efficiency
- Vehicle ROI
- Fleet Utilization
- Operational Cost
- CSV Export
- Dashboard Analytics

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
- React Router
- Axios
- Tailwind CSS
- Chart.js

---

## Backend

- Node.js
- Express.js
- JWT Authentication
- bcrypt
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
│   └── transitops.sql
│
├── README.md
└── package.json
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
CREATE DATABASE transitops;
```

Import

```bash
database/transitops.sql
```

---

# 🔑 Environment Variables

Create **.env**

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=transitops

JWT_SECRET=your_secret_key
```

---

# 🚀 API Endpoints

## Authentication

```
POST /api/auth/login

POST /api/auth/register
```

---

## Vehicles

```
GET    /api/vehicles

POST   /api/vehicles

PUT    /api/vehicles/:id

DELETE /api/vehicles/:id
```

---

## Drivers

```
GET    /api/drivers

POST   /api/drivers

PUT    /api/drivers/:id

DELETE /api/drivers/:id
```

---

## Trips

```
GET /api/trips

POST /api/trips

PUT /api/trips/:id
```

---

## Maintenance

```
GET /api/maintenance

POST /api/maintenance
```

---

## Fuel Logs

```
GET /api/fuel

POST /api/fuel
```

---

## Expenses

```
GET /api/expenses

POST /api/expenses
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