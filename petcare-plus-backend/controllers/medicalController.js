const db = require('../config/db');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// ── GET MEDICAL RECORDS BY PET ────────────────────────────
const getMedicalRecordsByPet = async (req, res) => {
  try {
    const { pet_id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM medical_records WHERE pet_id = ?',
      [pet_id]
    );
    const total = countResult[0].total;

    const [records] = await db.query(
      `SELECT 
        mr.*,
        p.pet_name, p.species,
        u.full_name AS vet_name
       FROM medical_records mr
       JOIN pets p ON mr.pet_id = p.pet_id
       JOIN users u ON mr.vet_id = u.user_id
       WHERE mr.pet_id = ?
       ORDER BY mr.record_date DESC
       LIMIT ? OFFSET ?`,
      [pet_id, parseInt(limit), parseInt(offset)]
    );

    return paginatedResponse(res, 'Medical records fetched.', records, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get medical records error:', error);
    return errorResponse(res, 'Failed to fetch records. ' + error.message, 500);
  }
};

// ── GET SINGLE MEDICAL RECORD ─────────────────────────────
const getMedicalRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const [records] = await db.query(
      `SELECT 
        mr.*,
        p.pet_name, p.species, p.breed,
        u.full_name AS vet_name
       FROM medical_records mr
       JOIN pets p ON mr.pet_id = p.pet_id
       JOIN users u ON mr.vet_id = u.user_id
       WHERE mr.record_id = ?`,
      [id]
    );
    if (records.length === 0) {
      return errorResponse(res, 'Record not found.', 404);
    }
    return successResponse(res, 'Record fetched.', records[0]);
  } catch (error) {
    console.error('Get record error:', error);
    return errorResponse(res, 'Failed to fetch record.', 500);
  }
};

// ── CREATE MEDICAL RECORD ─────────────────────────────────
const createMedicalRecord = async (req, res) => {
  try {
    const {
      pet_id, vet_id,
      diagnosis, symptoms, treatment,
      prescriptions, lab_results,
      follow_up_notes, record_date, next_due_date,
    } = req.body;

    // Validate required fields
    if (!pet_id || !diagnosis || !treatment || !record_date) {
      return errorResponse(
        res, 'Pet, diagnosis, treatment and date are required.', 400
      );
    }

    // Use logged-in user as vet if not provided
    const vetId = vet_id && vet_id !== ''
      ? parseInt(vet_id)
      : req.user.user_id;

    // Clean optional fields
    const nextDue = next_due_date && next_due_date !== ''
      ? next_due_date : null;

    // Check pet exists
    const [pet] = await db.query(
      'SELECT pet_id FROM pets WHERE pet_id = ?', [pet_id]
    );
    if (pet.length === 0) {
      return errorResponse(res, 'Pet not found.', 404);
    }

    // Insert record — appointment_id always null
    const [result] = await db.query(
      `INSERT INTO medical_records
        (pet_id, vet_id, appointment_id, diagnosis, symptoms,
         treatment, prescriptions, lab_results,
         follow_up_notes, record_date, next_due_date)
       VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parseInt(pet_id),
        vetId,
        diagnosis,
        symptoms        || null,
        treatment,
        prescriptions   || null,
        lab_results     || null,
        follow_up_notes || null,
        record_date,
        nextDue,
      ]
    );

    return successResponse(
      res, 'Medical record created! 🏥',
      { record_id: result.insertId }, 201
    );
  } catch (error) {
    console.error('Create medical record error:', error);
    return errorResponse(
      res, 'Failed to create record. ' + error.message, 500
    );
  }
};

// ── UPDATE MEDICAL RECORD ─────────────────────────────────
const updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      diagnosis, symptoms, treatment,
      prescriptions, lab_results,
      follow_up_notes, record_date, next_due_date,
    } = req.body;

    const [existing] = await db.query(
      'SELECT * FROM medical_records WHERE record_id = ?', [id]
    );
    if (existing.length === 0) {
      return errorResponse(res, 'Record not found.', 404);
    }

    // Clean optional fields
    const nextDue = next_due_date && next_due_date !== ''
      ? next_due_date : null;

    await db.query(
      `UPDATE medical_records SET
        diagnosis       = COALESCE(?, diagnosis),
        symptoms        = COALESCE(?, symptoms),
        treatment       = COALESCE(?, treatment),
        prescriptions   = COALESCE(?, prescriptions),
        lab_results     = COALESCE(?, lab_results),
        follow_up_notes = COALESCE(?, follow_up_notes),
        record_date     = COALESCE(?, record_date),
        next_due_date   = ?
       WHERE record_id = ?`,
      [
        diagnosis,
        symptoms        || null,
        treatment,
        prescriptions   || null,
        lab_results     || null,
        follow_up_notes || null,
        record_date,
        nextDue,
        id,
      ]
    );

    return successResponse(res, 'Medical record updated! ✅');
  } catch (error) {
    console.error('Update record error:', error);
    return errorResponse(res, 'Failed to update record. ' + error.message, 500);
  }
};

// ── DELETE MEDICAL RECORD ─────────────────────────────────
const deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query(
      'SELECT * FROM medical_records WHERE record_id = ?', [id]
    );
    if (existing.length === 0) {
      return errorResponse(res, 'Record not found.', 404);
    }
    await db.query(
      'DELETE FROM medical_records WHERE record_id = ?', [id]
    );
    return successResponse(res, 'Record deleted.');
  } catch (error) {
    console.error('Delete record error:', error);
    return errorResponse(res, 'Failed to delete record.', 500);
  }
};

module.exports = {
  getMedicalRecordsByPet,
  getMedicalRecordById,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
};