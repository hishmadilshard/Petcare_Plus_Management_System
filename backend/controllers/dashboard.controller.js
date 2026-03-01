const db = require('../config/database');

// GET /api/dashboard/admin
const getAdminDashboard = async (req, res) => {
  try {
    const [[{ totalPets }]] = await db.query('SELECT COUNT(*) AS totalPets FROM pets');
    const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ totalRevenue }]] = await db.query(
      "SELECT COALESCE(SUM(total_amount), 0) AS totalRevenue FROM invoices WHERE payment_status = 'Paid'"
    );
    const [[{ lowStockCount }]] = await db.query(
      'SELECT COUNT(*) AS lowStockCount FROM inventory WHERE quantity <= reorder_level'
    );

    const [recentActivity] = await db.query(
      `SELECT 'appointment' AS type, CONCAT(p.name, ' appointment') AS description, a.created_at AS date
       FROM appointments a JOIN pets p ON a.pet_id = p.pet_id
       ORDER BY a.created_at DESC LIMIT 5`
    );

    return res.json({
      success: true,
      data: { totalPets, totalUsers, totalRevenue, lowStockCount, recentActivity }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard data' });
  }
};

// GET /api/dashboard/vet
const getVetDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [[{ todayAppointments }]] = await db.query(
      'SELECT COUNT(*) AS todayAppointments FROM appointments WHERE DATE(appointment_date) = ?',
      [today]
    );
    const [[{ pendingRecords }]] = await db.query(
      "SELECT COUNT(*) AS pendingRecords FROM appointments WHERE status = 'Confirmed'"
    );
    const [[{ dueVaccinations }]] = await db.query(
      'SELECT COUNT(*) AS dueVaccinations FROM vaccinations WHERE next_due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)'
    );

    return res.json({
      success: true,
      data: { todayAppointments, pendingRecords, dueVaccinations }
    });
  } catch (error) {
    console.error('Vet dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard data' });
  }
};

// GET /api/dashboard/receptionist
const getReceptionistDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [[{ todayAppointments }]] = await db.query(
      'SELECT COUNT(*) AS todayAppointments FROM appointments WHERE DATE(appointment_date) = ?',
      [today]
    );
    const [[{ pendingInvoices }]] = await db.query(
      "SELECT COUNT(*) AS pendingInvoices FROM invoices WHERE payment_status = 'Pending'"
    );
    const [[{ newRegistrations }]] = await db.query(
      "SELECT COUNT(*) AS newRegistrations FROM users WHERE DATE(created_at) = ? AND role = 'Owner'",
      [today]
    );

    return res.json({
      success: true,
      data: { todayAppointments, pendingInvoices, newRegistrations }
    });
  } catch (error) {
    console.error('Receptionist dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard data' });
  }
};

module.exports = { getAdminDashboard, getVetDashboard, getReceptionistDashboard };
