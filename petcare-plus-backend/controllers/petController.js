const db      = require('../config/db');
const QRCode  = require('qrcode');
const {
  successResponse, errorResponse, paginatedResponse,
} = require('../utils/response');
const { sendQRCodeEmail } = require('../utils/emailService');
require('dotenv').config();

// ── DATE HELPER ───────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return null;
  if (String(d).includes('T')) return String(d).split('T')[0];
  return d;
};

// ── GENERATE QR CODE ──────────────────────────────────────
const generatePetQR = async (petId, petName) => {
  try {
    const qrData = JSON.stringify({
      pet_id:    petId,
      pet_name:  petName,
      clinic:    'PetCare Plus',
      url:       `${process.env.QR_BASE_URL ||
        'http://localhost:5000'}/api/pets/${petId}/profile`,
      generated: new Date().toISOString(),
    });
    return await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type:    'image/png',
      quality: 0.95,
      margin:  1,
      color:   { dark: '#1a2957', light: '#ffffff' },
      width:   300,
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return null;
  }
};

// ── GET ALL PETS ──────────────────────────────────────────
const getAllPets = async (req, res) => {
  try {
    const {
      search, species, status,
      branch_id, page = 1, limit = 10,
    } = req.query;
    const offset = (page - 1) * limit;

    let where    = 'WHERE 1=1';
    const params = [];

    // Owners only see their own pets
    if (req.user.role === 'Owner') {
      where += ' AND po.user_id = ?';
      params.push(req.user.user_id);
    }

    // Branch filter — only if explicitly requested
    if (branch_id) {
      where += ' AND p.branch_id = ?';
      params.push(branch_id);
    }

    if (search) {
      where += ` AND (p.pet_name LIKE ? OR p.breed LIKE ?
        OR u.full_name LIKE ?)`;
      params.push(
        `%${search}%`, `%${search}%`, `%${search}%`
      );
    }
    if (species) {
      where += ' AND p.species = ?';
      params.push(species);
    }
    if (status) {
      where += ' AND p.status = ?';
      params.push(status);
    }

    const baseQuery = `
      FROM pets p
      JOIN pet_owners po ON p.owner_id = po.owner_id
      JOIN users u ON po.user_id = u.user_id
      LEFT JOIN branches b ON p.branch_id = b.branch_id
      ${where}
    `;

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total ${baseQuery}`, params
    );
    const total = countResult[0].total;

    const [pets] = await db.query(
      `SELECT
         p.*,
         po.owner_id,
         u.full_name   AS owner_name,
         u.email       AS owner_email,
         u.phone       AS owner_phone,
         b.branch_name AS branch_name,
         b.city        AS branch_city
       ${baseQuery}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return paginatedResponse(
      res, 'Pets fetched successfully.', pets,
      {
        total,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(total / limit),
      }
    );

  } catch (error) {
    console.error('Get all pets error:', error);
    return errorResponse(
      res, 'Failed to fetch pets. ' + error.message, 500
    );
  }
};

// ── GET SINGLE PET ────────────────────────────────────────
const getPetById = async (req, res) => {
  try {
    const { id } = req.params;

    const [pets] = await db.query(
      `SELECT
         p.*,
         po.owner_id,
         u.full_name AS owner_name,
         u.email     AS owner_email,
         u.phone     AS owner_phone,
         u.user_id   AS owner_user_id,
         po.address  AS owner_address,
         po.city     AS owner_city,
         po.emergency_contact
       FROM pets p
       JOIN pet_owners po ON p.owner_id = po.owner_id
       JOIN users u ON po.user_id = u.user_id
       WHERE p.pet_id = ?`,
      [id]
    );

    if (pets.length === 0) {
      return errorResponse(res, 'Pet not found.', 404);
    }

    const [vaccinations] = await db.query(
      `SELECT * FROM vaccinations
       WHERE pet_id = ? ORDER BY given_date DESC LIMIT 5`,
      [id]
    );

    const [medicalRecords] = await db.query(
      `SELECT mr.*, u.full_name AS vet_name
       FROM medical_records mr
       JOIN users u ON mr.vet_id = u.user_id
       WHERE mr.pet_id = ?
       ORDER BY mr.record_date DESC LIMIT 5`,
      [id]
    );

    const [appointments] = await db.query(
      `SELECT a.*, u.full_name AS vet_name
       FROM appointments a
       JOIN users u ON a.vet_id = u.user_id
       WHERE a.pet_id = ?
         AND a.appointment_date >= CURDATE()
         AND a.status NOT IN ('Cancelled')
       ORDER BY a.appointment_date ASC LIMIT 3`,
      [id]
    );

    return successResponse(
      res, 'Pet profile fetched successfully.',
      {
        ...pets[0],
        vaccinations,
        medical_records:       medicalRecords,
        upcoming_appointments: appointments,
      }
    );

  } catch (error) {
    console.error('Get pet by ID error:', error);
    return errorResponse(
      res, 'Failed to fetch pet profile.', 500
    );
  }
};

// ── CREATE PET ────────────────────────────────────────────
const createPet = async (req, res) => {
  try {
    const {
      owner_id, pet_name, species, breed, age,
      date_of_birth, gender, weight, color,
      microchip_id, allergies, special_notes, branch_id,
    } = req.body;

    if (!owner_id || !pet_name || !species) {
      return errorResponse(
        res, 'Owner, pet name and species are required.', 400
      );
    }

    const [ownerData] = await db.query(
      `SELECT po.owner_id, u.full_name, u.email
       FROM pet_owners po
       JOIN users u ON po.user_id = u.user_id
       WHERE po.owner_id = ?`,
      [owner_id]
    );
    if (ownerData.length === 0) {
      return errorResponse(res, 'Owner not found.', 404);
    }

    // Use branch from form, or fall back to user's branch
    const branchId = branch_id || req.user.branch_id || null;

    const [result] = await db.query(
      `INSERT INTO pets
         (owner_id, pet_name, species, breed, age,
          date_of_birth, gender, weight, color,
          microchip_id, allergies, special_notes,
          status, branch_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)`,
      [
        owner_id, pet_name, species,
        breed              || null,
        age                || null,
        formatDate(date_of_birth) || null,
        gender             || 'Unknown',
        weight             || null,
        color              || null,
        microchip_id       || null,
        allergies          || null,
        special_notes      || null,
        branchId,
      ]
    );

    const petId  = result.insertId;
    const qrCode = await generatePetQR(petId, pet_name);

    if (qrCode) {
      await db.query(
        'UPDATE pets SET qr_code = ? WHERE pet_id = ?',
        [qrCode, petId]
      );
    }

    if (qrCode && ownerData[0].email) {
      try {
        await sendQRCodeEmail({
          ownerEmail:   ownerData[0].email,
          ownerName:    ownerData[0].full_name,
          petName:      pet_name,
          petSpecies:   species,
          petBreed:     breed || '',
          qrCodeBase64: qrCode,
          petId,
        });
      } catch (emailErr) {
        console.error('QR email failed:', emailErr.message);
      }
    }

    const [newPet] = await db.query(
      'SELECT * FROM pets WHERE pet_id = ?', [petId]
    );

    return successResponse(
      res,
      `🐾 ${pet_name} registered! QR sent to ${ownerData[0].email}`,
      newPet[0],
      201
    );

  } catch (error) {
    console.error('Create pet error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return errorResponse(
        res, 'Microchip ID already registered.', 409
      );
    }
    return errorResponse(
      res, 'Failed to register pet. ' + error.message, 500
    );
  }
};

// ── UPDATE PET ────────────────────────────────────────────
const updatePet = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      pet_name, species, breed, age, date_of_birth,
      gender, weight, color, microchip_id,
      allergies, special_notes, status, branch_id,
    } = req.body;

    const [existing] = await db.query(
      'SELECT pet_id FROM pets WHERE pet_id = ?', [id]
    );
    if (existing.length === 0) {
      return errorResponse(res, 'Pet not found.', 404);
    }

    await db.query(
      `UPDATE pets SET
         pet_name      = COALESCE(?, pet_name),
         species       = COALESCE(?, species),
         breed         = COALESCE(?, breed),
         age           = COALESCE(?, age),
         date_of_birth = COALESCE(?, date_of_birth),
         gender        = COALESCE(?, gender),
         weight        = COALESCE(?, weight),
         color         = COALESCE(?, color),
         microchip_id  = COALESCE(?, microchip_id),
         allergies     = COALESCE(?, allergies),
         special_notes = COALESCE(?, special_notes),
         status        = COALESCE(?, status),
         branch_id     = COALESCE(?, branch_id)
       WHERE pet_id = ?`,
      [
        pet_name, species, breed, age,
        formatDate(date_of_birth),
        gender, weight, color,
        microchip_id, allergies, special_notes,
        status, branch_id,
        id,
      ]
    );

    const [updated] = await db.query(
      'SELECT * FROM pets WHERE pet_id = ?', [id]
    );
    return successResponse(
      res, 'Pet updated successfully.', updated[0]
    );

  } catch (error) {
    console.error('Update pet error:', error);
    return errorResponse(res, 'Failed to update pet.', 500);
  }
};

// ── DELETE PET ────────────────────────────────────────────
const deletePet = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query(
      'SELECT pet_id, pet_name FROM pets WHERE pet_id = ?',
      [id]
    );
    if (existing.length === 0) {
      return errorResponse(res, 'Pet not found.', 404);
    }

    await db.query('DELETE FROM pets WHERE pet_id = ?', [id]);

    return successResponse(
      res, `${existing[0].pet_name} removed successfully.`
    );

  } catch (error) {
    console.error('Delete pet error:', error);
    return errorResponse(res, 'Failed to delete pet.', 500);
  }
};

// ── REGENERATE QR CODE ────────────────────────────────────
const regenerateQR = async (req, res) => {
  try {
    const { id } = req.params;

    const [pets] = await db.query(
      'SELECT pet_id, pet_name FROM pets WHERE pet_id = ?',
      [id]
    );
    if (pets.length === 0) {
      return errorResponse(res, 'Pet not found.', 404);
    }

    const qrCode = await generatePetQR(
      pets[0].pet_id, pets[0].pet_name
    );
    await db.query(
      'UPDATE pets SET qr_code = ? WHERE pet_id = ?',
      [qrCode, id]
    );

    return successResponse(
      res, 'QR Code regenerated successfully.',
      { qr_code: qrCode }
    );

  } catch (error) {
    console.error('Regenerate QR error:', error);
    return errorResponse(
      res, 'Failed to regenerate QR code.', 500
    );
  }
};

// ── GET PET PUBLIC PROFILE (QR Scan) ─────────────────────
const getPetPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const [pets] = await db.query(
      `SELECT
         p.pet_id, p.pet_name, p.species, p.breed,
         p.age, p.gender, p.color, p.allergies,
         u.full_name AS owner_name,
         u.phone     AS owner_phone
       FROM pets p
       JOIN pet_owners po ON p.owner_id = po.owner_id
       JOIN users u ON po.user_id = u.user_id
       WHERE p.pet_id = ? AND p.status = 'Active'`,
      [id]
    );

    if (pets.length === 0) {
      return errorResponse(res, 'Pet not found.', 404);
    }

    return successResponse(res, 'Pet profile loaded.', pets[0]);

  } catch (error) {
    console.error('Get public profile error:', error);
    return errorResponse(
      res, 'Failed to load pet profile.', 500
    );
  }
};

module.exports = {
  getAllPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
  regenerateQR,
  getPetPublicProfile,
};