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
const { success, error, notFound } = require('../utils/responseHandler');
const securityLogger = require('../utils/securityLogger');
const { Op } = require('sequelize');

/**
 * Get all medical records
 * GET /api/medical-records
 */
const getAllMedicalRecords = async (req, res) => {
  try {
    const { page = 1, limit = 10, petId, vetId, visitType, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (petId) where.pet_id = petId;
    if (vetId) where.vet_id = vetId;
    if (visitType) where.visit_type = visitType;
    if (startDate && endDate) {
      where.record_date = {
        [Op.between]: [startDate, endDate]
      };
    }

    // If user is Owner, only show their pets' records
    if (req.user.role === 'Owner') {
      const owner = await PetOwner.findOne({ where: { user_id: req.user.id } });
      if (owner) {
        const pets = await Pet.findAll({
          where: { owner_id: owner.owner_id },
          attributes: ['pet_id']
        });
        where.pet_id = { [Op.in]: pets.map(p => p.pet_id) };
      }
    }

    const { count, rows: records } = await MedicalRecord.findAndCountAll({
      where,
      include: [
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'pet_name', 'species', 'breed']
        },
        {
          model: User,
          as: 'veterinarian',
          attributes: ['user_id', 'full_name']
        },
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['appointment_id', 'appointment_date', 'service_type']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['record_date', 'DESC']]
    });

    return success(res, {
      records,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    }, 'Medical records retrieved successfully');

  } catch (err) {
    securityLogger.error('Get all medical records error', { error: err.message });
    return error(res, 'Failed to retrieve medical records', 500);
  }
};

/**
 * Get medical record by ID
 * GET /api/medical-records/:id
 */
const getMedicalRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await MedicalRecord.findByPk(id, {
      include: [
        {
          model: Pet,
          as: 'pet',
          include: [
            {
              model: PetOwner,
              as: 'owner',
              include: [{ model: User, as: 'user' }]
            }
          ]
        },
        {
          model: User,
          as: 'veterinarian'
        },
        {
          model: Appointment,
          as: 'appointment'
        }
      ]
    });

    if (!record) {
      return notFound(res, 'Medical record');
    }

    securityLogger.logDataAccess(req.user.id, 'MedicalRecord', id, 'READ');

    return success(res, { record }, 'Medical record retrieved successfully');

  } catch (err) {
    securityLogger.error('Get medical record by ID error', { error: err.message });
    return error(res, 'Failed to retrieve medical record', 500);
  }
};

/**
 * Create medical record
 * POST /api/medical-records
 */
const createMedicalRecord = async (req, res) => {
  try {
    const {
      pet_id,
      vet_id,
      appointment_id,
      visit_type,
      diagnosis,
      symptoms,
      treatment,
      prescription,
      lab_results,
      record_date,
      next_visit_date,
      temperature,
      heart_rate,
      respiratory_rate
    } = req.body;

    // Verify pet exists
    const pet = await Pet.findByPk(pet_id);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
        timestamp: new Date().toISOString()
      });
    }

    // Use authenticated vet's ID if not provided
    const finalVetId = vet_id || req.user.id;

    // Create medical record
    const record = await MedicalRecord.create({
      pet_id,
      vet_id: finalVetId,
      appointment_id,
      visit_type: visit_type || 'Checkup',
      diagnosis,
      symptoms,
      treatment,
      prescription,
      lab_results,
      record_date: record_date || new Date(),
      next_visit_date,
      temperature,
      heart_rate,
      respiratory_rate
    });

    // Reload with associations
    const createdRecord = await MedicalRecord.findByPk(record.record_id, {
      include: [
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_name', 'species']
        },
        {
          model: User,
          as: 'veterinarian',
          attributes: ['full_name']
        }
      ]
    });

    securityLogger.info('Medical record created', {
      createdBy: req.user.id,
      recordId: record.record_id,
      petId: pet_id
    });

    return success(res, { record: createdRecord }, 'Medical record created successfully', 201);

  } catch (err) {
    securityLogger.error('Create medical record error', { error: err.message });
    return error(res, 'Failed to create medical record', 500);
  }
};

/**
 * Update medical record
 * PUT /api/medical-records/:id
 */
const updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      visit_type,
      diagnosis,
      symptoms,
      treatment,
      prescription,
      lab_results,
      next_visit_date,
      temperature,
      heart_rate,
      respiratory_rate
    } = req.body;

    const record = await MedicalRecord.findByPk(id);
    if (!record) {
      return notFound(res, 'Medical record');
    }

    // Update record
    await MedicalRecord.update(
      {
        visit_type,
        diagnosis,
        symptoms,
        treatment,
        prescription,
        lab_results,
        next_visit_date,
        temperature,
        heart_rate,
        respiratory_rate
      },
      { where: { record_id: id } }
    );

    const updatedRecord = await MedicalRecord.findByPk(id, {
      include: [
        { model: Pet, as: 'pet' },
        { model: User, as: 'veterinarian' }
      ]
    });

    securityLogger.info('Medical record updated', {
      updatedBy: req.user.id,
      recordId: id
    });

    return success(res, { record: updatedRecord }, 'Medical record updated successfully');

  } catch (err) {
    securityLogger.error('Update medical record error', { error: err.message });
    return error(res, 'Failed to update medical record', 500);
  }
};

/**
 * Delete medical record
 * DELETE /api/medical-records/:id
 */
const deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await MedicalRecord.findByPk(id);
    if (!record) {
      return notFound(res, 'Medical record');
    }

    await MedicalRecord.destroy({ where: { record_id: id } });

    securityLogger.warn('Medical record deleted', {
      deletedBy: req.user.id,
      recordId: id,
      petId: record.pet_id
    });

    return success(res, null, 'Medical record deleted successfully');

  } catch (err) {
    securityLogger.error('Delete medical record error', { error: err.message });
    return error(res, 'Failed to delete medical record', 500);
  }
};

/**
 * Get medical records by pet
 * GET /api/medical-records/pet/:petId
 */
const getMedicalRecordsByPet = async (req, res) => {
  try {
    const { petId } = req.params;

    const records = await MedicalRecord.findAll({
      where: { pet_id: petId },
      include: [
        {
          model: User,
          as: 'veterinarian',
          attributes: ['full_name']
        }
      ],
      order: [['record_date', 'DESC']]
    });

    return success(res, { records }, 'Medical records retrieved successfully');

  } catch (err) {
    securityLogger.error('Get medical records by pet error', { error: err.message });
    return error(res, 'Failed to retrieve medical records', 500);
  }
};

module.exports = {
  getAllMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  getMedicalRecordsByPet
};