const db = require('../config/database');
const { success, error, notFound } = require('../utils/responseHandler');

const getAllMedicalRecords = async (req, res) => {
  try {
    const { page = 1, limit = 50, petId, vetId, visitType, startDate, endDate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
      SELECT mr.*, p.pet_name, p.species, p.breed,
        u.full_name as vet_name,
        owner_user.full_name as owner_name
      FROM medical_records mr
      LEFT JOIN pets p ON mr.pet_id = p.pet_id
      LEFT JOIN pet_owners po ON p.owner_id = po.owner_id
      LEFT JOIN users owner_user ON po.user_id = owner_user.user_id
      LEFT JOIN users u ON mr.vet_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (petId) { sql += ' AND mr.pet_id = ?'; params.push(petId); }
    if (vetId) { sql += ' AND mr.vet_id = ?'; params.push(vetId); }
    if (visitType) { sql += ' AND mr.visit_type = ?'; params.push(visitType); }
    if (startDate && endDate) { sql += ' AND mr.record_date BETWEEN ? AND ?'; params.push(startDate, endDate); }
    if (req.user.role === 'Owner') { sql += ' AND po.user_id = ?'; params.push(req.user.id); }

    const countSql = sql.replace(/SELECT[\s\S]+?FROM/, 'SELECT COUNT(*) as total FROM');
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0].total;

    sql += ' ORDER BY mr.record_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [records] = await db.query(sql, params);

    return success(res, {
      records,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
    }, 'Medical records retrieved successfully');
  } catch (err) {
    return error(res, 'Failed to retrieve medical records', 500);
  }
};

const getMedicalRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT mr.*, p.pet_name, p.species, p.breed,
        u.full_name as vet_name,
        owner_user.full_name as owner_name, owner_user.email as owner_email
      FROM medical_records mr
      LEFT JOIN pets p ON mr.pet_id = p.pet_id
      LEFT JOIN pet_owners po ON p.owner_id = po.owner_id
      LEFT JOIN users owner_user ON po.user_id = owner_user.user_id
      LEFT JOIN users u ON mr.vet_id = u.user_id
      WHERE mr.record_id = ?
    `, [id]);
    if (rows.length === 0) return notFound(res, 'Medical record');
    return success(res, { record: rows[0] }, 'Medical record retrieved successfully');
  } catch (err) {
    return error(res, 'Failed to retrieve medical record', 500);
  }
};

const createMedicalRecord = async (req, res) => {
  try {
    const {
      pet_id, vet_id, appointment_id, visit_type, diagnosis, symptoms,
      treatment, prescription, notes, record_date, next_visit_date
    } = req.body;

    const [petRows] = await db.query('SELECT pet_id FROM pets WHERE pet_id = ?', [pet_id]);
    if (petRows.length === 0) return res.status(404).json({ success: false, message: 'Pet not found' });

    const finalVetId = vet_id || req.user.id;

    const [result] = await db.query(
      `INSERT INTO medical_records (pet_id, vet_id, appointment_id, visit_type, diagnosis, symptoms, treatment, prescription, notes, record_date, next_visit_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pet_id, finalVetId, appointment_id || null, visit_type || 'Checkup', diagnosis, symptoms || null,
       treatment || null, prescription || null, notes || null, record_date || new Date(), next_visit_date || null]
    );

    const [rows] = await db.query(`
      SELECT mr.*, p.pet_name, p.species, u.full_name as vet_name
      FROM medical_records mr
      LEFT JOIN pets p ON mr.pet_id = p.pet_id
      LEFT JOIN users u ON mr.vet_id = u.user_id
      WHERE mr.record_id = ?
    `, [result.insertId]);

    return success(res, { record: rows[0] }, 'Medical record created successfully', 201);
  } catch (err) {
    return error(res, 'Failed to create medical record', 500);
  }
};

const updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { visit_type, diagnosis, symptoms, treatment, prescription, notes, next_visit_date } = req.body;

    const [existing] = await db.query('SELECT record_id FROM medical_records WHERE record_id = ?', [id]);
    if (existing.length === 0) return notFound(res, 'Medical record');

    const fields = [];
    const params = [];
    if (visit_type !== undefined) { fields.push('visit_type = ?'); params.push(visit_type); }
    if (diagnosis !== undefined) { fields.push('diagnosis = ?'); params.push(diagnosis); }
    if (symptoms !== undefined) { fields.push('symptoms = ?'); params.push(symptoms); }
    if (treatment !== undefined) { fields.push('treatment = ?'); params.push(treatment); }
    if (prescription !== undefined) { fields.push('prescription = ?'); params.push(prescription); }
    if (notes !== undefined) { fields.push('notes = ?'); params.push(notes); }
    if (next_visit_date !== undefined) { fields.push('next_visit_date = ?'); params.push(next_visit_date); }

    if (fields.length > 0) {
      params.push(id);
      await db.query(`UPDATE medical_records SET ${fields.join(', ')} WHERE record_id = ?`, params);
    }

    const [rows] = await db.query('SELECT * FROM medical_records WHERE record_id = ?', [id]);
    return success(res, { record: rows[0] }, 'Medical record updated successfully');
  } catch (err) {
    return error(res, 'Failed to update medical record', 500);
  }
};

const deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT record_id FROM medical_records WHERE record_id = ?', [id]);
    if (existing.length === 0) return notFound(res, 'Medical record');
    await db.query('DELETE FROM medical_records WHERE record_id = ?', [id]);
    return success(res, null, 'Medical record deleted successfully');
  } catch (err) {
    return error(res, 'Failed to delete medical record', 500);
  }
};

const getMedicalRecordsByPet = async (req, res) => {
  try {
    const { petId } = req.params;
    const [records] = await db.query(`
      SELECT mr.*, u.full_name as vet_name
      FROM medical_records mr
      LEFT JOIN users u ON mr.vet_id = u.user_id
      WHERE mr.pet_id = ?
      ORDER BY mr.record_date DESC
    `, [petId]);
    return success(res, { records }, 'Medical records retrieved successfully');
  } catch (err) {
    return error(res, 'Failed to retrieve medical records', 500);
  }
};

module.exports = {
  getAllMedicalRecords, getMedicalRecordById, createMedicalRecord,
  updateMedicalRecord, deleteMedicalRecord, getMedicalRecordsByPet
};
