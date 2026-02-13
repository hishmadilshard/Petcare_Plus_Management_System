-- =====================================================
-- PetCare Plus Management System - Database Schema
-- Version: 1.0
-- Author: Hishma Dilshar (K2557675)
-- Date: 2026-02-13
-- =====================================================

USE petcare_plus;

-- Drop existing tables (clean install)
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS vaccinations;
DROP TABLE IF EXISTS medical_records;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS pets;
DROP TABLE IF EXISTS pet_owners;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS refresh_tokens;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- TABLE: users
-- Stores all system users (Admin, Vet, Receptionist, Pet Owners)
-- =====================================================
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Vet', 'Receptionist', 'Owner') NOT NULL DEFAULT 'Owner',
    status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
    profile_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: refresh_tokens
-- Stores JWT refresh tokens for secure session management
-- =====================================================
CREATE TABLE refresh_tokens (
    token_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: pet_owners
-- Extended profile information for pet owners
-- =====================================================
CREATE TABLE pet_owners (
    owner_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    address TEXT,
    city VARCHAR(50),
    postal_code VARCHAR(10),
    emergency_contact VARCHAR(15),
    registered_date DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: pets
-- Stores all pet information
-- =====================================================
CREATE TABLE pets (
    pet_id INT PRIMARY KEY AUTO_INCREMENT,
    owner_id INT NOT NULL,
    pet_name VARCHAR(50) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(50),
    age INT,
    date_of_birth DATE,
    gender ENUM('Male', 'Female') NOT NULL,
    weight DECIMAL(5,2),
    color VARCHAR(50),
    microchip_id VARCHAR(50) UNIQUE,
    qr_code VARCHAR(255) UNIQUE,
    profile_image VARCHAR(255),
    special_notes TEXT,
    allergies TEXT,
    status ENUM('Active', 'Inactive', 'Deceased') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES pet_owners(owner_id) ON DELETE CASCADE,
    INDEX idx_owner_id (owner_id),
    INDEX idx_species (species),
    INDEX idx_status (status),
    INDEX idx_qr_code (qr_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: appointments
-- Manages appointment scheduling
-- =====================================================
CREATE TABLE appointments (
    appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    pet_id INT NOT NULL,
    vet_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    duration_minutes INT DEFAULT 30,
    notes TEXT,
    status ENUM('Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No-Show') DEFAULT 'Scheduled',
    cancellation_reason TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE,
    FOREIGN KEY (vet_id) REFERENCES users(user_id),
    INDEX idx_pet_id (pet_id),
    INDEX idx_vet_id (vet_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_status (status),
    UNIQUE KEY unique_appointment (vet_id, appointment_date, appointment_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: medical_records
-- Stores complete medical history for each pet
-- =====================================================
CREATE TABLE medical_records (
    record_id INT PRIMARY KEY AUTO_INCREMENT,
    pet_id INT NOT NULL,
    vet_id INT NOT NULL,
    appointment_id INT,
    visit_type ENUM('Checkup', 'Emergency', 'Surgery', 'Vaccination', 'Follow-up') DEFAULT 'Checkup',
    diagnosis TEXT,
    symptoms TEXT,
    treatment TEXT,
    prescription TEXT,
    lab_results TEXT,
    record_date DATE NOT NULL,
    next_visit_date DATE,
    attachments TEXT,
    temperature DECIMAL(4,2),
    heart_rate INT,
    respiratory_rate INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE,
    FOREIGN KEY (vet_id) REFERENCES users(user_id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    INDEX idx_pet_id (pet_id),
    INDEX idx_record_date (record_date),
    INDEX idx_visit_type (visit_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: vaccinations
-- Tracks vaccination records and schedules
-- =====================================================
CREATE TABLE vaccinations (
    vaccination_id INT PRIMARY KEY AUTO_INCREMENT,
    pet_id INT NOT NULL,
    vaccine_name VARCHAR(100) NOT NULL,
    vaccine_type ENUM('Core', 'Non-Core', 'Required') DEFAULT 'Core',
    given_date DATE NOT NULL,
    next_due_date DATE,
    batch_number VARCHAR(50),
    manufacturer VARCHAR(100),
    vet_id INT NOT NULL,
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE,
    FOREIGN KEY (vet_id) REFERENCES users(user_id),
    INDEX idx_pet_id (pet_id),
    INDEX idx_next_due_date (next_due_date),
    INDEX idx_vaccine_type (vaccine_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: inventory
-- Manages clinic inventory and supplies
-- =====================================================
CREATE TABLE inventory (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    item_name VARCHAR(100) NOT NULL,
    category ENUM('Medicine', 'Vaccine', 'Equipment', 'Supply', 'Food') NOT NULL,
    description TEXT,
    quantity INT DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'unit',
    unit_price DECIMAL(10,2),
    reorder_level INT DEFAULT 10,
    supplier VARCHAR(100),
    expiry_date DATE,
    status ENUM('Available', 'Low Stock', 'Out of Stock', 'Expired') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_expiry_date (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: invoices
-- Stores billing information
-- =====================================================
CREATE TABLE invoices (
    invoice_id INT PRIMARY KEY AUTO_INCREMENT,
    owner_id INT NOT NULL,
    appointment_id INT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('Pending', 'Paid', 'Partially Paid', 'Cancelled', 'Refunded') DEFAULT 'Pending',
    payment_method ENUM('Cash', 'Card', 'Bank Transfer', 'Online') NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    paid_date DATE NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES pet_owners(owner_id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    INDEX idx_owner_id (owner_id),
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_payment_status (payment_status),
    INDEX idx_invoice_date (invoice_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: invoice_items
-- Line items for each invoice
-- =====================================================
CREATE TABLE invoice_items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    item_type ENUM('Service', 'Medicine', 'Vaccine', 'Product', 'Other') DEFAULT 'Service',
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    INDEX idx_invoice_id (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: notifications
-- Manages system notifications
-- =====================================================
CREATE TABLE notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('Appointment', 'Vaccination', 'Payment', 'General', 'System') DEFAULT 'General',
    delivery_method ENUM('App', 'Email', 'SMS', 'All') DEFAULT 'App',
    priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    sent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Sent', 'Failed', 'Delivered') DEFAULT 'Pending',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_status (status),
    INDEX idx_notification_type (notification_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INITIAL DATA SEEDING
-- =====================================================

-- Default Admin User
-- Email: admin@petcareplus.lk
-- Password: Admin@123
INSERT INTO users (full_name, email, phone, password_hash, role, status, email_verified) 
VALUES (
    'System Administrator',
    'admin@petcareplus.lk',
    '0771234567',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIwNoRe4Aq',
    'Admin',
    'Active',
    TRUE
);

-- Sample Veterinarian
-- Email: vet@petcareplus.lk
-- Password: Vet@123
INSERT INTO users (full_name, email, phone, password_hash, role, status, email_verified) 
VALUES (
    'Dr. Sarah Fernando',
    'vet@petcareplus.lk',
    '0777654321',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Vet',
    'Active',
    TRUE
);

-- Sample Receptionist
-- Email: reception@petcareplus.lk
-- Password: Reception@123
INSERT INTO users (full_name, email, phone, password_hash, role, status, email_verified) 
VALUES (
    'Kasun Perera',
    'reception@petcareplus.lk',
    '0712345678',
    '$2a$12$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    'Receptionist',
    'Active',
    TRUE
);

-- Sample Inventory Items
INSERT INTO inventory (item_name, category, description, quantity, unit, unit_price, reorder_level, status) VALUES
('Rabies Vaccine', 'Vaccine', 'Annual rabies vaccination', 50, 'vial', 1500.00, 10, 'Available'),
('Antibiotics - Amoxicillin', 'Medicine', '500mg tablets', 200, 'tablet', 25.00, 50, 'Available'),
('Flea Treatment', 'Medicine', 'Monthly flea prevention', 30, 'pack', 850.00, 10, 'Available'),
('Surgical Gloves', 'Supply', 'Latex surgical gloves - Medium', 100, 'box', 350.00, 20, 'Available'),
('Pet Shampoo', 'Supply', 'Medicated pet shampoo', 15, 'bottle', 650.00, 5, 'Available');

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT '✅ Database schema created successfully!' AS Status,
       'Default credentials:' AS Info,
       'Admin: admin@petcareplus.lk / Admin@123' AS Admin,
       'Vet: vet@petcareplus.lk / Vet@123' AS Veterinarian,
       'Reception: reception@petcareplus.lk / Reception@123' AS Receptionist;