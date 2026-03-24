const db = require('../config/db');
const {
  successResponse, errorResponse, paginatedResponse,
} = require('../utils/response');
const {
  getBranchFilterWithAlias,
} = require('../utils/branchFilter');

// ── GET ALL APPOINTMENTS ──────────────────────────────────
const getAllAppointments = async (req, res) => {
  try {
    const {
      date, status, vet_id, page = 1, limit = 10,
    } = req.query;
    const offset = (page - 1) * limit;

    const { clause: branchClause, params: branchParams }
      = getBranchFilterWithAlias(req.user, 'a');

    let where  = `WHERE 1=1 ${branchClause}`;
    const params = [...branchParams];

    if (req.user.role === 'Owner') {
      where += ' AND po.user_id = ?';
      params.push(req.user.user_id);
    }
    if (date) {
      where += ' AND a.appointment_date = ?';
      params.push(date);
    }
    if (status) {
      where += ' AND a.status = ?';
      params.push(status);
    }
    if (vet_id) {
      where += ' AND a.vet_id = ?';
      params.push(vet_id);
    }

    const baseFrom = `
      FROM appointments a
      JOIN pets p         ON a.pet_id = p.pet_id
      JOIN pet_owners po  ON a.owner_id = po.owner_id
      JOIN users u_owner  ON po.user_id = u_owner.user_id
      JOIN users u_vet    ON a.vet_id = u_vet.user_id
      ${where}
    `;

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total ${baseFrom}`, params
    );
    const total = countResult[0].total;

    const [appointments] = await db.query(
      `SELECT
         a.*,
         p.pet_name, p.species, p.breed,
         u_owner.full_name AS owner_name,
         u_owner.phone     AS owner_phone,
         u_vet.full_name   AS vet_name
       ${baseFrom}
       ORDER BY a.appointment_date DESC,
                a.appointment_time ASC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return paginatedResponse(
      res, 'Appointments fetched successfully.', appointments,
      {
        total,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(total / limit),
      }
    );

  } catch (error) {
    console.error('Get appointments error:', error);
    return errorResponse(
      res, 'Failed to fetch appointments.', 500
    );
  }
};

// ── GET TODAY'S APPOINTMENTS ──────────────────────────────
const getTodayAppointments = async (req, res) => {
  try {
    const { clause: branchClause, params: branchParams }
      = getBranchFilterWithAlias(req.user, 'a');

    const [appointments] = await db.query(
      `SELECT
         a.*,
         p.pet_name, p.species, p.breed,
         u_owner.full_name AS owner_name,
         u_owner.phone     AS owner_phone,
         u_vet.full_name   AS vet_name
       FROM appointments a
       JOIN pets p        ON a.pet_id = p.pet_id
       JOIN pet_owners po ON a.owner_id = po.owner_id
       JOIN users u_owner ON po.user_id = u_owner.user_id
       JOIN users u_vet   ON a.vet_id = u_vet.user_id
       WHERE a.appointment_date = CURDATE()
       ${branchClause}
       ORDER BY a.appointment_time ASC`,
      branchParams
    );

    return successResponse(
      res, "Today's appointments fetched.", appointments
    );
  } catch (error) {
    console.error('Get today error:', error);
    return errorResponse(
      res, 'Failed to fetch today appointments.', 500
    );
  }
};

// ── GET SINGLE APPOINTMENT ────────────────────────────────
const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [appointments] = await db.query(
      `SELECT
         a.*,
         p.pet_name, p.species, p.breed,
         p.age, p.gender, p.allergies,
         u_owner.full_name AS owner_name,
         u_owner.phone     AS owner_phone,
         u_owner.email     AS owner_email,
         u_vet.full_name   AS vet_name,
         u_vet.phone       AS vet_phone
       FROM appointments a
       JOIN pets p        ON a.pet_id = p.pet_id
       JOIN pet_owners po ON a.owner_id = po.owner_id
       JOIN users u_owner ON po.user_id = u_owner.user_id
       JOIN users u_vet   ON a.vet_id = u_vet.user_id
       WHERE a.appointment_id = ?`,
      [id]
    );

    if (appointments.length === 0) {
      return errorResponse(res, 'Appointment not found.', 404);
    }
    return successResponse(
      res, 'Appointment fetched.', appointments[0]
    );
  } catch (error) {
    console.error('Get appointment error:', error);
    return errorResponse(
      res, 'Failed to fetch appointment.', 500
    );
  }
};

// ── CREATE APPOINTMENT ────────────────────────────────────
const createAppointment = async (req, res) => {
  try {
    const {
      pet_id, vet_id, owner_id,
      appointment_date, appointment_time,
      service_type, reason, notes,
    } = req.body;

    if (!pet_id || !vet_id || !owner_id ||
        !appointment_date || !appointment_time || !service_type) {
      return errorResponse(
        res,
        'Pet, vet, owner, date, time and service are required.',
        400
      );
    }

    // Conflict detection
    const [conflicts] = await db.query(
      `SELECT appointment_id FROM appointments
       WHERE vet_id = ?
         AND appointment_date = ?
         AND appointment_time = ?
         AND status NOT IN ('Cancelled','Completed')`,
      [vet_id, appointment_date, appointment_time]
    );
    if (conflicts.length > 0) {
      return errorResponse(
        res,
        'This time slot is already booked.',
        409
      );
    }

    // Calculate end time
    const timeParts   = String(appointment_time).split(':');
    const hours       = parseInt(timeParts[0]) || 0;
    const minutes     = parseInt(timeParts[1]) || 0;
    const totalMins   = hours * 60 + minutes + 30;
    const endHours    = Math.floor(totalMins / 60) % 24;
    const endMins     = totalMins % 60;
    const end_time    = `${String(endHours).padStart(2,'0')}:${
      String(endMins).padStart(2,'0')}:00`;

    // ✅ Assign to user's branch
    const branchId = req.user.branch_id || null;

    const [result] = await db.query(
      `INSERT INTO appointments
         (pet_id, vet_id, owner_id,
          appointment_date, appointment_time, end_time,
          service_type, reason, notes, status, branch_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Booked', ?)`,
      [
        pet_id, vet_id, owner_id,
        appointment_date, appointment_time, end_time,
        service_type,
        reason || null,
        notes  || null,
        branchId,
      ]
    );

    const [newAppointment] = await db.query(
      `SELECT a.*, p.pet_name, u.full_name AS vet_name
       FROM appointments a
       JOIN pets p  ON a.pet_id = p.pet_id
       JOIN users u ON a.vet_id = u.user_id
       WHERE a.appointment_id = ?`,
      [result.insertId]
    );

    // Notification (non-blocking)
    try {
      await db.query(
        `INSERT INTO notifications
           (user_id, title, message, type,
            notification_channel, status)
         SELECT u.user_id,
           'Appointment Confirmed! 🐾',
           CONCAT('Your appointment for ', p.pet_name,
             ' on ', ?, ' at ', ?, ' has been confirmed.'),
           'Appointment', 'App', 'Sent'
         FROM pet_owners po
         JOIN users u  ON po.user_id = u.user_id
         JOIN pets p   ON p.pet_id = ?
         WHERE po.owner_id = ?`,
        [appointment_date, appointment_time, pet_id, owner_id]
      );
    } catch (notifError) {
      console.log('Notification skipped:', notifError.message);
    }

    return successResponse(
      res, 'Appointment booked successfully! 📅',
      newAppointment[0], 201
    );

  } catch (error) {
    console.error('Create appointment error:', error);
    return errorResponse(
      res,
      'Failed to book appointment. ' + error.message,
      500
    );
  }
};

// ── UPDATE APPOINTMENT ────────────────────────────────────
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      appointment_date, appointment_time,
      service_type, reason, notes, status, vet_id,
    } = req.body;

    const [existing] = await db.query(
      'SELECT * FROM appointments WHERE appointment_id = ?', [id]
    );
    if (existing.length === 0) {
      return errorResponse(res, 'Appointment not found.', 404);
    }

    if (appointment_date || appointment_time || vet_id) {
      const checkVet  = vet_id             || existing[0].vet_id;
      const checkDate = appointment_date   || existing[0].appointment_date;
      const checkTime = appointment_time   || existing[0].appointment_time;

      const [conflicts] = await db.query(
        `SELECT appointment_id FROM appointments
         WHERE vet_id = ? AND appointment_date = ?
           AND appointment_time = ?
           AND status NOT IN ('Cancelled','Completed')
           AND appointment_id != ?`,
        [checkVet, checkDate, checkTime, id]
      );
      if (conflicts.length > 0) {
        return errorResponse(
          res, 'Time slot already booked.', 409
        );
      }
    }

    await db.query(
      `UPDATE appointments SET
         appointment_date = COALESCE(?, appointment_date),
         appointment_time = COALESCE(?, appointment_time),
         service_type     = COALESCE(?, service_type),
         reason           = COALESCE(?, reason),
         notes            = COALESCE(?, notes),
         status           = COALESCE(?, status),
         vet_id           = COALESCE(?, vet_id)
       WHERE appointment_id = ?`,
      [
        appointment_date, appointment_time,
        service_type, reason, notes,
        status, vet_id, id,
      ]
    );

    const [updated] = await db.query(
      `SELECT a.*, p.pet_name, u.full_name AS vet_name
       FROM appointments a
       JOIN pets p  ON a.pet_id = p.pet_id
       JOIN users u ON a.vet_id = u.user_id
       WHERE a.appointment_id = ?`,
      [id]
    );

    return successResponse(
      res, 'Appointment updated.', updated[0]
    );

  } catch (error) {
    console.error('Update appointment error:', error);
    return errorResponse(
      res, 'Failed to update appointment.', 500
    );
  }
};

// ── CANCEL APPOINTMENT ────────────────────────────────────
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query(
      'SELECT * FROM appointments WHERE appointment_id = ?', [id]
    );
    if (existing.length === 0) {
      return errorResponse(res, 'Appointment not found.', 404);
    }
    if (existing[0].status === 'Cancelled') {
      return errorResponse(res, 'Already cancelled.', 400);
    }

    await db.query(
      `UPDATE appointments
       SET status = 'Cancelled'
       WHERE appointment_id = ?`,
      [id]
    );

    return successResponse(res, 'Appointment cancelled.');
  } catch (error) {
    console.error('Cancel error:', error);
    return errorResponse(res, 'Failed to cancel.', 500);
  }
};

// ── GET CALENDAR VIEW ─────────────────────────────────────
const getCalendarView = async (req, res) => {
  try {
    const { month, year } = req.query;
    const now        = new Date();
    const queryMonth = month || (now.getMonth() + 1);
    const queryYear  = year  || now.getFullYear();

    const { clause: branchClause, params: branchParams }
      = getBranchFilterWithAlias(req.user, 'a');

    const [appointments] = await db.query(
      `SELECT
         a.appointment_id, a.appointment_date,
         a.appointment_time, a.end_time,
         a.service_type, a.status,
         p.pet_name,
         u_owner.full_name AS owner_name,
         u_vet.full_name   AS vet_name
       FROM appointments a
       JOIN pets p        ON a.pet_id = p.pet_id
       JOIN pet_owners po ON a.owner_id = po.owner_id
       JOIN users u_owner ON po.user_id = u_owner.user_id
       JOIN users u_vet   ON a.vet_id = u_vet.user_id
       WHERE MONTH(a.appointment_date) = ?
         AND YEAR(a.appointment_date)  = ?
         AND a.status != 'Cancelled'
         ${branchClause}
       ORDER BY a.appointment_date ASC,
                a.appointment_time ASC`,
      [queryMonth, queryYear, ...branchParams]
    );

    return successResponse(res, 'Calendar data fetched.', {
      month: queryMonth,
      year:  queryYear,
      appointments,
    });
  } catch (error) {
    console.error('Calendar error:', error);
    return errorResponse(
      res, 'Failed to fetch calendar.', 500
    );
  }
};

// ── GET AVAILABLE TIME SLOTS ──────────────────────────────
const getAvailableSlots = async (req, res) => {
  try {
    const { date, vet_id } = req.query;

    if (!date || !vet_id) {
      return errorResponse(
        res, 'Date and vet_id required.', 400
      );
    }

    const allSlots = [
      '09:00','09:30','10:00','10:30','11:00','11:30',
      '12:00','13:00','13:30','14:00','14:30','15:00',
      '15:30','16:00','16:30','17:00',
    ];

    const [booked] = await db.query(
      `SELECT TIME_FORMAT(appointment_time, '%H:%i') AS time_slot
       FROM appointments
       WHERE vet_id = ? AND appointment_date = ?
         AND status NOT IN ('Cancelled','Completed')`,
      [vet_id, date]
    );

    const bookedSlots    = booked.map(b => b.time_slot);
    const availableSlots = allSlots.filter(
      s => !bookedSlots.includes(s)
    );

    return successResponse(res, 'Slots fetched.', {
      date,
      vet_id,
      available: availableSlots,
      booked:    bookedSlots,
    });
  } catch (error) {
    console.error('Slots error:', error);
    return errorResponse(
      res, 'Failed to fetch slots.', 500
    );
  }
};

module.exports = {
  getAllAppointments,
  getTodayAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getCalendarView,
  getAvailableSlots,
};