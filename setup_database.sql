CREATE DATABASE IF NOT EXISTS petcare_plus_db;
USE petcare_plus_db;

CREATE TABLE IF NOT EXISTS users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('Admin', 'Veterinarian', 'Receptionist') NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  refresh_token TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pet_owners (
  owner_id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  nic VARCHAR(20),
  emergency_contact VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pets (
  pet_id INT PRIMARY KEY AUTO_INCREMENT,
  owner_id INT NOT NULL,
  pet_name VARCHAR(255) NOT NULL,
  species VARCHAR(50) NOT NULL,
  breed VARCHAR(100),
  date_of_birth DATE,
  gender ENUM('Male', 'Female', 'Unknown'),
  color VARCHAR(50),
  weight DECIMAL(5,2),
  microchip_number VARCHAR(50),
  medical_conditions TEXT,
  allergies TEXT,
  current_medications TEXT,
  special_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES pet_owners(owner_id) ON DELETE CASCADE
);

INSERT INTO users (email, password, role, full_name, status)
VALUES ('admin@petcareplus.lk', '.ZQ4/zo1G.q1lRps.9cGQMQX0KoOKJT3TTs6YqGKW', 'Admin', 'System Administrator', 'Active');

INSERT INTO pet_owners (full_name, email, phone, address, city) VALUES
('John Smith', 'john.smith@email.com', '0771234567', '123 Main Street', 'Colombo'),
('Emma Wilson', 'emma.wilson@email.com', '0772345678', '456 Lake Road', 'Kandy'),
('Mike Brown', 'mike.brown@email.com', '0773456789', '789 Hill View', 'Galle');
