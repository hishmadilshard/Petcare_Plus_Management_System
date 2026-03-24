const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

// ── MAIN DASHBOARD STATS ──────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {

    // Total counts
    const [pets] = await db.query(
      `SELECT COUNT(*) as total FROM pets WHERE status = 'Active'`
    );
    const [owners] = await db.query(
      `SELECT COUNT(*) as total FROM pet_owners`
    );
    const [appointments] = await db.query(
      `SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'Booked' THEN 1 END) as booked,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN appointment_date = CURDATE() THEN 1 END) as today
       FROM appointments`
    );
    const [revenue] = await db.query(
      `SELECT
        SUM(CASE WHEN payment_status = 'Paid' THEN total_amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN payment_status = 'Pending' THEN total_amount ELSE 0 END) as pending_revenue,
        COUNT(CASE WHEN payment_status = 'Pending' THEN 1 END) as pending_invoices
       FROM invoices`
    );

    // Today's appointments
    const [todayAppointments] = await db.query(
      `SELECT a.*, p.pet_name, p.species,
              u_owner.full_name AS owner_name,
              u_vet.full_name AS vet_name
       FROM appointments a
       JOIN pets p ON a.pet_id = p.pet_id
       JOIN pet_owners po ON a.owner_id = po.owner_id
       JOIN users u_owner ON po.user_id = u_owner.user_id
       JOIN users u_vet ON a.vet_id = u_vet.user_id
       WHERE a.appointment_date = CURDATE()
       AND a.status != 'Cancelled'
       ORDER BY a.appointment_time ASC
       LIMIT 5`
    );

    // Low stock alerts
    const [lowStock] = await db.query(
      `SELECT * FROM inventory
       WHERE quantity <= min_quantity
       ORDER BY quantity ASC LIMIT 5`
    );

    // Recent invoices
    const [recentInvoices] = await db.query(
      `SELECT i.*, u.full_name AS owner_name
       FROM invoices i
       JOIN pet_owners po ON i.owner_id = po.owner_id
       JOIN users u ON po.user_id = u.user_id
       ORDER BY i.created_at DESC LIMIT 5`
    );

    // Upcoming vaccinations due
    const [vaccinationsDue] = await db.query(
      `SELECT v.*, p.pet_name, u.full_name AS owner_name
       FROM vaccinations v
       JOIN pets p ON v.pet_id = p.pet_id
       JOIN pet_owners po ON p.owner_id = po.owner_id
       JOIN users u ON po.user_id = u.user_id
       WHERE v.next_due_date BETWEEN CURDATE()
       AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
       ORDER BY v.next_due_date ASC LIMIT 5`
    );

    // Monthly appointments chart (last 6 months)
    const [monthlyAppointments] = await db.query(
      `SELECT
        DATE_FORMAT(appointment_date, '%b') AS month,
        COUNT(*) AS total,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) AS completed
       FROM appointments
       WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(appointment_date, '%Y-%m')
       ORDER BY appointment_date ASC`
    );

    // Species distribution
    const [speciesData] = await db.query(
      `SELECT species, COUNT(*) AS count
       FROM pets
       WHERE status = 'Active'
       GROUP BY species
       ORDER BY count DESC`
    );

    // New registrations this month
    const [newThisMonth] = await db.query(
      `SELECT
        COUNT(DISTINCT p.pet_id) AS new_pets,
        COUNT(DISTINCT po.owner_id) AS new_owners
       FROM pets p
       JOIN pet_owners po ON p.owner_id = po.owner_id
       WHERE MONTH(p.created_at) = MONTH(CURDATE())
       AND YEAR(p.created_at) = YEAR(CURDATE())`
    );

    return successResponse(res, 'Dashboard data fetched successfully.', {
      stats: {
        total_pets: pets[0].total,
        total_owners: owners[0].total,
        total_appointments: appointments[0].total,
        today_appointments: appointments[0].today,
        booked_appointments: appointments[0].booked,
        completed_appointments: appointments[0].completed,
        cancelled_appointments: appointments[0].cancelled,
        total_revenue: revenue[0].total_revenue || 0,
        pending_revenue: revenue[0].pending_revenue || 0,
        pending_invoices: revenue[0].pending_invoices || 0,
        new_pets_this_month: newThisMonth[0].new_pets,
        new_owners_this_month: newThisMonth[0].new_owners,
        low_stock_alerts: lowStock.length,
      },
      today_appointments: todayAppointments,
      low_stock_items: lowStock,
      recent_invoices: recentInvoices,
      vaccinations_due: vaccinationsDue,
      charts: {
        monthly_appointments: monthlyAppointments,
        species_distribution: speciesData,
      },
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return errorResponse(res, 'Failed to fetch dashboard data.', 500);
  }
};

// ── REPORTS ───────────────────────────────────────────────
const getReports = async (req, res) => {
  try {
    const { type, start_date, end_date } = req.query;

    const startDate = start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];

    let reportData = {};

    if (!type || type === 'appointments') {
      const [data] = await db.query(
        `SELECT
          DATE(appointment_date) AS date,
          COUNT(*) AS total,
          COUNT(CASE WHEN status = 'Completed' THEN 1 END) AS completed,
          COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) AS cancelled,
          service_type,
          COUNT(*) AS service_count
         FROM appointments
         WHERE appointment_date BETWEEN ? AND ?
         GROUP BY DATE(appointment_date), service_type
         ORDER BY date ASC`,
        [startDate, endDate]
      );
      reportData.appointments = data;
    }

    if (!type || type === 'revenue') {
      const [data] = await db.query(
        `SELECT
          DATE(invoice_date) AS date,
          COUNT(*) AS total_invoices,
          SUM(total_amount) AS total_revenue,
          SUM(CASE WHEN payment_status = 'Paid' THEN total_amount ELSE 0 END) AS paid_revenue,
          SUM(CASE WHEN payment_status = 'Pending' THEN total_amount ELSE 0 END) AS pending_revenue
         FROM invoices
         WHERE invoice_date BETWEEN ? AND ?
         GROUP BY DATE(invoice_date)
         ORDER BY date ASC`,
        [startDate, endDate]
      );
      reportData.revenue = data;
    }

    if (!type || type === 'pets') {
      const [data] = await db.query(
        `SELECT
          species,
          COUNT(*) AS total,
          COUNT(CASE WHEN gender = 'Male' THEN 1 END) AS male,
          COUNT(CASE WHEN gender = 'Female' THEN 1 END) AS female
         FROM pets
         WHERE status = 'Active'
         GROUP BY species`
      );
      reportData.pets = data;
    }

    return successResponse(res, 'Report generated successfully.', {
      period: { start_date: startDate, end_date: endDate },
      ...reportData,
    });

  } catch (error) {
    console.error('Reports error:', error);
    return errorResponse(res, 'Failed to generate report.', 500);
  }
};

module.exports = { getDashboardStats, getReports };