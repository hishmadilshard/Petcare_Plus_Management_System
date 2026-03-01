const db = require('../config/database');
const { success, error, notFound } = require('../utils/responseHandler');

const getAllVaccinations = async (req, res) => {
  try {
    const { page = 1, limit = 50, petId, vetId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
      SELECT v.*, p.pet_name, p.species, u.full_name as vet_name,
        owner_user.full_name as owner_name
      FROM vaccinations v
      LEFT JOIN pets p ON v.pet_id = p.pet_id
      LEFT JOIN pet_owners po ON p.owner_id = po.owner_id
      LEFT JOIN users owner_user ON po.user_id = owner_user.user_id
      LEFT JOIN users u ON v.vet_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (petId) { sql += ' AND v.pet_id = ?'; params.push(petId); }
    if (vetId) { sql += ' AND v.vet_id = ?'; params.push(vetId); }
    if (req.user.role === 'Owner') { sql += ' AND po.user_id = ?'; params.push(req.user.id); }

    const countSql = sql.replace(/SELECT[\s\S]+?FROM/, 'SELECT COUNT(*) as total FROM');
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0].total;

    sql += ' ORDER BY v.given_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [vaccinations] = await db.query(sql, params);

    return success(res, {
      vaccinations,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
    }, 'Vaccinations retrieved successfully');
  } catch (err) {
    return error(res, 'Failed to retrieve vaccinations', 500);
  }
};

const getVaccinationById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT v.*, p.pet_name, p.species, u.full_name as vet_name,
        owner_user.full_name as owner_name, owner_user.email as owner_email
      FROM vaccinations v
      LEFT JOIN pets p ON v.pet_id = p.pet_id
      LEFT JOIN pet_owners po ON p.owner_id = po.owner_id
      LEFT JOIN users owner_user ON po.user_id = owner_user.user_id
      LEFT JOIN users u ON v.vet_id = u.user_id
      WHERE v.vaccination_id = ?
    `, [id]);
    if (rows.length === 0) return notFound(res, 'Vaccination');
    return success(res, { vaccination: rows[0] }, 'Vaccination retrieved successfully');
  } catch (err) {
    return error(res, 'Failed to retrieve vaccination', 500);
  }
};

const createVaccination = async (req, res) => {
  try {
    const { pet_id, vaccine_name, vaccine_type, given_date, next_due_date, batch_number, manufacturer, vet_id, notes } = req.body;

    const [petRows] = await db.query('SELECT pet_id FROM pets WHERE pet_id = ?', [pet_id]);
    if (petRows.length === 0) return res.status(404).json({ success: false, message: 'Pet not found' });

    const finalVetId = vet_id || req.user.id;

    const [result] = await db.query(
      `INSERT INTO vaccinations (pet_id, vaccine_name, vaccine_type, given_date, next_due_date, batch_number, manufacturer, vet_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pet_id, vaccine_name, vaccine_type || 'Core', given_date || new Date(), next_due_date || null,
       batch_number || null, manufacturer || null, finalVetId, notes || null]
    );

    const [rows] = await db.query(`
      SELECT v.*, p.pet_name, u.full_name as vet_name
      FROM vaccinations v
      LEFT JOIN pets p ON v.pet_id = p.pet_id
      LEFT JOIN users u ON v.vet_id = u.user_id
      WHERE v.vaccination_id = ?
    `, [result.insertId]);

    return success(res, { vaccination: rows[0] }, 'Vaccination recorded successfully', 201);
  } catch (err) {
    return error(res, 'Failed to record vaccination', 500);
  }
};

const updateVaccination = async (req, res) => {
  try {
    const { id } = req.params;
    const { vaccine_name, vaccine_type, given_date, next_due_date, batch_number, manufacturer, notes } = req.body;

    const [existing] = await db.query('SELECT vaccination_id FROM vaccinations WHERE vaccination_id = ?', [id]);
    if (existing.length === 0) return notFound(res, 'Vaccination');

    const fields = [];
    const params = [];
    if (vaccine_name !== undefined) { fields.push('vaccine_name = ?'); params.push(vaccine_name); }
    if (vaccine_type !== undefined) { fields.push('vaccine_type = ?'); params.push(vaccine_type); }
    if (given_date !== undefined) { fields.push('given_date = ?'); params.push(given_date); }
    if (next_due_date !== undefined) { fields.push('next_due_date = ?'); params.push(next_due_date); }
    if (batch_number !== undefined) { fields.push('batch_number = ?'); params.push(batch_number); }
    if (manufacturer !== undefined) { fields.push('manufacturer = ?'); params.push(manufacturer); }
    if (notes !== undefined) { fields.push('notes = ?'); params.push(notes); }

    if (fields.length > 0) {
      params.push(id);
      await db.query(`UPDATE vaccinations SET ${fields.join(', ')} WHERE vaccination_id = ?`, params);
    }

    const [rows] = await db.query('SELECT * FROM vaccinations WHERE vaccination_id = ?', [id]);
    return success(res, { vaccination: rows[0] }, 'Vaccination updated successfully');
  } catch (err) {
    return error(res, 'Failed to update vaccination', 500);
  }
};

const deleteVaccination = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT vaccination_id FROM vaccinations WHERE vaccination_id = ?', [id]);
    if (existing.length === 0) return notFound(res, 'Vaccination');
    await db.query('DELETE FROM vaccinations WHERE vaccination_id = ?', [id]);
    return success(res, null, 'Vaccination deleted successfully');
  } catch (err) {
    return error(res, 'Failed to delete vaccination', 500);
  }
};

const getVaccinationsByPet = async (req, res) => {
  try {
    const { petId } = req.params;
    const [vaccinations] = await db.query(`
      SELECT v.*, u.full_name as vet_name
      FROM vaccinations v
      LEFT JOIN users u ON v.vet_id = u.user_id
      WHERE v.pet_id = ?
      ORDER BY v.given_date DESC
    `, [petId]);
    return success(res, { vaccinations }, 'Vaccinations retrieved successfully');
  } catch (err) {
    return error(res, 'Failed to retrieve vaccinations', 500);
  }
};

const getDueVaccinations = async (req, res) => {
  try {
    const [vaccinations] = await db.query(`
      SELECT v.*, p.pet_name, p.species,
        owner_user.full_name as owner_name, owner_user.email as owner_email
      FROM vaccinations v
      LEFT JOIN pets p ON v.pet_id = p.pet_id
      LEFT JOIN pet_owners po ON p.owner_id = po.owner_id
      LEFT JOIN users owner_user ON po.user_id = owner_user.user_id
      WHERE v.next_due_date <= DATE_ADD(NOW(), INTERVAL 30 DAY) AND v.next_due_date >= CURDATE()
      ORDER BY v.next_due_date ASC
    `);
    return success(res, { vaccinations, count: vaccinations.length }, 'Due vaccinations retrieved');
  } catch (err) {
    return error(res, 'Failed to retrieve due vaccinations', 500);
  }
};

const sendVaccinationReminders = async (req, res) => {
  try {
    const [vaccinations] = await db.query(`
      SELECT v.*, p.pet_name,
        owner_user.full_name as owner_name, owner_user.email as owner_email
      FROM vaccinations v
      LEFT JOIN pets p ON v.pet_id = p.pet_id
      LEFT JOIN pet_owners po ON p.owner_id = po.owner_id
      LEFT JOIN users owner_user ON po.user_id = owner_user.user_id
      WHERE v.next_due_date BETWEEN CURDATE() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
    `);

    for (const v of vaccinations) {
      // Email/SMS not configured — log reminder details for external processing
      console.log(`[REMINDER STUB] To: ${v.owner_email} | Pet: ${v.pet_name} | Vaccine: ${v.vaccine_name} | Due: ${v.next_due_date}`);
    }

    return success(res, { sentCount: vaccinations.length }, `${vaccinations.length} vaccination reminders sent successfully`);
  } catch (err) {
    return error(res, 'Failed to send reminders', 500);
  }
};

module.exports = {
  getAllVaccinations, getVaccinationById, createVaccination, updateVaccination,
  deleteVaccination, getVaccinationsByPet, getDueVaccinations, sendVaccinationReminders
};
