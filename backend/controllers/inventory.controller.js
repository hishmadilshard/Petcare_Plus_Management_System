const db = require('../config/database');
const { success, error, notFound } = require('../utils/responseHandler');

const getAllInventoryItems = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, category } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = 'SELECT * FROM inventory WHERE 1=1';
    const params = [];

    if (search) { sql += ' AND (item_name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (category) { sql += ' AND category = ?'; params.push(category); }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0].total;

    sql += ' ORDER BY item_name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [items] = await db.query(sql, params);
    return success(res, {
      items,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
    }, 'Inventory retrieved successfully');
  } catch (err) {
    return error(res, 'Failed to retrieve inventory', 500);
  }
};

const getInventoryItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM inventory WHERE item_id = ?', [id]);
    if (rows.length === 0) return notFound(res, 'Inventory item');
    return success(res, { item: rows[0] }, 'Inventory item retrieved successfully');
  } catch (err) {
    return error(res, 'Failed to retrieve inventory item', 500);
  }
};

const getInventoryStats = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        COUNT(*) as total_items,
        SUM(CASE WHEN quantity <= reorder_level AND quantity > 0 THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count,
        SUM(CASE WHEN expiry_date < NOW() THEN 1 ELSE 0 END) as expired_count,
        SUM(CASE WHEN expiry_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiring_soon_count,
        SUM(quantity * unit_price) as total_value
      FROM inventory
    `);
    return success(res, rows[0], 'Inventory statistics retrieved');
  } catch (err) {
    return error(res, 'Failed to retrieve inventory statistics', 500);
  }
};

const getLowStockItems = async (req, res) => {
  try {
    const [items] = await db.query(
      'SELECT * FROM inventory WHERE quantity <= reorder_level ORDER BY quantity ASC'
    );
    return success(res, { items, count: items.length }, 'Low stock items retrieved');
  } catch (err) {
    return error(res, 'Failed to retrieve low stock items', 500);
  }
};

const getExpiredItems = async (req, res) => {
  try {
    const [items] = await db.query(
      'SELECT * FROM inventory WHERE expiry_date < NOW() ORDER BY expiry_date ASC'
    );
    return success(res, { items, count: items.length }, 'Expired items retrieved');
  } catch (err) {
    return error(res, 'Failed to retrieve expired items', 500);
  }
};

const getExpiringItems = async (req, res) => {
  try {
    const [items] = await db.query(
      'SELECT * FROM inventory WHERE expiry_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY) ORDER BY expiry_date ASC'
    );
    return success(res, { items, count: items.length }, 'Expiring items retrieved');
  } catch (err) {
    return error(res, 'Failed to retrieve expiring items', 500);
  }
};

const getInventoryByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const [items] = await db.query(
      'SELECT * FROM inventory WHERE category = ? ORDER BY item_name ASC',
      [category]
    );
    return success(res, { items, category }, 'Inventory by category retrieved');
  } catch (err) {
    return error(res, 'Failed to retrieve inventory by category', 500);
  }
};

const createInventoryItem = async (req, res) => {
  try {
    const { item_name, category, description, quantity, unit, unit_price, reorder_level, supplier, expiry_date } = req.body;

    const [result] = await db.query(
      `INSERT INTO inventory (item_name, category, description, quantity, unit, unit_price, reorder_level, supplier, expiry_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [item_name, category || 'Supplies', description || null, quantity || 0, unit || 'units',
       unit_price || 0, reorder_level || 0, supplier || null, expiry_date || null]
    );

    const [rows] = await db.query('SELECT * FROM inventory WHERE item_id = ?', [result.insertId]);
    return success(res, { item: rows[0] }, 'Inventory item created successfully', 201);
  } catch (err) {
    return error(res, 'Failed to create inventory item', 500);
  }
};

const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, category, description, quantity, unit, unit_price, reorder_level, supplier, expiry_date, status } = req.body;

    const [existing] = await db.query('SELECT item_id FROM inventory WHERE item_id = ?', [id]);
    if (existing.length === 0) return notFound(res, 'Inventory item');

    const fields = [];
    const params = [];
    if (item_name !== undefined) { fields.push('item_name = ?'); params.push(item_name); }
    if (category !== undefined) { fields.push('category = ?'); params.push(category); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (quantity !== undefined) { fields.push('quantity = ?'); params.push(quantity); }
    if (unit !== undefined) { fields.push('unit = ?'); params.push(unit); }
    if (unit_price !== undefined) { fields.push('unit_price = ?'); params.push(unit_price); }
    if (reorder_level !== undefined) { fields.push('reorder_level = ?'); params.push(reorder_level); }
    if (supplier !== undefined) { fields.push('supplier = ?'); params.push(supplier); }
    if (expiry_date !== undefined) { fields.push('expiry_date = ?'); params.push(expiry_date); }
    if (status !== undefined) { fields.push('status = ?'); params.push(status); }

    if (fields.length > 0) {
      params.push(id);
      await db.query(`UPDATE inventory SET ${fields.join(', ')} WHERE item_id = ?`, params);
    }

    const [rows] = await db.query('SELECT * FROM inventory WHERE item_id = ?', [id]);
    return success(res, { item: rows[0] }, 'Inventory item updated successfully');
  } catch (err) {
    return error(res, 'Failed to update inventory item', 500);
  }
};

const adjustInventoryQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustment, reason } = req.body;

    const [existing] = await db.query('SELECT item_id, quantity FROM inventory WHERE item_id = ?', [id]);
    if (existing.length === 0) return notFound(res, 'Inventory item');

    const newQuantity = existing[0].quantity + parseInt(adjustment);
    if (newQuantity < 0) {
      return res.status(400).json({ success: false, message: 'Insufficient stock for this adjustment' });
    }

    await db.query('UPDATE inventory SET quantity = ? WHERE item_id = ?', [newQuantity, id]);
    const [rows] = await db.query('SELECT * FROM inventory WHERE item_id = ?', [id]);
    return success(res, { item: rows[0] }, 'Inventory quantity adjusted successfully');
  } catch (err) {
    return error(res, 'Failed to adjust inventory quantity', 500);
  }
};

const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT item_id FROM inventory WHERE item_id = ?', [id]);
    if (existing.length === 0) return notFound(res, 'Inventory item');
    await db.query('DELETE FROM inventory WHERE item_id = ?', [id]);
    return success(res, null, 'Inventory item deleted successfully');
  } catch (err) {
    return error(res, 'Failed to delete inventory item', 500);
  }
};

module.exports = {
  getAllInventoryItems, getInventoryItemById, getInventoryStats, getLowStockItems,
  getExpiredItems, getExpiringItems, getInventoryByCategory, createInventoryItem,
  updateInventoryItem, adjustInventoryQuantity, deleteInventoryItem
};
