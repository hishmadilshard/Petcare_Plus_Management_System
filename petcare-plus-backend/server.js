const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');
const bcrypt  = require('bcryptjs');
require('dotenv').config();

const app = express();

// ── Security & Middleware ─────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://10.0.2.2:3000',  // ✅ Android emulator
    'http://10.0.2.2:5000',  // ✅ Android emulator
  ],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(
  path.join(__dirname, 'uploads')
));

// ── API Health Check ──────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success:   true,
    message:   '🐾 PetCare Plus API is running!',
    version:   '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── TEMP: Create Admin ────────────────────────────────────
app.post('/api/test-create-admin', async (req, res) => {
  try {
    const db   = require('./config/db');
    const hash = await bcrypt.hash('Admin@1234', 12);
    await db.query(
      `INSERT INTO users
        (full_name, email, phone,
         password_hash, role, status, is_verified)
       VALUES
        ('PetCare Admin','admin@petcareplus.com',
         '0771234567',?,'Admin','Active',TRUE)
       ON DUPLICATE KEY UPDATE password_hash = ?`,
      [hash, hash]
    );
    await db.query(
      `INSERT INTO users
        (full_name, email, phone,
         password_hash, role, status, is_verified)
       VALUES
        ('Dr. Sarah Silva','vet@petcareplus.com',
         '0772345678',?,'Vet','Active',TRUE)
       ON DUPLICATE KEY UPDATE password_hash = ?`,
      [hash, hash]
    );
    await db.query(
      `INSERT INTO users
        (full_name, email, phone,
         password_hash, role, status, is_verified)
       VALUES
        ('Lisa Reception','reception@petcareplus.com',
         '0773456789',?,'Receptionist','Active',TRUE)
       ON DUPLICATE KEY UPDATE password_hash = ?`,
      [hash, hash]
    );
    res.json({ success: true, message: 'All users created!' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// ── Import Routes ─────────────────────────────────────────
const authRoutes         = require('./routes/authRoutes');
const petRoutes          = require('./routes/petRoutes');
const ownerRoutes        = require('./routes/ownerRoutes');
const appointmentRoutes  = require('./routes/appointmentRoutes');
const medicalRoutes      = require('./routes/medicalRoutes');
const vaccinationRoutes  = require('./routes/vaccinationRoutes');
const invoiceRoutes      = require('./routes/invoiceRoutes');
const inventoryRoutes    = require('./routes/inventoryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes    = require('./routes/dashboardRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const careRoutes         = require('./routes/careRoutes');
// const branchRoutes       = require('./routes/branchRoutes');

// ── Validate all routes are proper middleware ─────────────
const routes = {
  authRoutes, petRoutes, ownerRoutes,
  appointmentRoutes, medicalRoutes, vaccinationRoutes,
  invoiceRoutes, inventoryRoutes, notificationRoutes,
  dashboardRoutes, prescriptionRoutes, careRoutes
};

Object.entries(routes).forEach(([name, route]) => {
  if (typeof route !== 'function') {
    console.error(
      `❌ Route "${name}" is not a valid middleware!`,
      `Got: ${typeof route}`
    );
  }
});

// ── Register Routes ───────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/pets',          petRoutes);
app.use('/api/owners',        ownerRoutes);
app.use('/api/appointments',  appointmentRoutes);
app.use('/api/medical',       medicalRoutes);
app.use('/api/vaccinations',  vaccinationRoutes);
app.use('/api/invoices',      invoiceRoutes);
app.use('/api/inventory',     inventoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/care',          careRoutes);
// app.use('/api/branches',      branchRoutes);

// ── 404 Handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  });
});

// ── Global Error Handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error.',
  });
});

// ── Start Server ──────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🐾  PETCARE PLUS BACKEND SERVER        ║');
  console.log('║      Navy Blue & White Professional      ║');
  console.log(`║      Running on port ${PORT}                ║`);
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
  console.log('✅ Routes registered:');
  console.log('   /api/auth          - Authentication');
  console.log('   /api/pets          - Pet Management');
  console.log('   /api/owners        - Owner Management');
  console.log('   /api/appointments  - Appointments');
  console.log('   /api/medical       - Medical Records');
  console.log('   /api/vaccinations  - Vaccinations');
  console.log('   /api/invoices      - Invoices');
  console.log('   /api/inventory     - Inventory');
  console.log('   /api/notifications - Notifications');
  console.log('   /api/dashboard     - Dashboard');
  console.log('   /api/prescriptions - Prescriptions');
  console.log('   /api/care          - Care Instructions');
  // console.log('   /api/branches      - Branches');
  console.log('');
}); 

module.exports = app;