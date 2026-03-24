const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

// ── GET VACCINATIONS FOR A PET ────────────────────────────
const getVaccinations = async (req, res) => {
  try {
    const { pet_id } = req.params;

    const [vaccinations] = await db.query(
      `SELECT v.*, u.full_name AS vet_name, p.pet_name
       FROM vaccinations v
       JOIN users u ON v.vet_id = u.user_id
       JOIN pets p ON v.pet_id = p.pet_id
       WHERE v.pet_id = ?
       ORDER BY v.given_date DESC`,
      [pet_id]
    );

    return successResponse(res, 'Vaccinations fetched.', vaccinations);
  } catch (error) {
    console.error('Get vaccinations error:', error);
    return errorResponse(res, 'Failed to fetch vaccinations.', 500);
  }
};

// ── GET UPCOMING/OVERDUE VACCINATIONS ─────────────────────
const getDueVaccinations = async (req, res) => {
  try {
    const [vaccinations] = await db.query(
      `SELECT v.*, u.full_name AS vet_name,
              p.pet_name, p.species,
              u_owner.full_name AS owner_name,
              u_owner.phone AS owner_phone,
              DATEDIFF(v.next_due_date, CURDATE()) AS days_until_due
       FROM vaccinations v
       JOIN users u ON v.vet_id = u.user_id
       JOIN pets p ON v.pet_id = p.pet_id
       JOIN pet_owners po ON p.owner_id = po.owner_id
       JOIN users u_owner ON po.user_id = u_owner.user_id
       WHERE v.next_due_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       AND v.next_due_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       ORDER BY v.next_due_date ASC`
    );

    // Separate overdue and upcoming
    const overdue = vaccinations.filter(v => v.days_until_due < 0);
    const upcoming = vaccinations.filter(v => v.days_until_due >= 0);

    return successResponse(res, 'Due vaccinations fetched.', {
      overdue,
      upcoming,
      total_due: vaccinations.length,
    });
  } catch (error) {
    console.error('Get due vaccinations error:', error);
    return errorResponse(res, 'Failed to fetch due vaccinations.', 500);
  }
};

// ── CREATE VACCINATION ────────────────────────────────────
const createVaccination = async (req, res) => {
  try {
    const {
      pet_id, vaccine_name, vaccine_brand,
      batch_number, given_date, next_due_date,
      dosage, notes,
    } = req.body;

    const vet_id = req.user.user_id;

    const [result] = await db.query(
      `INSERT INTO vaccinations
        (pet_id, vet_id, vaccine_name, vaccine_brand,
         batch_number, given_date, next_due_date, dosage, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Completed')`,
      [pet_id, vet_id, vaccine_name, vaccine_brand || null,
       batch_number || null, given_date, next_due_date || null,
       dosage || null, notes || null]
    );

    // Create reminder notification if next_due_date exists
    if (next_due_date) {
      await db.query(
        `INSERT INTO notifications
          (user_id, title, message, type, notification_channel, status)
         SELECT u.user_id,
           'Vaccination Reminder 💉',
           CONCAT(p.pet_name, ' is due for ', ? , ' on ', ?),
           'Vaccination', 'App', 'Pending'
         FROM pets p
         JOIN pet_owners po ON p.owner_id = po.owner_id
         JOIN users u ON po.user_id = u.user_id
         WHERE p.pet_id = ?`,
        [vaccine_name, next_due_date, pet_id]
      );
    }

    const [newVaccination] = await db.query(
      `SELECT v.*, u.full_name AS vet_name, p.pet_name
       FROM vaccinations v
       JOIN users u ON v.vet_id = u.user_id
       JOIN pets p ON v.pet_id = p.pet_id
       WHERE v.vaccination_id = ?`,
      [result.insertId]
    );

    return successResponse(res, 'Vaccination recorded successfully.', newVaccination[0], 201);
  } catch (error) {
    console.error('Create vaccination error:', error);
    return errorResponse(res, 'Failed to record vaccination.', 500);
  }
};

// ── UPDATE VACCINATION ────────────────────────────────────
const updateVaccination = async (req, res) => {
  try {
    const { id } = req.params;
    const { vaccine_name, given_date, next_due_date, dosage, notes, status } = req.body;

    const [existing] = await db.query(
      'SELECT vaccination_id FROM vaccinations WHERE vaccination_id = ?', [id]
    );
    if (existing.length === 0) {
      return errorResponse(res, 'Vaccination record not found.', 404);
    }

    await db.query(
      `UPDATE vaccinations SET
        vaccine_name = COALESCE(?, vaccine_name),
        given_date = COALESCE(?, given_date),
        next_due_date = COALESCE(?, next_due_date),
        dosage = COALESCE(?, dosage),
        notes = COALESCE(?, notes),
        status = COALESCE(?, status)
       WHERE vaccination_id = ?`,
      [vaccine_name, given_date, next_due_date, dosage, notes, status, id]
    );

    return successResponse(res, 'Vaccination updated successfully.');
  } catch (error) {
    console.error('Update vaccination error:', error);
    return errorResponse(res, 'Failed to update vaccination.', 500);
  }
};

// ── DELETE VACCINATION ────────────────────────────────────
const deleteVaccination = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query(
      'SELECT vaccination_id FROM vaccinations WHERE vaccination_id = ?', [id]
    );
    if (existing.length === 0) {
      return errorResponse(res, 'Vaccination record not found.', 404);
    }

    await db.query('DELETE FROM vaccinations WHERE vaccination_id = ?', [id]);
    return successResponse(res, 'Vaccination record deleted.');
  } catch (error) {
    console.error('Delete vaccination error:', error);
    return errorResponse(res, 'Failed to delete vaccination.', 500);
  }
};

module.exports = {
  getVaccinations,
  getDueVaccinations,
  createVaccination,
  updateVaccination,
  deleteVaccination,
};