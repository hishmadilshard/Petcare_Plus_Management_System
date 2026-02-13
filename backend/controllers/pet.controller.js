const { Pet, PetOwner, User, Appointment, MedicalRecord, Vaccination } = require('../models');
const { success, error, notFound } = require('../utils/responseHandler');
const securityLogger = require('../utils/securityLogger');
const { generatePetQRCode } = require('../utils/qrGenerator');
const { Op } = require('sequelize');

/**
 * Get all pets
 * GET /api/pets
 */
const getAllPets = async (req, res) => {
  try {
    const { page = 1, limit = 10, species, status, ownerId, search } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (species) where.species = species;
    if (status) where.status = status;
    if (ownerId) where.owner_id = ownerId;
    if (search) {
      where[Op.or] = [
        { pet_name: { [Op.like]: `%${search}%` } },
        { breed: { [Op.like]: `%${search}%` } },
        { microchip_id: { [Op.like]: `%${search}%` } }
      ];
    }

    // If user is Owner, only show their pets
    if (req.user.role === 'Owner') {
      const owner = await PetOwner.findOne({ where: { user_id: req.user.id } });
      if (owner) {
        where.owner_id = owner.owner_id;
      }
    }

    const { count, rows: pets } = await Pet.findAndCountAll({
      where,
      include: [
        {
          model: PetOwner,
          as: 'owner',
          attributes: ['owner_id', 'user_id'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['user_id', 'full_name', 'email', 'phone']
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    return success(res, {
      pets,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    }, 'Pets retrieved successfully');

  } catch (err) {
    securityLogger.error('Get all pets error', { error: err.message });
    return error(res, 'Failed to retrieve pets', 500);
  }
};

/**
 * Get pet by ID
 * GET /api/pets/:id
 */
const getPetById = async (req, res) => {
  try {
    const { id } = req.params;

    const pet = await Pet.findByPk(id, {
      include: [
        {
          model: PetOwner,
          as: 'owner',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['user_id', 'full_name', 'email', 'phone']
            }
          ]
        },
        {
          model: Appointment,
          as: 'appointments',
          limit: 5,
          order: [['appointment_date', 'DESC']],
          include: [
            {
              model: User,
              as: 'veterinarian',
              attributes: ['user_id', 'full_name']
            }
          ]
        },
        {
          model: MedicalRecord,
          as: 'medicalRecords',
          limit: 5,
          order: [['record_date', 'DESC']],
          include: [
            {
              model: User,
              as: 'veterinarian',
              attributes: ['user_id', 'full_name']
            }
          ]
        },
        {
          model: Vaccination,
          as: 'vaccinations',
          order: [['given_date', 'DESC']]
        }
      ]
    });

    if (!pet) {
      return notFound(res, 'Pet');
    }

    securityLogger.logDataAccess(req.user.id, 'Pet', id, 'READ');

    return success(res, { pet }, 'Pet retrieved successfully');

  } catch (err) {
    securityLogger.error('Get pet by ID error', { error: err.message, petId: req.params.id });
    return error(res, 'Failed to retrieve pet', 500);
  }
};

/**
 * Create new pet
 * POST /api/pets
 */
const createPet = async (req, res) => {
  try {
    const {
      owner_id,
      pet_name,
      species,
      breed,
      age,
      date_of_birth,
      gender,
      weight,
      color,
      microchip_id,
      special_notes,
      allergies
    } = req.body;

    // If user is Owner, use their owner_id
    let finalOwnerId = owner_id;
    if (req.user.role === 'Owner') {
      const owner = await PetOwner.findOne({ where: { user_id: req.user.id } });
      if (!owner) {
        return res.status(400).json({
          success: false,
          message: 'Owner profile not found',
          timestamp: new Date().toISOString()
        });
      }
      finalOwnerId = owner.owner_id;
    }

    // Verify owner exists
    const ownerExists = await PetOwner.findByPk(finalOwnerId);
    if (!ownerExists) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found',
        timestamp: new Date().toISOString()
      });
    }

    // Create pet
    const pet = await Pet.create({
      owner_id: finalOwnerId,
      pet_name,
      species,
      breed,
      age,
      date_of_birth,
      gender,
      weight,
      color,
      microchip_id,
      special_notes,
      allergies,
      status: 'Active'
    });

    // Generate QR code
    try {
      const qrResult = await generatePetQRCode(pet.pet_id, finalOwnerId, pet_name);
      await Pet.update(
        { qr_code: qrResult.qrIdentifier },
        { where: { pet_id: pet.pet_id } }
      );
      pet.qr_code = qrResult.qrIdentifier;
    } catch (qrError) {
      console.error('QR generation failed:', qrError);
      // Continue without QR code
    }

    // Reload with associations
    const createdPet = await Pet.findByPk(pet.pet_id, {
      include: [
        {
          model: PetOwner,
          as: 'owner',
          include: [{ model: User, as: 'user', attributes: ['full_name', 'email'] }]
        }
      ]
    });

    securityLogger.info('Pet created', {
      createdBy: req.user.id,
      petId: pet.pet_id,
      ownerId: finalOwnerId
    });

    return success(res, { pet: createdPet }, 'Pet registered successfully', 201);

  } catch (err) {
    securityLogger.error('Create pet error', { error: err.message });
    return error(res, 'Failed to register pet', 500);
  }
};

/**
 * Update pet
 * PUT /api/pets/:id
 */
const updatePet = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      pet_name,
      species,
      breed,
      age,
      date_of_birth,
      gender,
      weight,
      color,
      microchip_id,
      special_notes,
      allergies,
      status
    } = req.body;

    const pet = await Pet.findByPk(id);
    if (!pet) {
      return notFound(res, 'Pet');
    }

    // Update pet
    await Pet.update(
      {
        pet_name,
        species,
        breed,
        age,
        date_of_birth,
        gender,
        weight,
        color,
        microchip_id,
        special_notes,
        allergies,
        status
      },
      { where: { pet_id: id } }
    );

    const updatedPet = await Pet.findByPk(id, {
      include: [
        {
          model: PetOwner,
          as: 'owner',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });

    securityLogger.info('Pet updated', {
      updatedBy: req.user.id,
      petId: id
    });

    return success(res, { pet: updatedPet }, 'Pet updated successfully');

  } catch (err) {
    securityLogger.error('Update pet error', { error: err.message, petId: req.params.id });
    return error(res, 'Failed to update pet', 500);
  }
};

/**
 * Delete pet
 * DELETE /api/pets/:id
 */
const deletePet = async (req, res) => {
  try {
    const { id } = req.params;

    const pet = await Pet.findByPk(id);
    if (!pet) {
      return notFound(res, 'Pet');
    }

    // Soft delete by setting status to Inactive
    await Pet.update(
      { status: 'Inactive' },
      { where: { pet_id: id } }
    );

    securityLogger.warn('Pet deleted', {
      deletedBy: req.user.id,
      petId: id,
      petName: pet.pet_name
    });

    return success(res, null, 'Pet deleted successfully');

  } catch (err) {
    securityLogger.error('Delete pet error', { error: err.message, petId: req.params.id });
    return error(res, 'Failed to delete pet', 500);
  }
};

/**
 * Get pets by owner
 * GET /api/pets/owner/:ownerId
 */
const getPetsByOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;

    const pets = await Pet.findAll({
      where: { owner_id: ownerId, status: 'Active' },
      order: [['pet_name', 'ASC']]
    });

    return success(res, { pets }, 'Pets retrieved successfully');

  } catch (err) {
    securityLogger.error('Get pets by owner error', { error: err.message });
    return error(res, 'Failed to retrieve pets', 500);
  }
};

/**
 * Get pet's full medical history
 * GET /api/pets/:id/medical-history
 */
const getPetMedicalHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const pet = await Pet.findByPk(id, {
      include: [
        {
          model: MedicalRecord,
          as: 'medicalRecords',
          order: [['record_date', 'DESC']],
          include: [
            {
              model: User,
              as: 'veterinarian',
              attributes: ['full_name']
            }
          ]
        },
        {
          model: Vaccination,
          as: 'vaccinations',
          order: [['given_date', 'DESC']],
          include: [
            {
              model: User,
              as: 'veterinarian',
              attributes: ['full_name']
            }
          ]
        }
      ]
    });

    if (!pet) {
      return notFound(res, 'Pet');
    }

    securityLogger.logDataAccess(req.user.id, 'PetMedicalHistory', id, 'READ');

    return success(res, {
      petName: pet.pet_name,
      medicalRecords: pet.medicalRecords,
      vaccinations: pet.vaccinations
    }, 'Medical history retrieved successfully');

  } catch (err) {
    securityLogger.error('Get pet medical history error', { error: err.message });
    return error(res, 'Failed to retrieve medical history', 500);
  }
};

module.exports = {
  getAllPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
  getPetsByOwner,
  getPetMedicalHistory
};