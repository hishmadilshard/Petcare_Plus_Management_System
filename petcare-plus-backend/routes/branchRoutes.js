/*
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const {
  successResponse, errorResponse,
} = require('../utils/response');

// ── GET ALL BRANCHES ──────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const [branches] = await db.query(
      `SELECT
         b.*,
         COUNT(DISTINCT u.user_id)          AS staff_count,
         COUNT(DISTINCT p.pet_id)           AS pet_count,
         COUNT(DISTINCT a.appointment_id)   AS appointment_count
       FROM branches b
       LEFT JOIN users u        ON u.branch_id = b.branch_id
       LEFT JOIN pets p         ON p.branch_id = b.branch_id
       LEFT JOIN appointments a ON a.branch_id = b.branch_id
       WHERE b.is_active = TRUE
       GROUP BY b.branch_id
       ORDER BY b.branch_id`
    );
    return successResponse(res, 'Branches fetched.', branches);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
});

// ── ✅ GET ALL VETS — MUST be BEFORE /:id routes ──────────
router.get('/vets/all', verifyToken, async (req, res) => {
  try {
    const [vets] = await db.query(
      `SELECT
         u.user_id, u.full_name, u.email, u.phone,
         GROUP_CONCAT(b.branch_name SEPARATOR ', ')
           AS assigned_branches,
         GROUP_CONCAT(b.branch_id SEPARATOR ',')
           AS branch_ids
       FROM users u
       LEFT JOIN vet_branches vb ON u.user_id = vb.vet_id
       LEFT JOIN branches b      ON vb.branch_id = b.branch_id
       WHERE u.role = 'Vet'
         AND u.is_active = TRUE
       GROUP BY u.user_id`
    );
    return successResponse(res, 'Vets fetched.', vets);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
});

// ── GET BRANCH STATS ──────────────────────────────────────
router.get('/:id/stats', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return errorResponse(res, 'Invalid branch ID.', 400);
    }

    const [[branch]] = await db.query(
      'SELECT * FROM branches WHERE branch_id = ?', [id]
    );
    if (!branch) {
      return errorResponse(res, 'Branch not found.', 404);
    }

    const [[pets]] = await db.query(
      `SELECT COUNT(*) AS total
       FROM pets WHERE branch_id = ?`, [id]
    );

    const [[owners]] = await db.query(
      `SELECT COUNT(*) AS total
       FROM pet_owners WHERE branch_id = ?`, [id]
    );

    const [[appointments]] = await db.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(CASE WHEN status = 'Scheduled'
           THEN 1 END) AS scheduled,
         COUNT(CASE WHEN DATE(appointment_date) = CURDATE()
           THEN 1 END) AS today
       FROM appointments WHERE branch_id = ?`, [id]
    );

    const [[revenue]] = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN payment_status = 'Paid'
           THEN total_amount END), 0)    AS total_revenue,
         COALESCE(SUM(CASE WHEN payment_status = 'Pending'
           THEN total_amount END), 0)    AS pending_revenue,
         COUNT(*)                        AS total_invoices
       FROM invoices WHERE branch_id = ?`, [id]
    );

    const [[inventory]] = await db.query(
      `SELECT
         COUNT(*)                                        AS total_items,
         COUNT(CASE WHEN quantity <= min_quantity
           AND quantity > 0 THEN 1 END)                 AS low_stock,
         COUNT(CASE WHEN quantity = 0 THEN 1 END)       AS out_of_stock
       FROM inventory WHERE branch_id = ?`, [id]
    );

    const [staff] = await db.query(
      `SELECT user_id, full_name, role, branch_role, email
       FROM users
       WHERE branch_id = ? AND is_active = TRUE`, [id]
    );

    let vets = [];
    try {
      const [vetRows] = await db.query(
        `SELECT u.user_id, u.full_name, u.email,
           vb.is_primary
         FROM vet_branches vb
         JOIN users u ON vb.vet_id = u.user_id
         WHERE vb.branch_id = ?`, [id]
      );
      vets = vetRows;
    } catch (e) {
      vets = [];
    }

    return successResponse(res, 'Branch stats fetched.', {
      branch,
      stats: {
        pets:               pets.total,
        owners:             owners.total,
        appointments:       appointments.total,
        today_appointments: appointments.today,
        scheduled:          appointments.scheduled,
        ...revenue,
        ...inventory,
      },
      staff,
      vets,
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
});

// ── CREATE BRANCH ─────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      branch_name, address, phone, email, city,
    } = req.body;

    if (!branch_name) {
      return errorResponse(
        res, 'Branch name is required.', 400
      );
    }

    const [result] = await db.query(
      `INSERT INTO branches
         (branch_name, address, phone, email, city)
       VALUES (?, ?, ?, ?, ?)`,
      [
        branch_name,
        address || null,
        phone   || null,
        email   || null,
        city    || null,
      ]
    );

    return successResponse(
      res, '🏥 Branch created!',
      { branch_id: result.insertId }, 201
    );
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
});

// ── UPDATE BRANCH ─────────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return errorResponse(res, 'Invalid branch ID.', 400);
    }

    const {
      branch_name, address, phone, email, city, is_active,
    } = req.body;

    await db.query(
      `UPDATE branches SET
         branch_name = COALESCE(?, branch_name),
         address     = COALESCE(?, address),
         phone       = COALESCE(?, phone),
         email       = COALESCE(?, email),
         city        = COALESCE(?, city),
         is_active   = COALESCE(?, is_active)
       WHERE branch_id = ?`,
      [
        branch_name, address, phone,
        email, city, is_active, id,
      ]
    );

    return successResponse(res, 'Branch updated! ✅');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
});

// ── ASSIGN VET TO BRANCH ──────────────────────────────────
router.post('/:id/vets', verifyToken, async (req, res) => {
  try {
    const { id }                         = req.params;
    const { vet_id, is_primary = false } = req.body;

    await db.query(
      `INSERT INTO vet_branches
         (vet_id, branch_id, is_primary)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_primary = ?`,
      [vet_id, id, is_primary, is_primary]
    );

    return successResponse(res, 'Vet assigned to branch! ✅');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
});

// ── REMOVE VET FROM BRANCH ────────────────────────────────
router.delete(
  '/:id/vets/:vetId', verifyToken, async (req, res) => {
    try {
      await db.query(
        `DELETE FROM vet_branches
         WHERE branch_id = ? AND vet_id = ?`,
        [req.params.id, req.params.vetId]
      );
      return successResponse(res, 'Vet removed from branch.');
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }
);

// ── PROMOTE TO BRANCH MANAGER ─────────────────────────────
router.put('/:id/promote', verifyToken, async (req, res) => {
  try {
    const { id }      = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return errorResponse(res, 'user_id is required.', 400);
    }

    await db.query(
      `UPDATE users
       SET branch_role = 'Branch_Manager',
           branch_id   = ?
       WHERE user_id = ?`,
      [id, user_id]
    );

    return successResponse(
      res, '👑 Branch Manager assigned!'
    );
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
});

// ── DEMOTE FROM BRANCH MANAGER ────────────────────────────
router.put('/:id/demote', verifyToken, async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return errorResponse(res, 'user_id is required.', 400);
    }

    await db.query(
      `UPDATE users
       SET branch_role = role
       WHERE user_id = ?`,
      [user_id]
    );

    return successResponse(res, 'Branch Manager removed.');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
});

module.exports = router;
*/