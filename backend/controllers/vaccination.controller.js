const { Vaccination, Pet, PetOwner, User } = require('../models');
const { success, error, notFound } = require('../utils/responseHandler');
const securityLogger = require('../utils/securityLogger');
const { sendVaccinationReminder } = require('../utils/emailService');
const { Op } = require('sequelize');

/**
 * Get all vaccinations
 * GET /api/vaccinations
 */
const getAllVaccinations = async (req, res) => {
  try {
    const { page = 1, limit = 10, petId, vetId, vaccineType } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (petId) where.pet_id = petId;
    if (vetId) where.vet_id = vetId;
    if (vaccineType) where.vaccine_type = vaccineType;

    // If user is Owner, only show their pets' vaccinations
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

    const { count, rows: vaccinations } = await Vaccination.findAndCountAll({
      where,
      include: [
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'pet_name', 'species']
        },
        {
          model: User,
          as: 'veterinarian',
          attributes: ['user_id', 'full_name']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['given_date', 'DESC']]
    });

    return success(res, {
      vaccinations,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    }, 'Vaccinations retrieved successfully');

  } catch (err) {
    securityLogger.error('Get all vaccinations error', { error: err.message });
    return error(res, 'Failed to retrieve vaccinations', 500);
  }
};

/**
 * Get vaccination by ID
 * GET /api/vaccinations/:id
 */
const getVaccinationById = async (req, res) => {
  try {
    const { id } = req.params;

    const vaccination = await Vaccination.findByPk(id, {
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
        }
      ]
    });

    if (!vaccination) {
      return notFound(res, 'Vaccination');
    }

    return success(res, { vaccination }, 'Vaccination retrieved successfully');

  } catch (err) {
    securityLogger.error('Get vaccination by ID error', { error: err.message });
    return error(res, 'Failed to retrieve vaccination', 500);
  }
};

/**
 * Create vaccination
 * POST /api/vaccinations
 */
const createVaccination = async (req, res) => {
  try {
    const {
      pet_id,
      vaccine_name,
      vaccine_type,
      given_date,
      next_due_date,
      batch_number,
      manufacturer,
      vet_id,
      notes
    } = req.body;

    // Verify pet exists
    const pet = await Pet.findByPk(pet_id, {
      include: [
        {
          model: PetOwner,
          as: 'owner',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
        timestamp: new Date().toISOString()
      });
    }

    // Use authenticated vet's ID if not provided
    const finalVetId = vet_id || req.user.id;

    // Create vaccination
    const vaccination = await Vaccination.create({
      pet_id,
      vaccine_name,
      vaccine_type: vaccine_type || 'Core',
      given_date: given_date || new Date(),
      next_due_date,
      batch_number,
      manufacturer,
      vet_id: finalVetId,
      notes
    });

    // Reload with associations
    const createdVaccination = await Vaccination.findByPk(vaccination.vaccination_id, {
      include: [
        { model: Pet, as: 'pet', attributes: ['pet_name'] },
        { model: User, as: 'veterinarian', attributes: ['full_name'] }
      ]
    });

    securityLogger.info('Vaccination created', {
      createdBy: req.user.id,
      vaccinationId: vaccination.vaccination_id,
      petId: pet_id
    });

    return success(res, { vaccination: createdVaccination }, 'Vaccination recorded successfully', 201);

  } catch (err) {
    securityLogger.error('Create vaccination error', { error: err.message });
    return error(res, 'Failed to record vaccination', 500);
  }
};

/**
 * Update vaccination
 * PUT /api/vaccinations/:id
 */
const updateVaccination = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vaccine_name,
      vaccine_type,
      given_date,
      next_due_date,
      batch_number,
      manufacturer,
      notes
    } = req.body;

    const vaccination = await Vaccination.findByPk(id);
    if (!vaccination) {
      return notFound(res, 'Vaccination');
    }

    await Vaccination.update(
      {
        vaccine_name,
        vaccine_type,
        given_date,
        next_due_date,
        batch_number,
        manufacturer,
        notes
      },
      { where: { vaccination_id: id } }
    );

    const updatedVaccination = await Vaccination.findByPk(id, {
      include: [
        { model: Pet, as: 'pet' },
        { model: User, as: 'veterinarian' }
      ]
    });

    securityLogger.info('Vaccination updated', {
      updatedBy: req.user.id,
      vaccinationId: id
    });

    return success(res, { vaccination: updatedVaccination }, 'Vaccination updated successfully');

  } catch (err) {
    securityLogger.error('Update vaccination error', { error: err.message });
    return error(res, 'Failed to update vaccination', 500);
  }
};

/**
 * Delete vaccination
 * DELETE /api/vaccinations/:id
 */
const deleteVaccination = async (req, res) => {
  try {
    const { id } = req.params;

    const vaccination = await Vaccination.findByPk(id);
    if (!vaccination) {
      return notFound(res, 'Vaccination');
    }

    await Vaccination.destroy({ where: { vaccination_id: id } });

    securityLogger.warn('Vaccination deleted', {
      deletedBy: req.user.id,
      vaccinationId: id
    });

    return success(res, null, 'Vaccination deleted successfully');

  } catch (err) {
    securityLogger.error('Delete vaccination error', { error: err.message });
    return error(res, 'Failed to delete vaccination', 500);
  }
};

/**
 * Get vaccinations by pet
 * GET /api/vaccinations/pet/:petId
 */
const getVaccinationsByPet = async (req, res) => {
  try {
    const { petId } = req.params;

    const vaccinations = await Vaccination.findAll({
      where: { pet_id: petId },
      include: [
        {
          model: User,
          as: 'veterinarian',
          attributes: ['full_name']
        }
      ],
      order: [['given_date', 'DESC']]
    });

    return success(res, { vaccinations }, 'Vaccinations retrieved successfully');

  } catch (err) {
    securityLogger.error('Get vaccinations by pet error', { error: err.message });
    return error(res, 'Failed to retrieve vaccinations', 500);
  }
};

/**
 * Get due vaccinations
 * GET /api/vaccinations/due
 */
const getDueVaccinations = async (req, res) => {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // Next 30 days

    const vaccinations = await Vaccination.findAll({
      where: {
        next_due_date: {
          [Op.between]: [today, futureDate]
        },
        reminder_sent: false
      },
      include: [
        {
          model: Pet,
          as: 'pet',
          include: [
            {
              model: PetOwner,
              as: 'owner',
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['full_name', 'email']
                }
              ]
            }
          ]
        }
      ],
      order: [['next_due_date', 'ASC']]
    });

    return success(res, { vaccinations, count: vaccinations.length }, 'Due vaccinations retrieved');

  } catch (err) {
    securityLogger.error('Get due vaccinations error', { error: err.message });
    return error(res, 'Failed to retrieve due vaccinations', 500);
  }
};

/**
 * Send vaccination reminders
 * POST /api/vaccinations/send-reminders
 */
const sendVaccinationReminders = async (req, res) => {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // Next 7 days

    const vaccinations = await Vaccination.findAll({
      where: {
        next_due_date: {
          [Op.between]: [today, futureDate]
        },
        reminder_sent: false
      },
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
        }
      ]
    });

    let sentCount = 0;

    for (const vaccination of vaccinations) {
      try {
        const ownerEmail = vaccination.pet.owner.user.email;
        const ownerName = vaccination.pet.owner.user.full_name;
        const petName = vaccination.pet.pet_name;

        await sendVaccinationReminder(
          ownerEmail,
          ownerName,
          petName,
          vaccination.vaccine_name,
          vaccination.next_due_date
        );

        // Mark as sent
        await Vaccination.update(
          { reminder_sent: true },
          { where: { vaccination_id: vaccination.vaccination_id } }
        );

        sentCount++;
      } catch (emailError) {
        console.error(`Failed to send reminder for vaccination ${vaccination.vaccination_id}:`, emailError);
      }
    }

    securityLogger.info('Vaccination reminders sent', {
      sentBy: req.user.id,
      count: sentCount
    });

    return success(res, { sentCount }, `${sentCount} vaccination reminders sent successfully`);

  } catch (err) {
    securityLogger.error('Send vaccination reminders error', { error: err.message });
    return error(res, 'Failed to send reminders', 500);
  }
};

module.exports = {
  getAllVaccinations,
  getVaccinationById,
  createVaccination,
  updateVaccination,
  deleteVaccination,
  getVaccinationsByPet,
  getDueVaccinations,
  sendVaccinationReminders
};