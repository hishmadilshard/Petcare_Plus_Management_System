const db = require('../config/database');
const { success, error, notFound } = require('../utils/responseHandler');

const getAllAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, vetId, petId, date, startDate, endDate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
      SELECT 
        a.*,
        p.pet_name, p.species, p.breed,
        u.full_name as vet_name, u.email as vet_email, u.phone as vet_phone,
        owner_user.full_name as owner_name, owner_user.email as owner_email, owner_user.phone as owner_phone,
        po.owner_id
      FROM appointments a
      LEFT JOIN pets p ON a.pet_id = p.pet_id
      LEFT JOIN pet_owners po ON p.owner_id = po.owner_id
      LEFT JOIN users owner_user ON po.user_id = owner_user.user_id
      LEFT JOIN users u ON a.vet_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (status) { sql += ' AND a.status = ?'; params.push(status); }
    if (vetId) { sql += ' AND a.vet_id = ?'; params.push(vetId); }
    if (petId) { sql += ' AND a.pet_id = ?'; params.push(petId); }
    if (date) { sql += ' AND a.appointment_date = ?'; params.push(date); }
    if (startDate && endDate) { sql += ' AND a.appointment_date BETWEEN ? AND ?'; params.push(startDate, endDate); }

    if (req.user.role === 'Vet') {
      sql += ' AND a.vet_id = ?'; params.push(req.user.id);
    } else if (req.user.role === 'Owner') {
      sql += ' AND po.user_id = ?'; params.push(req.user.id);
    }

    const countSql = sql.replace(/SELECT[\s\S]+?FROM/, 'SELECT COUNT(*) as total FROM');
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0].total;

    sql += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [appointments] = await db.query(sql, params);

    return success(res, {
      appointments,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
    }, 'Appointments retrieved successfully');

  } catch (err) {
    return error(res, 'Failed to retrieve appointments', 500);
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT a.*, p.pet_name, p.species, p.breed,
        u.full_name as vet_name, u.email as vet_email, u.phone as vet_phone,
        owner_user.full_name as owner_name, owner_user.email as owner_email, owner_user.phone as owner_phone
      FROM appointments a
      LEFT JOIN pets p ON a.pet_id = p.pet_id
      LEFT JOIN pet_owners po ON p.owner_id = po.owner_id
      LEFT JOIN users owner_user ON po.user_id = owner_user.user_id
      LEFT JOIN users u ON a.vet_id = u.user_id
      WHERE a.appointment_id = ?
    `, [id]);

    if (rows.length === 0) return notFound(res, 'Appointment');
    return success(res, { appointment: rows[0] }, 'Appointment retrieved successfully');
  } catch (err) {
    return error(res, 'Failed to retrieve appointment', 500);
  }
};

const createAppointment = async (req, res) => {
  try {
    const { pet_id, vet_id, appointment_date, appointment_time, service_type, notes } = req.body;

    const [petRows] = await db.query('SELECT pet_id FROM pets WHERE pet_id = ?', [pet_id]);
    if (petRows.length === 0) return res.status(404).json({ success: false, message: 'Pet not found' });

    if (vet_id) {
      const [vetRows] = await db.query("SELECT user_id FROM users WHERE user_id = ? AND role = 'Vet' AND status = 'Active'", [vet_id]);
      if (vetRows.length === 0) return res.status(404).json({ success: false, message: 'Veterinarian not found or inactive' });
    }

    const [result] = await db.query(
      "INSERT INTO appointments (pet_id, vet_id, appointment_date, appointment_time, service_type, notes, status) VALUES (?, ?, ?, ?, ?, ?, 'Scheduled')",
      [pet_id, vet_id || null, appointment_date, appointment_time || null, service_type, notes || null]
    );

    const [rows] = await db.query(`
      SELECT a.*, p.pet_name, p.species, u.full_name as vet_name,
        owner_user.full_name as owner_name
      FROM appointments a
      LEFT JOIN pets p ON a.pet_id = p.pet_id
      LEFT JOIN pet_owners po ON p.owner_id = po.owner_id
      LEFT JOIN users owner_user ON po.user_id = owner_user.user_id
      LEFT JOIN users u ON a.vet_id = u.user_id
      WHERE a.appointment_id = ?
    `, [result.insertId]);

    return success(res, { appointment: rows[0] }, 'Appointment booked successfully', 201);
  } catch (err) {
    return error(res, 'Failed to create appointment', 500);
  }
};

const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_date, appointment_time, service_type, notes, status, vet_id } = req.body;

    const [existing] = await db.query('SELECT appointment_id FROM appointments WHERE appointment_id = ?', [id]);
    if (existing.length === 0) return notFound(res, 'Appointment');

    const fields = [];
    const params = [];
    if (appointment_date !== undefined) { fields.push('appointment_date = ?'); params.push(appointment_date); }
    if (appointment_time !== undefined) { fields.push('appointment_time = ?'); params.push(appointment_time); }
    if (service_type !== undefined) { fields.push('service_type = ?'); params.push(service_type); }
    if (notes !== undefined) { fields.push('notes = ?'); params.push(notes); }
    if (status !== undefined) { fields.push('status = ?'); params.push(status); }
    if (vet_id !== undefined) { fields.push('vet_id = ?'); params.push(vet_id); }

    if (fields.length > 0) {
      params.push(id);
      await db.query(`UPDATE appointments SET ${fields.join(', ')} WHERE appointment_id = ?`, params);
    }

    const [rows] = await db.query('SELECT * FROM appointments WHERE appointment_id = ?', [id]);
    return success(res, { appointment: rows[0] }, 'Appointment updated successfully');
  } catch (err) {
    return error(res, 'Failed to update appointment', 500);
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT appointment_id, status FROM appointments WHERE appointment_id = ?', [id]);
    if (existing.length === 0) return notFound(res, 'Appointment');
    if (existing[0].status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Appointment is already cancelled' });
    }
    await db.query("UPDATE appointments SET status = 'Cancelled' WHERE appointment_id = ?", [id]);
    return success(res, null, 'Appointment cancelled successfully');
  } catch (err) {
    return error(res, 'Failed to cancel appointment', 500);
  }
};

const completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT appointment_id FROM appointments WHERE appointment_id = ?', [id]);
    if (existing.length === 0) return notFound(res, 'Appointment');
    await db.query("UPDATE appointments SET status = 'Completed' WHERE appointment_id = ?", [id]);
    return success(res, null, 'Appointment marked as completed');
  } catch (err) {
    return error(res, 'Failed to complete appointment', 500);
  }
};

const getUpcomingAppointments = async (req, res) => {
  try {
    let sql = `
      SELECT a.*, p.pet_name, p.species, u.full_name as vet_name,
        owner_user.full_name as owner_name, owner_user.phone as owner_phone
      FROM appointments a
      LEFT JOIN pets p ON a.pet_id = p.pet_id
      LEFT JOIN pet_owners po ON p.owner_id = po.owner_id
      LEFT JOIN users owner_user ON po.user_id = owner_user.user_id
      LEFT JOIN users u ON a.vet_id = u.user_id
      WHERE a.appointment_date >= CURDATE() AND a.status IN ('Scheduled', 'Confirmed')
    `;
    const params = [];

    if (req.user.role === 'Vet') { sql += ' AND a.vet_id = ?'; params.push(req.user.id); }
    else if (req.user.role === 'Owner') { sql += ' AND po.user_id = ?'; params.push(req.user.id); }

    sql += ' ORDER BY a.appointment_date ASC, a.appointment_time ASC LIMIT 20';

    const [appointments] = await db.query(sql, params);
    return success(res, { appointments }, 'Upcoming appointments retrieved');
  } catch (err) {
    return error(res, 'Failed to retrieve upcoming appointments', 500);
  }
};

const getAppointmentsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const [appointments] = await db.query(`
      SELECT a.*, p.pet_name, p.species, u.full_name as vet_name,
        owner_user.full_name as owner_name
      FROM appointments a
      LEFT JOIN pets p ON a.pet_id = p.pet_id
      LEFT JOIN pet_owners po ON p.owner_id = po.owner_id
      LEFT JOIN users owner_user ON po.user_id = owner_user.user_id
      LEFT JOIN users u ON a.vet_id = u.user_id
      WHERE a.appointment_date = ? AND a.status != 'Cancelled'
      ORDER BY a.appointment_time ASC
    `, [date]);
    return success(res, { appointments, date }, 'Appointments retrieved');
  } catch (err) {
    return error(res, 'Failed to retrieve appointments', 500);
  }
};

module.exports = {
  getAllAppointments, getAppointmentById, createAppointment, updateAppointment,
  cancelAppointment, completeAppointment, getUpcomingAppointments, getAppointmentsByDate
};
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