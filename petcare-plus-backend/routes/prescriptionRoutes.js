const express    = require('express');
const router     = express.Router();
const db         = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { successResponse, errorResponse,
  paginatedResponse } = require('../utils/response');

// ── GET ALL ───────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let where  = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ` AND (p.pet_name LIKE ? OR u.full_name LIKE ?
        OR pr.prescription_number LIKE ?)`;
      params.push(
        `%${search}%`, `%${search}%`, `%${search}%`
      );
    }
    if (status) {
      where += ' AND pr.status = ?';
      params.push(status);
    }

    const base = `
      FROM prescriptions pr
      JOIN pets p        ON pr.pet_id  = p.pet_id
      JOIN pet_owners po ON p.owner_id = po.owner_id
      JOIN users u       ON po.user_id = u.user_id
      JOIN users v       ON pr.vet_id  = v.user_id
      ${where}
    `;

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total ${base}`, params
    );

    const [rows] = await db.query(
      `SELECT
        pr.*,
        p.pet_name, p.species, p.breed,
        u.full_name AS owner_name,
        u.phone     AS owner_phone,
        v.full_name AS vet_name,
        (SELECT COUNT(*) FROM prescription_items pi
         WHERE pi.prescription_id = pr.prescription_id
        ) AS medicine_count
       ${base}
       ORDER BY pr.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    // Attach items to each prescription
    for (const rx of rows) {
      const [items] = await db.query(
        `SELECT pi.*, i.item_name AS medicine_name,
           i.strength, i.dosage_form
         FROM prescription_items pi
         JOIN inventory i ON pi.medicine_id = i.item_id
         WHERE pi.prescription_id = ?`,
        [rx.prescription_id]
      );
      rx.items = items;
    }

    return paginatedResponse(
      res, 'Prescriptions fetched.', rows,
      { total, page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit) }
    );
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
});

// ── CREATE ────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      pet_id, vet_id, diagnosis, instructions,
      follow_up_date, issue_date, status = 'Active',
      items = [],
    } = req.body;

    // Generate Rx number
    const now    = new Date();
    const ym     = `${now.getFullYear()}${
      String(now.getMonth()+1).padStart(2,'0')}`;
    const [[last]] = await db.query(
      `SELECT prescription_number FROM prescriptions
       WHERE prescription_number LIKE ?
       ORDER BY prescription_id DESC LIMIT 1`,
      [`RX-${ym}-%`]
    );
    const lastNum = last
      ? parseInt(last.prescription_number.split('-')[2]) : 0;
    const rxNum = `RX-${ym}-${
      String(lastNum + 1).padStart(4,'0')}`;

    const [result] = await db.query(
      `INSERT INTO prescriptions
        (pet_id, vet_id, prescription_number, diagnosis,
         instructions, follow_up_date, issue_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pet_id,
        vet_id || req.user.user_id,
        rxNum,
        diagnosis,
        instructions || null,
        follow_up_date || null,
        issue_date || new Date().toISOString().split('T')[0],
        status,
      ]
    );

    const rxId = result.insertId;

    // Insert items
    for (const item of items) {
      await db.query(
        `INSERT INTO prescription_items
          (prescription_id, medicine_id, dosage,
           frequency, duration, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          rxId, item.medicine_id,
          item.dosage    || null,
          item.frequency || null,
          item.duration  || null,
          item.notes     || null,
        ]
      );
    }

    return successResponse(
      res, `💊 Prescription ${rxNum} created!`,
      { prescription_id: rxId, prescription_number: rxNum }, 201
    );
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
});

// ── UPDATE ────────────────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      diagnosis, instructions, follow_up_date,
      status, items = [],
    } = req.body;

    await db.query(
      `UPDATE prescriptions SET
        diagnosis      = COALESCE(?, diagnosis),
        instructions   = COALESCE(?, instructions),
        follow_up_date = ?,
        status         = COALESCE(?, status)
       WHERE prescription_id = ?`,
      [
        diagnosis, instructions,
        follow_up_date || null,
        status, id,
      ]
    );

    // Replace items
    await db.query(
      'DELETE FROM prescription_items WHERE prescription_id = ?',
      [id]
    );
    for (const item of items) {
      await db.query(
        `INSERT INTO prescription_items
          (prescription_id, medicine_id, dosage,
           frequency, duration, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id, item.medicine_id,
          item.dosage    || null,
          item.frequency || null,
          item.duration  || null,
          item.notes     || null,
        ]
      );
    }

    return successResponse(res, 'Prescription updated! ✅');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
});

// ── DELETE ────────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM prescription_items WHERE prescription_id=?',
      [req.params.id]
    );
    await db.query(
      'DELETE FROM prescriptions WHERE prescription_id=?',
      [req.params.id]
    );
    return successResponse(res, 'Prescription deleted.');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
});

module.exports = router;