const db = require('../config/database');

// Get all pets
const getAllPets = async (req, res) => {
  try {
    const [pets] = await db.query(`
      SELECT 
        p.*,
        po.full_name as owner_name,
        po.email as owner_email,
        po.phone as owner_phone,
        po.address as owner_address
      FROM pets p
      LEFT JOIN pet_owners po ON p.owner_id = po.owner_id
      ORDER BY p.created_at DESC
    `);

    res.status(200).json({
      success: true,
      count: pets.length,
      data: {
        pets: pets.map(pet => ({
          ...pet,
          owner: {
            full_name: pet.owner_name,
            email: pet.owner_email,
            phone: pet.owner_phone,
            address: pet.owner_address
          }
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching pets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pets',
      error: error.message
    });
  }
};

// Get pet by ID
const getPetById = async (req, res) => {
  try {
    const { id } = req.params;

    const [pets] = await db.query(`
      SELECT 
        p.*,
        po.full_name as owner_name,
        po.email as owner_email,
        po.phone as owner_phone,
        po.address as owner_address
      FROM pets p
      LEFT JOIN pet_owners po ON p.owner_id = po.owner_id
      WHERE p.pet_id = ?
    `, [id]);

    if (pets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    const pet = pets[0];

    res.status(200).json({
      success: true,
      data: {
        ...pet,
        owner: {
          full_name: pet.owner_name,
          email: pet.owner_email,
          phone: pet.owner_phone,
          address: pet.owner_address
        }
      }
    });
  } catch (error) {
    console.error('Error fetching pet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pet',
      error: error.message
    });
  }
};

// Create new pet
const createPet = async (req, res) => {
  try {
    const {
      owner_id,
      pet_name,
      species,
      breed,
      date_of_birth,
      gender,
      color,
      weight,
      microchip_number,
      medical_conditions,
      allergies,
      current_medications,
      special_notes
    } = req.body;

    // Validate required fields
    if (!owner_id || !pet_name || !species) {
      return res.status(400).json({
        success: false,
        message: 'Owner, pet name, and species are required'
      });
    }

    const [result] = await db.query(
      `INSERT INTO pets (
        owner_id, pet_name, species, breed, date_of_birth, 
        gender, color, weight, microchip_number, medical_conditions,
        allergies, current_medications, special_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        owner_id, pet_name, species, breed, date_of_birth,
        gender, color, weight, microchip_number, medical_conditions,
        allergies, current_medications, special_notes
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Pet registered successfully',
      data: {
        pet_id: result.insertId,
        owner_id,
        pet_name,
        species
      }
    });
  } catch (error) {
    console.error('Error creating pet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register pet',
      error: error.message
    });
  }
};

// Update pet
const updatePet = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      owner_id,
      pet_name,
      species,
      breed,
      date_of_birth,
      gender,
      color,
      weight,
      microchip_number,
      medical_conditions,
      allergies,
      current_medications,
      special_notes
    } = req.body;

    const [result] = await db.query(
      `UPDATE pets SET
        owner_id = ?, pet_name = ?, species = ?, breed = ?,
        date_of_birth = ?, gender = ?, color = ?, weight = ?,
        microchip_number = ?, medical_conditions = ?, allergies = ?,
        current_medications = ?, special_notes = ?, updated_at = NOW()
      WHERE pet_id = ?`,
      [
        owner_id, pet_name, species, breed, date_of_birth,
        gender, color, weight, microchip_number, medical_conditions,
        allergies, current_medications, special_notes, id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pet updated successfully'
    });
  } catch (error) {
    console.error('Error updating pet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pet',
      error: error.message
    });
  }
};

// Delete pet
const deletePet = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query('DELETE FROM pets WHERE pet_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pet',
      error: error.message
    });
  }
};

module.exports = {
  getAllPets,
  getPetById,
  createPet,
  updatePet,
  deletePet
};