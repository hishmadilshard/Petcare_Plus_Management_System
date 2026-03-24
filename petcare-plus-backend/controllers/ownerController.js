const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// ── GET ALL OWNERS ────────────────────────────────────────
const getAllOwners = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        po.owner_id, po.address, po.city,
        po.emergency_contact, po.registered_date,
        u.user_id, u.full_name, u.email, u.phone,
        u.status, u.created_at,
        COUNT(DISTINCT p.pet_id) AS total_pets,
        COUNT(DISTINCT a.appointment_id) AS total_appointments
      FROM pet_owners po
      JOIN users u ON po.user_id = u.user_id
      LEFT JOIN pets p ON po.owner_id = p.owner_id
      LEFT JOIN appointments a ON po.owner_id = a.owner_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' GROUP BY po.owner_id';

    // Count total
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM pet_owners po
       JOIN users u ON po.user_id = u.user_id
       WHERE 1=1 ${search ? 'AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)' : ''}`,
      search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []
    );
    const total = countResult[0].total;

    query += ' ORDER BY po.registered_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [owners] = await db.query(query, params);

    return paginatedResponse(res, 'Owners fetched successfully.', owners, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error('Get all owners error:', error);
    return errorResponse(res, 'Failed to fetch owners.', 500);
  }
};

// ── GET SINGLE OWNER ──────────────────────────────────────
const getOwnerById = async (req, res) => {
  try {
    const { id } = req.params;

    const [owners] = await db.query(
      `SELECT po.*, u.user_id, u.full_name, u.email,
              u.phone, u.status, u.created_at, u.last_login
       FROM pet_owners po
       JOIN users u ON po.user_id = u.user_id
       WHERE po.owner_id = ?`,
      [id]
    );

    if (owners.length === 0) {
      return errorResponse(res, 'Owner not found.', 404);
    }

    // Get their pets
    const [pets] = await db.query(
      `SELECT pet_id, pet_name, species, breed, age, gender, status, profile_image
       FROM pets WHERE owner_id = ? AND status = 'Active'`,
      [id]
    );

    // Get recent appointments
    const [appointments] = await db.query(
      `SELECT a.*, p.pet_name, u.full_name AS vet_name
       FROM appointments a
       JOIN pets p ON a.pet_id = p.pet_id
       JOIN users u ON a.vet_id = u.user_id
       WHERE a.owner_id = ?
       ORDER BY a.appointment_date DESC LIMIT 5`,
      [id]
    );

    // Get pending invoices
    const [invoices] = await db.query(
      `SELECT * FROM invoices 
       WHERE owner_id = ? AND payment_status = 'Pending'
       ORDER BY invoice_date DESC`,
      [id]
    );

    return successResponse(res, 'Owner profile fetched successfully.', {
      ...owners[0],
      pets,
      recent_appointments: appointments,
      pending_invoices: invoices,
    });

  } catch (error) {
    console.error('Get owner by ID error:', error);
    return errorResponse(res, 'Failed to fetch owner profile.', 500);
  }
};

// ── CREATE OWNER ──────────────────────────────────────────
const createOwner = async (req, res) => {
  try {
    const { full_name, email, phone, password, address, city, emergency_contact } = req.body;

    // Check email
    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return errorResponse(res, 'Email already registered.', 409);
    }

    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password || 'PetCare@1234', salt);

    const [userResult] = await db.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, status, is_verified)
       VALUES (?, ?, ?, ?, 'Owner', 'Active', TRUE)`,
      [full_name, email, phone, password_hash]
    );

    const userId = userResult.insertId;

    const [ownerResult] = await db.query(
      `INSERT INTO pet_owners (user_id, address, city, emergency_contact, registered_date)
       VALUES (?, ?, ?, ?, CURRENT_DATE)`,
      [userId, address || null, city || null, emergency_contact || null]
    );

    return successResponse(res, 'Owner registered successfully!', {
      owner_id: ownerResult.insertId,
      user_id: userId,
      full_name, email, phone,
    }, 201);

  } catch (error) {
    console.error('Create owner error:', error);
    return errorResponse(res, 'Failed to create owner.', 500);
  }
};

// ── UPDATE OWNER ──────────────────────────────────────────
const updateOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, address, city, emergency_contact, status } = req.body;

    const [owner] = await db.query(
      'SELECT po.*, u.user_id FROM pet_owners po JOIN users u ON po.user_id = u.user_id WHERE po.owner_id = ?',
      [id]
    );
    if (owner.length === 0) {
      return errorResponse(res, 'Owner not found.', 404);
    }

    await db.query(
      'UPDATE users SET full_name = ?, phone = ?, status = ? WHERE user_id = ?',
      [full_name, phone, status || 'Active', owner[0].user_id]
    );

    await db.query(
      'UPDATE pet_owners SET address = ?, city = ?, emergency_contact = ? WHERE owner_id = ?',
      [address, city, emergency_contact, id]
    );

    return successResponse(res, 'Owner updated successfully.');

  } catch (error) {
    console.error('Update owner error:', error);
    return errorResponse(res, 'Failed to update owner.', 500);
  }
};

// ── DELETE OWNER ──────────────────────────────────────────
const deleteOwner = async (req, res) => {
  try {
    const { id } = req.params;

    const [owner] = await db.query(
      'SELECT po.*, u.user_id, u.full_name FROM pet_owners po JOIN users u ON po.user_id = u.user_id WHERE po.owner_id = ?',
      [id]
    );
    if (owner.length === 0) {
      return errorResponse(res, 'Owner not found.', 404);
    }

    await db.query('DELETE FROM users WHERE user_id = ?', [owner[0].user_id]);

    return successResponse(res, `${owner[0].full_name} has been removed successfully.`);

  } catch (error) {
    console.error('Delete owner error:', error);
    return errorResponse(res, 'Failed to delete owner.', 500);
  }
};

module.exports = { getAllOwners, getOwnerById, createOwner, updateOwner, deleteOwner };