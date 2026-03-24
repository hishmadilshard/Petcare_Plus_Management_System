const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const {
  successResponse, errorResponse,
} = require('../utils/response');

// ── GET care instructions for a pet ──────────────────────
router.get('/:pet_id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM pet_care_instructions WHERE pet_id = ?',
      [req.params.pet_id]
    );
    return successResponse(
      res, 'Care instructions fetched.',
      rows[0] || null
    );
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
});

// ── SAVE (upsert) care instructions ──────────────────────
router.post('/:pet_id', verifyToken, async (req, res) => {
  try {
    const { pet_id } = req.params;
    const {
      food_type, food_brand, feeding_amount,
      feeding_frequency, feeding_times, special_diet,
      current_medications,
      grooming_notes, exercise_notes,
      behaviour_notes, other_notes, known_allergies,
    } = req.body;

    // Check if exists
    const [existing] = await db.query(
      'SELECT care_id FROM pet_care_instructions WHERE pet_id = ?',
      [pet_id]
    );

    if (existing.length > 0) {
      await db.query(
        `UPDATE pet_care_instructions SET
          food_type           = ?,
          food_brand          = ?,
          feeding_amount      = ?,
          feeding_frequency   = ?,
          feeding_times       = ?,
          special_diet        = ?,
          current_medications = ?,
          grooming_notes      = ?,
          exercise_notes      = ?,
          behaviour_notes     = ?,
          other_notes         = ?,
          known_allergies     = ?
         WHERE pet_id = ?`,
        [
          food_type || null, food_brand || null,
          feeding_amount || null, feeding_frequency || null,
          feeding_times || null, special_diet || null,
          current_medications || null,
          grooming_notes || null, exercise_notes || null,
          behaviour_notes || null, other_notes || null,
          known_allergies || null,
          pet_id,
        ]
      );
    } else {
      await db.query(
        `INSERT INTO pet_care_instructions
          (pet_id, food_type, food_brand, feeding_amount,
           feeding_frequency, feeding_times, special_diet,
           current_medications, grooming_notes, exercise_notes,
           behaviour_notes, other_notes, known_allergies)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          pet_id,
          food_type || null, food_brand || null,
          feeding_amount || null, feeding_frequency || null,
          feeding_times || null, special_diet || null,
          current_medications || null,
          grooming_notes || null, exercise_notes || null,
          behaviour_notes || null, other_notes || null,
          known_allergies || null,
        ]
      );
    }

    return successResponse(
      res, '✅ Care instructions saved!'
    );
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
});

module.exports = router;