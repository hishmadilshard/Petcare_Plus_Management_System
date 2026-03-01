-- =====================================================
-- PetCare Plus - Full Sample Seed Data
-- =====================================================

USE petcare_plus;

-- =====================================================
-- SEED: pet_owners (linked to existing Owner users)
-- First, create sample Owner users
-- =====================================================
INSERT INTO users (full_name, email, phone, password_hash, role, status, email_verified) VALUES
('Amal Silva',     'amal@gmail.com',    '0771111111', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIwNoRe4Aq', 'Owner', 'Active', TRUE),
('Nimal Perera',   'nimal@gmail.com',   '0772222222', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIwNoRe4Aq', 'Owner', 'Active', TRUE),
('Kamali Fernando','kamali@gmail.com',  '0773333333', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIwNoRe4Aq', 'Owner', 'Active', TRUE);

-- =====================================================
-- SEED: pet_owners profile
-- =====================================================
INSERT INTO pet_owners (user_id, address, city, postal_code, emergency_contact, registered_date) VALUES
(4, '12 Galle Road, Colombo 3',   'Colombo',   '00300', '0771000001', '2026-01-10'),
(5, '45 Kandy Road, Kurunegala',  'Kurunegala','60000', '0771000002', '2026-01-15'),
(6, '78 Main Street, Galle',      'Galle',     '80000', '0771000003', '2026-01-20');

-- =====================================================
-- SEED: pets
-- =====================================================
INSERT INTO pets (owner_id, pet_name, species, breed, age, date_of_birth, gender, weight, color, status) VALUES
(1, 'Buddy',   'Dog', 'Golden Retriever', 3, '2023-01-15', 'Male',   28.50, 'Golden',    'Active'),
(1, 'Whiskers','Cat', 'Persian',          5, '2021-03-10', 'Female',  4.20, 'White',     'Active'),
(2, 'Rocky',   'Dog', 'German Shepherd',  2, '2024-02-20', 'Male',   32.00, 'Black/Tan', 'Active'),
(3, 'Luna',    'Cat', 'Siamese',          4, '2022-06-05', 'Female',  3.80, 'Cream',     'Active'),
(3, 'Max',     'Dog', 'Labrador',         6, '2020-09-12', 'Male',   30.00, 'Black',     'Active');

-- =====================================================
-- SEED: appointments
-- vet_id = 2 (Dr. Sarah Fernando)
-- =====================================================
INSERT INTO appointments (pet_id, vet_id, appointment_date, appointment_time, service_type, duration_minutes, status) VALUES
(1, 2, '2026-03-05', '09:00:00', 'Checkup',    30, 'Scheduled'),
(2, 2, '2026-03-05', '10:00:00', 'Vaccination', 20, 'Confirmed'),
(3, 2, '2026-03-06', '09:30:00', 'Checkup',    30, 'Scheduled'),
(4, 2, '2026-03-07', '11:00:00', 'Follow-up',  20, 'Scheduled'),
(5, 2, '2026-02-28', '14:00:00', 'Surgery',    90, 'Completed');

-- =====================================================
-- SEED: medical_records
-- =====================================================
INSERT INTO medical_records (pet_id, vet_id, appointment_id, visit_type, diagnosis, symptoms, treatment, record_date, temperature, heart_rate, respiratory_rate) VALUES
(5, 2, 5, 'Surgery',  'Cruciate ligament repair', 'Limping, pain on right hind leg', 'Surgical repair + post-op antibiotics', '2026-02-28', 38.5, 90, 20),
(1, 2, NULL, 'Checkup', 'Healthy', 'Routine annual checkup', 'Deworming administered', '2026-01-10', 38.2, 85, 18),
(2, 2, NULL, 'Vaccination', 'N/A', 'Annual vaccination', 'Rabies + FVRCP given', '2026-01-15', 38.3, 140, 22);

-- =====================================================
-- SEED: vaccinations
-- =====================================================
INSERT INTO vaccinations (pet_id, vaccine_name, vaccine_type, given_date, next_due_date, batch_number, manufacturer, vet_id) VALUES
(1, 'Rabies',        'Core',     '2026-01-10', '2027-01-10', 'RB2026A', 'VetPharm LK', 2),
(1, 'DHPP',          'Core',     '2026-01-10', '2027-01-10', 'DH2026B', 'VetPharm LK', 2),
(2, 'Rabies',        'Core',     '2026-01-15', '2027-01-15', 'RB2026C', 'VetPharm LK', 2),
(2, 'FVRCP',         'Core',     '2026-01-15', '2027-01-15', 'FV2026D', 'VetPharm LK', 2),
(3, 'Rabies',        'Core',     '2026-02-01', '2027-02-01', 'RB2026E', 'VetPharm LK', 2),
(4, 'FVRCP',         'Core',     '2026-02-10', '2027-02-10', 'FV2026F', 'VetPharm LK', 2),
(5, 'Rabies',        'Core',     '2025-09-12', '2026-09-12', 'RB2025G', 'VetPharm LK', 2);

-- =====================================================
-- SEED: invoices
-- =====================================================
INSERT INTO invoices (owner_id, appointment_id, invoice_number, subtotal, tax, discount, total_amount, payment_status, payment_method, invoice_date, due_date, paid_date, paid_amount, created_by) VALUES
(1, 5, 'INV-2026-001', 15000.00, 1500.00, 0.00,   16500.00, 'Paid',    'Card',  '2026-02-28', '2026-02-28', '2026-02-28', 16500.00, 3),
(1, 1, 'INV-2026-002',  1500.00,  150.00, 0.00,    1650.00, 'Pending', NULL,    '2026-03-05', '2026-03-12', NULL,             0.00, 3),
(2, 3, 'INV-2026-003',  1500.00,  150.00, 100.00,  1550.00, 'Pending', NULL,    '2026-03-06', '2026-03-13', NULL,             0.00, 3);

-- =====================================================
-- SEED: invoice_items
-- =====================================================
INSERT INTO invoice_items (invoice_id, description, item_type, quantity, unit_price, total) VALUES
(1, 'Cruciate Ligament Surgery',        'Service',  1, 12000.00, 12000.00),
(1, 'Antibiotics - Amoxicillin (10 tabs)', 'Medicine', 10,  25.00,   250.00),
(1, 'Post-op Consultation',             'Service',  1,  2750.00,  2750.00),
(2, 'Annual Health Checkup',            'Service',  1,   500.00,   500.00),
(2, 'Rabies Vaccine',                   'Vaccine',  1,  1000.00,  1000.00),
(3, 'Annual Health Checkup',            'Service',  1,   500.00,   500.00),
(3, 'Rabies Vaccine',                   'Vaccine',  1,  1000.00,  1000.00);

-- =====================================================
-- SEED: notifications
-- =====================================================
INSERT INTO notifications (user_id, title, message, notification_type, delivery_method, priority, is_read, status) VALUES
(4, 'Appointment Confirmed',    'Your appointment for Buddy on 2026-03-05 at 09:00 is confirmed.',         'Appointment', 'App',   'High',   FALSE, 'Sent'),
(4, 'Invoice Ready',            'Invoice INV-2026-002 for LKR 1,650.00 is ready. Please make payment.',    'Payment',     'Email', 'Medium', FALSE, 'Sent'),
(5, 'Appointment Reminder',     'Reminder: Rocky has an appointment tomorrow at 09:30.',                   'Appointment', 'App',   'High',   FALSE, 'Sent'),
(2, 'Low Inventory Alert',      'Flea Treatment stock is running low (5 remaining). Please reorder.',      'System',      'App',   'High',   FALSE, 'Sent'),
(1, 'New Appointment Scheduled','A new appointment has been booked for 2026-03-05 09:00 with Dr. Sarah.', 'Appointment', 'App',   'Medium', TRUE,  'Delivered');

SELECT '✅ Full seed data inserted successfully!' AS Status;