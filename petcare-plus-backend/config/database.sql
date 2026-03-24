-- ============================================================
-- PETCARE PLUS MANAGEMENT SYSTEM - DATABASE
-- Professional Grade | Navy Blue Theme System
-- ============================================================

CREATE DATABASE IF NOT EXISTS petcare_plus_db;
USE petcare_plus_db;

-- ============================================================
-- TABLE 1: roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  permissions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 2: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(15),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin', 'Vet', 'Receptionist', 'Owner') NOT NULL DEFAULT 'Owner',
  profile_image VARCHAR(255) DEFAULT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 3: pet_owners
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_owners (
  owner_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  address TEXT,
  city VARCHAR(100),
  emergency_contact VARCHAR(15),
  registered_date DATE DEFAULT (CURRENT_DATE),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 4: pets
-- ============================================================
CREATE TABLE IF NOT EXISTS pets (
  pet_id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  pet_name VARCHAR(50) NOT NULL,
  species VARCHAR(50) NOT NULL,
  breed VARCHAR(50),
  age INT,
  date_of_birth DATE,
  gender ENUM('Male', 'Female', 'Unknown') DEFAULT 'Unknown',
  weight DECIMAL(5,2),
  color VARCHAR(50),
  microchip_id VARCHAR(100) UNIQUE,
  qr_code VARCHAR(500),
  profile_image VARCHAR(255),
  allergies TEXT,
  special_notes TEXT,
  status ENUM('Active', 'Inactive', 'Deceased') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES pet_owners(owner_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 5: appointments
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  appointment_id INT AUTO_INCREMENT PRIMARY KEY,
  pet_id INT NOT NULL,
  vet_id INT NOT NULL,
  owner_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  end_time TIME,
  service_type VARCHAR(100) NOT NULL,
  reason TEXT,
  notes TEXT,
  status ENUM('Booked', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show') DEFAULT 'Booked',
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE,
  FOREIGN KEY (vet_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES pet_owners(owner_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 6: medical_records
-- ============================================================
CREATE TABLE IF NOT EXISTS medical_records (
  record_id INT AUTO_INCREMENT PRIMARY KEY,
  pet_id INT NOT NULL,
  vet_id INT NOT NULL,
  appointment_id INT,
  diagnosis TEXT,
  symptoms TEXT,
  treatment TEXT,
  prescriptions TEXT,
  lab_results TEXT,
  follow_up_notes TEXT,
  record_date DATE NOT NULL,
  next_due_date DATE,
  attachment VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE,
  FOREIGN KEY (vet_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE 7: vaccinations
-- ============================================================
CREATE TABLE IF NOT EXISTS vaccinations (
  vaccination_id INT AUTO_INCREMENT PRIMARY KEY,
  pet_id INT NOT NULL,
  vet_id INT NOT NULL,
  vaccine_name VARCHAR(100) NOT NULL,
  vaccine_brand VARCHAR(100),
  batch_number VARCHAR(50),
  given_date DATE NOT NULL,
  next_due_date DATE,
  dosage VARCHAR(50),
  notes TEXT,
  status ENUM('Completed', 'Due', 'Overdue') DEFAULT 'Completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE,
  FOREIGN KEY (vet_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 8: inventory
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  item_name VARCHAR(100) NOT NULL,
  category ENUM('Medicine', 'Vaccine', 'Equipment', 'Supplies', 'Food', 'Other') NOT NULL,
  description TEXT,
  quantity INT NOT NULL DEFAULT 0,
  min_quantity INT DEFAULT 10,
  unit VARCHAR(20) DEFAULT 'units',
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  supplier VARCHAR(100),
  expiry_date DATE,
  status ENUM('Available', 'Low Stock', 'Out of Stock') DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 9: invoices
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  invoice_id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(20) UNIQUE NOT NULL,
  owner_id INT NOT NULL,
  appointment_id INT,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_rate DECIMAL(5,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  discount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_method ENUM('Cash', 'Card', 'Online', 'Pending') DEFAULT 'Pending',
  payment_status ENUM('Paid', 'Pending', 'Overdue', 'Cancelled') DEFAULT 'Pending',
  paid_date TIMESTAMP NULL,
  notes TEXT,
  invoice_date DATE NOT NULL,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES pet_owners(owner_id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE 10: invoice_items
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 11: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('Appointment', 'Vaccination', 'Invoice', 'Medical', 'General') DEFAULT 'General',
  notification_channel ENUM('App', 'Email', 'SMS', 'Push') DEFAULT 'App',
  is_read BOOLEAN DEFAULT FALSE,
  sent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('Sent', 'Pending', 'Failed') DEFAULT 'Pending',
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA — Default Admin + Roles
-- ============================================================
INSERT INTO roles (role_name, permissions) VALUES
('Admin', 'all'),
('Vet', 'pets,appointments,medical_records,vaccinations'),
('Receptionist', 'pets,appointments,invoices,notifications'),
('Owner', 'own_pets,own_appointments,own_invoices');

-- Default Admin User (password: Admin@1234)
INSERT INTO users (full_name, email, phone, password_hash, role, status, is_verified) VALUES
('PetCare Admin', 'admin@petcareplus.com', '0771234567',
'$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMUECVJ4xnZgT3F5mxKzA8f6uy',
'Admin', 'Active', TRUE),
('Dr. Sarah Silva', 'vet@petcareplus.com', '0772345678',
'$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMUECVJ4xnZgT3F5mxKzA8f6uy',
'Vet', 'Active', TRUE),
('Lisa Reception', 'reception@petcareplus.com', '0773456789',
'$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMUECVJ4xnZgT3F5mxKzA8f6uy',
'Receptionist', 'Active', TRUE);

-- Sample inventory
INSERT INTO inventory (item_name, category, quantity, min_quantity, unit_price, status) VALUES
('Rabies Vaccine', 'Vaccine', 50, 10, 2500.00, 'Available'),
('Amoxicillin 250mg', 'Medicine', 100, 20, 450.00, 'Available'),
('Surgical Gloves', 'Supplies', 200, 50, 150.00, 'Available'),
('Digital Thermometer', 'Equipment', 5, 2, 3500.00, 'Available'),
('Dog Food Premium', 'Food', 30, 10, 1800.00, 'Available');