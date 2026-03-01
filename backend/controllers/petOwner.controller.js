const db = require('../config/database');

// Get all pet owners
const getAllPetOwners = async (req, res) => {
  try {
    const [owners] = await db.query(`
      SELECT 
        po.*,
        COUNT(p.pet_id) as pet_count
      FROM pet_owners po
      LEFT JOIN pets p ON po.owner_id = p.owner_id
      GROUP BY po.owner_id
      ORDER BY po.created_at DESC
    `);

    res.status(200).json({
      success: true,
      count: owners.length,
      data: {
        owners: owners.map(owner => ({
          ...owner,
          pets: [] // You can populate this if needed
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching pet owners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pet owners',
      error: error.message
    });
  }
};

// Get pet owner by ID
const getPetOwnerById = async (req, res) => {
  try {
    const { id } = req.params;

    const [owners] = await db.query(
      'SELECT * FROM pet_owners WHERE owner_id = ?',
      [id]
    );

    if (owners.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pet owner not found'
      });
    }

    // Get owner's pets
    const [pets] = await db.query(
      'SELECT * FROM pets WHERE owner_id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        ...owners[0],
        pets
      }
    });
  } catch (error) {
    console.error('Error fetching pet owner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pet owner',
      error: error.message
    });
  }
};

// Create new pet owner
const createPetOwner = async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      address,
      city,
      nic,
      emergency_contact,
      notes
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and phone are required'
      });
    }

    // Check if email already exists
    const [existing] = await db.query(
      'SELECT owner_id FROM pet_owners WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const [result] = await db.query(
      `INSERT INTO pet_owners (
        full_name, email, phone, address, city, nic, 
        emergency_contact, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name, email, phone, address, city, nic, emergency_contact, notes]
    );

    res.status(201).json({
      success: true,
      message: 'Pet owner registered successfully',
      data: {
        owner_id: result.insertId,
        full_name,
        email,
        phone
      }
    });
  } catch (error) {
    console.error('Error creating pet owner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register pet owner',
      error: error.message
    });
  }
};

// Update pet owner
const updatePetOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      email,
      phone,
      address,
      city,
      nic,
      emergency_contact,
      notes
    } = req.body;

    const [result] = await db.query(
      `UPDATE pet_owners SET
        full_name = ?, email = ?, phone = ?, address = ?,
        city = ?, nic = ?, emergency_contact = ?, notes = ?,
        updated_at = NOW()
      WHERE owner_id = ?`,
      [full_name, email, phone, address, city, nic, emergency_contact, notes, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pet owner not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pet owner updated successfully'
    });
  } catch (error) {
    console.error('Error updating pet owner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pet owner',
      error: error.message
    });
  }
};

// Delete pet owner
const deletePetOwner = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if owner has pets
    const [pets] = await db.query(
      'SELECT COUNT(*) as count FROM pets WHERE owner_id = ?',
      [id]
    );

    if (pets[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete owner with registered pets'
      });
    }

    const [result] = await db.query(
      'DELETE FROM pet_owners WHERE owner_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pet owner not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pet owner deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pet owner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pet owner',
      error: error.message
    });
  }
};

module.exports = {
  getAllPetOwners,
  getPetOwnerById,
  createPetOwner,
  updatePetOwner,
  deletePetOwner
};