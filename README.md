# PetCare Plus Management System

A full-stack veterinary clinic management platform for managing pets, appointments, medical records, billing, inventory, and notifications.

---

## 🏗️ System Overview

| Component | Technology | Status |
|-----------|-----------|--------|
| Backend API | Node.js + Express + MySQL | ✅ Complete |
| Admin Panel | React.js + MUI | ✅ Complete |
| Mobile App | Flutter | ✅ Complete |
| QR System | Node.js (`backend/utils/qrGenerator.js`) | ✅ Complete |
| SMS Notifications | Twilio / Mock | ✅ Complete |
| Push Notifications | Firebase Cloud Messaging | ✅ Complete |

---

## 📦 Tech Stack

- **Backend**: Node.js, Express, MySQL, JWT, bcrypt, QRCode
- **Admin Panel**: React 18, Vite, MUI (Material UI), React Query, React Router v6
- **Mobile App**: Flutter 3, Dart, Provider, GoRouter, Dio, flutter_secure_storage, qr_flutter, mobile_scanner
- **Database**: MySQL 8
- **Notifications**: Twilio SMS (mock mode), Firebase Cloud Messaging

---

## 🚀 How to Run

### Prerequisites
- Node.js 18+
- MySQL 8
- Flutter SDK 3.x
- Android Studio / Xcode (for mobile)

---

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
node server.js
```

The API runs at `http://localhost:5000/api`

**Database Setup:**
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p petcare_plus < backend/database/seeders/seed_data.sql
```

---

### 2. Admin Panel

```bash
cd admin-panel
npm install
npm run dev
```

Opens at `http://localhost:3000`

---

### 3. Mobile App

```bash
cd mobile-app
flutter pub get
flutter run
```

> **Note**: For Android emulator, the backend URL is `http://10.0.2.2:5000/api`. For iOS simulator, it's `http://localhost:5000/api`. This is configured in `lib/core/constants/api_constants.dart`.

---

## 🔑 Login Credentials (Default)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@petcareplus.com | Admin@123 |
| Vet | vet@petcareplus.com | Vet@123 |
| Receptionist | receptionist@petcareplus.com | Recept@123 |
| Pet Owner | owner@petcareplus.com | Owner@123 |

> **Mobile App** accepts Pet Owner credentials only.

---

## 📡 API Endpoints Summary

| Resource | Base Path |
|----------|-----------|
| Auth | `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout`, `POST /api/auth/refresh-token` |
| Users | `GET/POST/PUT/DELETE /api/users` |
| Pets | `GET/POST/PUT/DELETE /api/pets` |
| Appointments | `GET/POST/PUT/DELETE /api/appointments` |
| Medical Records | `GET/POST/PUT/DELETE /api/medical-records` |
| Vaccinations | `GET/POST/PUT/DELETE /api/vaccinations` |
| Inventory | `GET/POST/PUT/DELETE /api/inventory` |
| Invoices | `GET/POST/PUT/DELETE /api/invoices` |
| Notifications | `GET/POST /api/notifications` |
| Dashboard | `GET /api/dashboard/admin`, `GET /api/dashboard/vet`, `GET /api/dashboard/receptionist` |

---

## 🔲 QR Code Workflow

1. Admin/Staff generates QR code per pet via the Admin Panel (Pets → View QR Code)
2. QR contains JSON payload: `{ type, version, petId, ownerId, identifier, petName }`
3. Pet owner can view/share their pet's QR from the Mobile App (Pets → View QR Code)
4. At clinic check-in, staff can scan the QR using the Mobile App QR Scanner
5. Scanner fetches pet info from backend and displays it instantly

---

## 📱 SMS / FCM Mock Mode

### SMS (Twilio)
- Without `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` set in `.env`, SMS messages are printed to the console (mock mode)
- Set Twilio credentials in `.env` to send real SMS

### FCM (Firebase Push Notifications)
- Without `FIREBASE_PROJECT_ID` / `FIREBASE_PRIVATE_KEY` / `FIREBASE_CLIENT_EMAIL` set in `.env`, push notifications are printed to the console (mock mode)
- Configure Firebase in `.env` and update `mobile-app/lib/firebase_options.dart` with your project credentials for real push notifications

---

## 📁 Project Structure

```
├── backend/              # Node.js + Express API
│   ├── controllers/      # Route handlers
│   ├── middleware/       # Auth, error handling
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   └── utils/            # JWT, QR, SMS, FCM utilities
├── admin-panel/          # React.js admin dashboard
│   └── src/
│       ├── pages/        # All page components
│       ├── components/   # Shared components
│       └── services/     # API service
├── mobile-app/           # Flutter mobile app (Pet Owners)
│   └── lib/
│       ├── core/         # Services, providers, constants
│       ├── features/     # Screen pages
│       ├── shared/       # Widgets, theme
│       └── router/       # GoRouter configuration
└── database/             # SQL schema and seeds
```
