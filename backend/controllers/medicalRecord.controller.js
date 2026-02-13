const { MedicalRecord, Pet, PetOwner, User, Appointment } = require('../models');
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