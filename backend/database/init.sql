-- =====================================================
-- PetCare Plus Management System - Database Initialization
-- Run this FIRST before schema.sql
-- =====================================================

CREATE DATABASE IF NOT EXISTS petcare_plus
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'petcare_user'@'localhost' IDENTIFIED BY 'PetCare@2026!';
GRANT ALL PRIVILEGES ON petcare_plus.* TO 'petcare_user'@'localhost';
FLUSH PRIVILEGES;

SELECT '✅ Database and user created successfully!' AS Status;