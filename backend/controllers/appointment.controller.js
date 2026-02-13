const { Appointment, Pet, PetOwner, User } = require('../models');
const { success, error, notFound } = require('../utils/responseHandler');
const securityLogger = require('../utils/securityLogger');
const { sendAppointmentReminder } = require('../utils/emailService');
const { Op } = require('sequelize');

/**
 * Get all appointments
 * GET /api/appointments
 */
const getAllAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, vetId, petId, date, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (status) where.status = status;
    if (vetId) where.vet_id = vetId;
    if (petId) where.pet_id = petId;
    if (date) where.appointment_date = date;
    if (startDate && endDate) {
      where.appointment_date = {
        [Op.between]: [startDate, endDate]
      };
    }

    // If user is Owner, only show their pets' appointments
    if (req.user.role === 'Owner') {
      const owner = await PetOwner.findOne({ where: { user_id: req.user.id } });
      if (owner) {
        const pets = await Pet.findAll({
          where: { owner_id: owner.owner_id },
          attributes: ['pet_id']
        });
        const petIds = pets.map(p => p.pet_id);
        where.pet_id = { [Op.in]: petIds };
      }
    }

    // If user is Vet, show only their appointments
    if (req.user.role === 'Vet') {
      where.vet_id = req.user.id;
    }

    const { count, rows: appointments } = await Appointment.findAndCountAll({
      where,
      include: [
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'pet_name', 'species', 'breed'],
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
            }
          ]
        },
        {
          model: User,
          as: 'veterinarian',
          attributes: ['user_id', 'full_name', 'email', 'phone']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [
        ['appointment_date', 'DESC'],
        ['appointment_time', 'DESC']
      ]
    });

    return success(res, {
      appointments,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    }, 'Appointments retrieved successfully');

  } catch (err) {
    securityLogger.error('Get all appointments error', { error: err.message });
    return error(res, 'Failed to retrieve appointments', 500);
  }
};

/**
 * Get appointment by ID
 * GET /api/appointments/:id
 */
const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByPk(id, {
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
                  attributes: ['user_id', 'full_name', 'email', 'phone']
                }
              ]
            }
          ]
        },
        {
          model: User,
          as: 'veterinarian',
          attributes: ['user_id', 'full_name', 'email', 'phone']
        }
      ]
    });

    if (!appointment) {
      return notFound(res, 'Appointment');
    }

    securityLogger.logDataAccess(req.user.id, 'Appointment', id, 'READ');

    return success(res, { appointment }, 'Appointment retrieved successfully');

  } catch (err) {
    securityLogger.error('Get appointment by ID error', { error: err.message });
    return error(res, 'Failed to retrieve appointment', 500);
  }
};

/**
 * Create new appointment
 * POST /api/appointments
 */
const createAppointment = async (req, res) => {
  try {
    const {
      pet_id,
      vet_id,
      appointment_date,
      appointment_time,
      service_type,
      duration_minutes,
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

    // Verify veterinarian exists
    const vet = await User.findOne({
      where: { user_id: vet_id, role: 'Vet', status: 'Active' }
    });

    if (!vet) {
      return res.status(404).json({
        success: false,
        message: 'Veterinarian not found or inactive',
        timestamp: new Date().toISOString()
      });
    }

    // Check for appointment conflicts
    const conflict = await Appointment.findOne({
      where: {
        vet_id,
        appointment_date,
        appointment_time,
        status: { [Op.notIn]: ['Cancelled', 'Completed'] }
      }
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked',
        timestamp: new Date().toISOString()
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      pet_id,
      vet_id,
      appointment_date,
      appointment_time,
      service_type,
      duration_minutes: duration_minutes || 30,
      notes,
      status: 'Scheduled'
    });

    // Reload with associations
    const createdAppointment = await Appointment.findByPk(appointment.appointment_id, {
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

    // Send confirmation email (async, don't wait)
    const ownerEmail = pet.owner.user.email;
    const ownerName = pet.owner.user.full_name;
    sendAppointmentReminder(
      ownerEmail,
      ownerName,
      pet.pet_name,
      appointment_date,
      appointment_time,
      vet.full_name
    ).catch(err => console.error('Email sending failed:', err));

    securityLogger.info('Appointment created', {
      createdBy: req.user.id,
      appointmentId: appointment.appointment_id,
      petId: pet_id,
      vetId: vet_id
    });

    return success(res, { appointment: createdAppointment }, 'Appointment booked successfully', 201);

  } catch (err) {
    securityLogger.error('Create appointment error', { error: err.message });
    return error(res, 'Failed to create appointment', 500);
  }
};

/**
 * Update appointment
 * PUT /api/appointments/:id
 */
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      appointment_date,
      appointment_time,
      service_type,
      duration_minutes,
      notes,
      status
    } = req.body;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return notFound(res, 'Appointment');
    }

    // If changing date/time, check for conflicts
    if ((appointment_date || appointment_time) && status !== 'Cancelled') {
      const newDate = appointment_date || appointment.appointment_date;
      const newTime = appointment_time || appointment.appointment_time;

      const conflict = await Appointment.findOne({
        where: {
          appointment_id: { [Op.ne]: id },
          vet_id: appointment.vet_id,
          appointment_date: newDate,
          appointment_time: newTime,
          status: { [Op.notIn]: ['Cancelled', 'Completed'] }
        }
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: 'This time slot is already booked',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Update appointment
    await Appointment.update(
      {
        appointment_date,
        appointment_time,
        service_type,
        duration_minutes,
        notes,
        status
      },
      { where: { appointment_id: id } }
    );

    const updatedAppointment = await Appointment.findByPk(id, {
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

    securityLogger.info('Appointment updated', {
      updatedBy: req.user.id,
      appointmentId: id,
      newStatus: status
    });

    return success(res, { appointment: updatedAppointment }, 'Appointment updated successfully');

  } catch (err) {
    securityLogger.error('Update appointment error', { error: err.message });
    return error(res, 'Failed to update appointment', 500);
  }
};

/**
 * Cancel appointment
 * PUT /api/appointments/:id/cancel
 */
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return notFound(res, 'Appointment');
    }

    if (appointment.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled',
        timestamp: new Date().toISOString()
      });
    }

    // Update status to Cancelled
    await Appointment.update(
      {
        status: 'Cancelled',
        cancellation_reason
      },
      { where: { appointment_id: id } }
    );

    securityLogger.info('Appointment cancelled', {
      cancelledBy: req.user.id,
      appointmentId: id,
      reason: cancellation_reason
    });

    return success(res, null, 'Appointment cancelled successfully');

  } catch (err) {
    securityLogger.error('Cancel appointment error', { error: err.message });
    return error(res, 'Failed to cancel appointment', 500);
  }
};

/**
 * Complete appointment
 * PUT /api/appointments/:id/complete
 */
const completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return notFound(res, 'Appointment');
    }

    await Appointment.update(
      { status: 'Completed' },
      { where: { appointment_id: id } }
    );

    securityLogger.info('Appointment completed', {
      completedBy: req.user.id,
      appointmentId: id
    });

    return success(res, null, 'Appointment marked as completed');

  } catch (err) {
    securityLogger.error('Complete appointment error', { error: err.message });
    return error(res, 'Failed to complete appointment', 500);
  }
};

/**
 * Get upcoming appointments
 * GET /api/appointments/upcoming
 */
const getUpcomingAppointments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where = {
      appointment_date: { [Op.gte]: today },
      status: { [Op.in]: ['Scheduled', 'Confirmed'] }
    };

    // Filter by user role
    if (req.user.role === 'Owner') {
      const owner = await PetOwner.findOne({ where: { user_id: req.user.id } });
      if (owner) {
        const pets = await Pet.findAll({
          where: { owner_id: owner.owner_id },
          attributes: ['pet_id']
        });
        where.pet_id = { [Op.in]: pets.map(p => p.pet_id) };
      }
    } else if (req.user.role === 'Vet') {
      where.vet_id = req.user.id;
    }

    const appointments = await Appointment.findAll({
      where,
      include: [
        {
          model: Pet,
          as: 'pet',
          include: [
            {
              model: PetOwner,
              as: 'owner',
              include: [{ model: User, as: 'user', attributes: ['full_name', 'phone'] }]
            }
          ]
        },
        {
          model: User,
          as: 'veterinarian',
          attributes: ['full_name']
        }
      ],
      order: [
        ['appointment_date', 'ASC'],
        ['appointment_time', 'ASC']
      ],
      limit: 20
    });

    return success(res, { appointments }, 'Upcoming appointments retrieved');

  } catch (err) {
    securityLogger.error('Get upcoming appointments error', { error: err.message });
    return error(res, 'Failed to retrieve upcoming appointments', 500);
  }
};

/**
 * Get appointments by date
 * GET /api/appointments/date/:date
 */
const getAppointmentsByDate = async (req, res) => {
  try {
    const { date } = req.params;

    const appointments = await Appointment.findAll({
      where: {
        appointment_date: date,
        status: { [Op.notIn]: ['Cancelled'] }
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
        },
        {
          model: User,
          as: 'veterinarian',
          attributes: ['full_name']
        }
      ],
      order: [['appointment_time', 'ASC']]
    });

    return success(res, { appointments, date }, 'Appointments retrieved');

  } catch (err) {
    securityLogger.error('Get appointments by date error', { error: err.message });
    return error(res, 'Failed to retrieve appointments', 500);
  }
};

module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  completeAppointment,
  getUpcomingAppointments,
  getAppointmentsByDate
};