const db = require('../config/database');
const { success, error } = require('../utils/responseHandler');

const getAdminDashboard = async (req, res) => {
  try {
    const [[petStats]] = await db.query('SELECT COUNT(*) as total_pets FROM pets WHERE status = "Active"');
    const [[userStats]] = await db.query('SELECT COUNT(*) as total_users FROM users WHERE status = "Active"');
    const [[revenueStats]] = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN payment_status = 'Paid' THEN total_amount ELSE 0 END), 0) as total_revenue,
        COUNT(CASE WHEN payment_status = 'Pending' THEN 1 END) as pending_invoices_count
      FROM invoices
    `);
    const [[lowStockStats]] = await db.query(
      'SELECT COUNT(*) as low_stock_count FROM inventory WHERE quantity <= reorder_level'
    );
    const [todayAppointments] = await db.query(
      "SELECT COUNT(*) as today_count FROM appointments WHERE appointment_date = CURDATE() AND status != 'Cancelled'"
    );
    const [recentActivity] = await db.query(`
      SELECT a.appointment_id, a.appointment_date, a.appointment_time, a.service_type, a.status,
        p.pet_name, u.full_name as vet_name
      FROM appointments a
      LEFT JOIN pets p ON a.pet_id = p.pet_id
      LEFT JOIN users u ON a.vet_id = u.user_id
      ORDER BY a.created_at DESC LIMIT 10
    `);

    return success(res, {
      total_pets: petStats.total_pets,
      total_users: userStats.total_users,
      total_revenue: revenueStats.total_revenue,
      pending_invoices: revenueStats.pending_invoices_count,
      low_stock_items: lowStockStats.low_stock_count,
      today_appointments: todayAppointments[0].today_count,
      recent_activity: recentActivity
    }, 'Admin dashboard data retrieved');
  } catch (err) {
    return error(res, 'Failed to retrieve dashboard data', 500);
  }
};

const getVetDashboard = async (req, res) => {
  try {
    const vetId = req.user.id;

    const [[todayAppts]] = await db.query(
      "SELECT COUNT(*) as count FROM appointments WHERE vet_id = ? AND appointment_date = CURDATE() AND status != 'Cancelled'",
      [vetId]
    );
    const [[weekAppts]] = await db.query(
      "SELECT COUNT(*) as count FROM appointments WHERE vet_id = ? AND appointment_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND status != 'Cancelled'",
      [vetId]
    );
    const [upcomingAppts] = await db.query(`
      SELECT a.appointment_id, a.appointment_date, a.appointment_time, a.service_type, a.status,
        p.pet_name, p.species, owner_user.full_name as owner_name
      FROM appointments a
      LEFT JOIN pets p ON a.pet_id = p.pet_id
      LEFT JOIN pet_owners po ON p.owner_id = po.owner_id
      LEFT JOIN users owner_user ON po.user_id = owner_user.user_id
      WHERE a.vet_id = ? AND a.appointment_date >= CURDATE() AND a.status IN ('Scheduled', 'Confirmed')
      ORDER BY a.appointment_date ASC, a.appointment_time ASC LIMIT 10
    `, [vetId]);
    const [[dueVaccinations]] = await db.query(
      'SELECT COUNT(*) as count FROM vaccinations WHERE next_due_date <= DATE_ADD(NOW(), INTERVAL 30 DAY) AND next_due_date >= CURDATE()'
    );

    return success(res, {
      today_appointments: todayAppts.count,
      week_appointments: weekAppts.count,
      due_vaccinations: dueVaccinations.count,
      upcoming_appointments: upcomingAppts
    }, 'Vet dashboard data retrieved');
  } catch (err) {
    return error(res, 'Failed to retrieve dashboard data', 500);
  }
};

const getReceptionistDashboard = async (req, res) => {
  try {
    const [[todayAppts]] = await db.query(
      "SELECT COUNT(*) as count FROM appointments WHERE appointment_date = CURDATE() AND status != 'Cancelled'"
    );
    const [[pendingInvoices]] = await db.query(
      "SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE payment_status = 'Pending'"
    );
    const [[newPets]] = await db.query(
      "SELECT COUNT(*) as count FROM pets WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
    );
    const [todayAppointmentList] = await db.query(`
      SELECT a.appointment_id, a.appointment_date, a.appointment_time, a.service_type, a.status,
        p.pet_name, u.full_name as vet_name, owner_user.full_name as owner_name
      FROM appointments a
      LEFT JOIN pets p ON a.pet_id = p.pet_id
      LEFT JOIN pet_owners po ON p.owner_id = po.owner_id
      LEFT JOIN users owner_user ON po.user_id = owner_user.user_id
      LEFT JOIN users u ON a.vet_id = u.user_id
      WHERE a.appointment_date = CURDATE() AND a.status != 'Cancelled'
      ORDER BY a.appointment_time ASC
    `);

    return success(res, {
      today_appointments: todayAppts.count,
      pending_invoices_count: pendingInvoices.count,
      pending_invoices_amount: pendingInvoices.total,
      new_pets_this_week: newPets.count,
      today_appointment_list: todayAppointmentList
    }, 'Receptionist dashboard data retrieved');
  } catch (err) {
    return error(res, 'Failed to retrieve dashboard data', 500);
  }
};

module.exports = { getAdminDashboard, getVetDashboard, getReceptionistDashboard };
