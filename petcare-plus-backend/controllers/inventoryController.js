const db = require('../config/db');
const {
  successResponse, errorResponse, paginatedResponse,
} = require('../utils/response');
const { getBranchFilter } = require('../utils/branchFilter');

// ── GET ALL INVENTORY ─────────────────────────────────────
const getAllInventory = async (req, res) => {
  try {
    const {
      category, status, search, page = 1, limit = 10,
    } = req.query;
    const offset = (page - 1) * limit;

    const { clause: branchClause, params: branchParams }
      = getBranchFilter(req.user);

    let where  = `WHERE 1=1 ${branchClause}`;
    const params = [...branchParams];

    if (category) {
      where += ' AND category = ?';
      params.push(category);
    }
    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      where += ' AND (item_name LIKE ? OR supplier LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM inventory ${where}`,
      params
    );
    const total = countResult[0].total;

    const [items] = await db.query(
      `SELECT * FROM inventory ${where}
       ORDER BY item_name ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return paginatedResponse(
      res, 'Inventory fetched successfully.', items,
      {
        total,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(total / limit),
      }
    );

  } catch (error) {
    console.error('Get inventory error:', error);
    return errorResponse(
      res, 'Failed to fetch inventory.', 500
    );
  }
};

// ── GET LOW STOCK ALERTS ──────────────────────────────────
const getLowStockAlerts = async (req, res) => {
  try {
    const { clause: branchClause, params: branchParams }
      = getBranchFilter(req.user);

    const [items] = await db.query(
      `SELECT * FROM inventory
       WHERE quantity <= min_quantity
       ${branchClause}
       ORDER BY quantity ASC`,
      branchParams
    );

    return successResponse(
      res, 'Low stock alerts fetched.',
      { total_alerts: items.length, items }
    );
  } catch (error) {
    console.error('Low stock error:', error);
    return errorResponse(
      res, 'Failed to fetch low stock alerts.', 500
    );
  }
};

// ── GET SINGLE ITEM ───────────────────────────────────────
const getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const [items] = await db.query(
      'SELECT * FROM inventory WHERE item_id = ?', [id]
    );
    if (items.length === 0) {
      return errorResponse(res, 'Item not found.', 404);
    }
    return successResponse(res, 'Item fetched.', items[0]);
  } catch (error) {
    console.error('Get item error:', error);
    return errorResponse(res, 'Failed to fetch item.', 500);
  }
};

// ── CREATE INVENTORY ITEM ─────────────────────────────────
const createInventoryItem = async (req, res) => {
  try {
    const {
      item_name, category, description,
      quantity, min_quantity, unit,
      unit_price, supplier, expiry_date,
      food_type, brand, weight_per_unit,
      suitable_for, age_group, dosage_form,
      strength, storage_conditions, prescription_required,
    } = req.body;

    const status = quantity <= 0
      ? 'Out of Stock'
      : quantity <= (min_quantity || 10)
        ? 'Low Stock'
        : 'Available';

    // ✅ Assign to user's branch
    const branchId = req.user.branch_id || null;

    const [result] = await db.query(
      `INSERT INTO inventory
         (item_name, category, description, quantity,
          min_quantity, unit, unit_price, supplier,
          expiry_date, status, branch_id,
          food_type, brand, weight_per_unit,
          suitable_for, age_group, dosage_form,
          strength, storage_conditions, prescription_required)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        item_name, category, description || null,
        quantity, min_quantity || 10,
        unit || 'units', unit_price,
        supplier || null, expiry_date || null,
        status, branchId,
        food_type || null, brand || null,
        weight_per_unit || null, suitable_for || null,
        age_group || null, dosage_form || null,
        strength || null, storage_conditions || null,
        prescription_required || false,
      ]
    );

    const [newItem] = await db.query(
      'SELECT * FROM inventory WHERE item_id = ?',
      [result.insertId]
    );

    return successResponse(
      res, 'Inventory item added successfully!',
      newItem[0], 201
    );
  } catch (error) {
    console.error('Create inventory error:', error);
    return errorResponse(
      res, 'Failed to add inventory item.', 500
    );
  }
};

// ── UPDATE INVENTORY ITEM ─────────────────────────────────
const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      item_name, category, description,
      quantity, min_quantity, unit,
      unit_price, supplier, expiry_date,
    } = req.body;

    const [existing] = await db.query(
      'SELECT * FROM inventory WHERE item_id = ?', [id]
    );
    if (existing.length === 0) {
      return errorResponse(res, 'Item not found.', 404);
    }

    const newQty = quantity !== undefined
      ? quantity : existing[0].quantity;
    const newMin = min_quantity || existing[0].min_quantity;
    const status = newQty <= 0
      ? 'Out of Stock'
      : newQty <= newMin
        ? 'Low Stock'
        : 'Available';

    await db.query(
      `UPDATE inventory SET
         item_name    = COALESCE(?, item_name),
         category     = COALESCE(?, category),
         description  = COALESCE(?, description),
         quantity     = COALESCE(?, quantity),
         min_quantity = COALESCE(?, min_quantity),
         unit         = COALESCE(?, unit),
         unit_price   = COALESCE(?, unit_price),
         supplier     = COALESCE(?, supplier),
         expiry_date  = COALESCE(?, expiry_date),
         status       = ?
       WHERE item_id = ?`,
      [
        item_name, category, description,
        quantity, min_quantity, unit,
        unit_price, supplier, expiry_date,
        status, id,
      ]
    );

    const [updated] = await db.query(
      'SELECT * FROM inventory WHERE item_id = ?', [id]
    );
    return successResponse(
      res, 'Item updated successfully.', updated[0]
    );

  } catch (error) {
    console.error('Update inventory error:', error);
    return errorResponse(res, 'Failed to update item.', 500);
  }
};

// ── RESTOCK ITEM ──────────────────────────────────────────
const restockItem = async (req, res) => {
  try {
    const { id }       = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return errorResponse(
        res, 'Valid quantity is required.', 400
      );
    }

    const [existing] = await db.query(
      'SELECT * FROM inventory WHERE item_id = ?', [id]
    );
    if (existing.length === 0) {
      return errorResponse(res, 'Item not found.', 404);
    }

    const newQty = existing[0].quantity + parseInt(quantity);
    const status = newQty <= existing[0].min_quantity
      ? 'Low Stock' : 'Available';

    await db.query(
      `UPDATE inventory
       SET quantity = ?, status = ?
       WHERE item_id = ?`,
      [newQty, status, id]
    );

    return successResponse(
      res, `✅ Restocked! New quantity: ${newQty}`,
      {
        item_id:           id,
        previous_quantity: existing[0].quantity,
        added_quantity:    quantity,
        new_quantity:      newQty,
        status,
      }
    );

  } catch (error) {
    console.error('Restock error:', error);
    return errorResponse(res, 'Failed to restock item.', 500);
  }
};

// ── DELETE ITEM ───────────────────────────────────────────
const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query(
      'SELECT item_id FROM inventory WHERE item_id = ?', [id]
    );
    if (existing.length === 0) {
      return errorResponse(res, 'Item not found.', 404);
    }

    await db.query(
      'DELETE FROM inventory WHERE item_id = ?', [id]
    );
    return successResponse(res, 'Item deleted successfully.');
  } catch (error) {
    console.error('Delete inventory error:', error);
    return errorResponse(res, 'Failed to delete item.', 500);
  }
};

// ── GET INVENTORY STATS ───────────────────────────────────
const getInventoryStats = async (req, res) => {
  try {
    const { clause: branchClause, params: branchParams }
      = getBranchFilter(req.user);

    const [stats] = await db.query(
      `SELECT
         COUNT(*) AS total_items,
         SUM(quantity * unit_price) AS total_value,
         COUNT(CASE WHEN status = 'Low Stock'
           THEN 1 END)     AS low_stock_count,
         COUNT(CASE WHEN status = 'Out of Stock'
           THEN 1 END)     AS out_of_stock_count,
         COUNT(CASE WHEN status = 'Available'
           THEN 1 END)     AS available_count
       FROM inventory
       WHERE 1=1 ${branchClause}`,
      branchParams
    );

    const [byCategory] = await db.query(
      `SELECT category,
         COUNT(*) AS item_count,
         SUM(quantity) AS total_quantity
       FROM inventory
       WHERE 1=1 ${branchClause}
       GROUP BY category`,
      branchParams
    );

    return successResponse(res, 'Inventory stats fetched.', {
      ...stats[0],
      by_category: byCategory,
    });
  } catch (error) {
    console.error('Inventory stats error:', error);
    return errorResponse(res, 'Failed to fetch stats.', 500);
  }
};

module.exports = {
  getAllInventory,
  getLowStockAlerts,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  restockItem,
  deleteInventoryItem,
  getInventoryStats,
};