const { Inventory } = require('../models');
const { success, error, notFound } = require('../utils/responseHandler');
const securityLogger = require('../utils/securityLogger');
const { Op } = require('sequelize');

/**
 * Get all inventory items
 * GET /api/inventory
 */
const getAllInventoryItems = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status, search } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { item_name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { supplier: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: items } = await Inventory.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['item_name', 'ASC']]
    });

    return success(res, {
      items,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    }, 'Inventory items retrieved successfully');

  } catch (err) {
    securityLogger.error('Get all inventory error', { error: err.message });
    return error(res, 'Failed to retrieve inventory items', 500);
  }
};

/**
 * Get inventory item by ID
 * GET /api/inventory/:id
 */
const getInventoryItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Inventory.findByPk(id);

    if (!item) {
      return notFound(res, 'Inventory item');
    }

    return success(res, { item }, 'Inventory item retrieved successfully');

  } catch (err) {
    securityLogger.error('Get inventory item by ID error', { error: err.message });
    return error(res, 'Failed to retrieve inventory item', 500);
  }
};

/**
 * Create inventory item
 * POST /api/inventory
 */
const createInventoryItem = async (req, res) => {
  try {
    const {
      item_name,
      category,
      description,
      quantity,
      unit,
      unit_price,
      reorder_level,
      supplier,
      expiry_date
    } = req.body;

    // Check if item already exists
    const existingItem = await Inventory.findOne({
      where: { item_name: { [Op.like]: item_name } }
    });

    if (existingItem) {
      return res.status(409).json({
        success: false,
        message: 'Item with this name already exists',
        timestamp: new Date().toISOString()
      });
    }

    // Create item
    const item = await Inventory.create({
      item_name,
      category,
      description,
      quantity: quantity || 0,
      unit: unit || 'unit',
      unit_price,
      reorder_level: reorder_level || 10,
      supplier,
      expiry_date
    });

    securityLogger.info('Inventory item created', {
      createdBy: req.user.id,
      itemId: item.item_id,
      itemName: item_name
    });

    return success(res, { item }, 'Inventory item created successfully', 201);

  } catch (err) {
    securityLogger.error('Create inventory item error', { error: err.message });
    return error(res, 'Failed to create inventory item', 500);
  }
};

/**
 * Update inventory item
 * PUT /api/inventory/:id
 */
const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      item_name,
      category,
      description,
      quantity,
      unit,
      unit_price,
      reorder_level,
      supplier,
      expiry_date,
      status
    } = req.body;

    const item = await Inventory.findByPk(id);
    if (!item) {
      return notFound(res, 'Inventory item');
    }

    // Update item
    await Inventory.update(
      {
        item_name,
        category,
        description,
        quantity,
        unit,
        unit_price,
        reorder_level,
        supplier,
        expiry_date,
        status
      },
      { where: { item_id: id } }
    );

    const updatedItem = await Inventory.findByPk(id);

    securityLogger.info('Inventory item updated', {
      updatedBy: req.user.id,
      itemId: id
    });

    return success(res, { item: updatedItem }, 'Inventory item updated successfully');

  } catch (err) {
    securityLogger.error('Update inventory item error', { error: err.message });
    return error(res, 'Failed to update inventory item', 500);
  }
};

/**
 * Delete inventory item
 * DELETE /api/inventory/:id
 */
const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Inventory.findByPk(id);
    if (!item) {
      return notFound(res, 'Inventory item');
    }

    await Inventory.destroy({ where: { item_id: id } });

    securityLogger.warn('Inventory item deleted', {
      deletedBy: req.user.id,
      itemId: id,
      itemName: item.item_name
    });

    return success(res, null, 'Inventory item deleted successfully');

  } catch (err) {
    securityLogger.error('Delete inventory item error', { error: err.message });
    return error(res, 'Failed to delete inventory item', 500);
  }
};

/**
 * Adjust inventory quantity
 * PUT /api/inventory/:id/adjust
 */
const adjustInventoryQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustment, reason } = req.body; // adjustment can be positive or negative

    if (!adjustment || adjustment === 0) {
      return res.status(400).json({
        success: false,
        message: 'Adjustment value is required and cannot be zero',
        timestamp: new Date().toISOString()
      });
    }

    const item = await Inventory.findByPk(id);
    if (!item) {
      return notFound(res, 'Inventory item');
    }

    const newQuantity = item.quantity + adjustment;

    if (newQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient quantity for this adjustment',
        currentQuantity: item.quantity,
        requestedAdjustment: adjustment,
        timestamp: new Date().toISOString()
      });
    }

    // Update quantity
    await Inventory.update(
      { quantity: newQuantity },
      { where: { item_id: id } }
    );

    const updatedItem = await Inventory.findByPk(id);

    securityLogger.info('Inventory quantity adjusted', {
      adjustedBy: req.user.id,
      itemId: id,
      previousQuantity: item.quantity,
      adjustment,
      newQuantity,
      reason
    });

    return success(res, { item: updatedItem }, 'Inventory quantity adjusted successfully');

  } catch (err) {
    securityLogger.error('Adjust inventory quantity error', { error: err.message });
    return error(res, 'Failed to adjust inventory quantity', 500);
  }
};

/**
 * Get low stock items
 * GET /api/inventory/low-stock
 */
const getLowStockItems = async (req, res) => {
  try {
    const items = await Inventory.findAll({
      where: {
        status: { [Op.in]: ['Low Stock', 'Out of Stock'] }
      },
      order: [['quantity', 'ASC']]
    });

    return success(res, { items, count: items.length }, 'Low stock items retrieved');

  } catch (err) {
    securityLogger.error('Get low stock items error', { error: err.message });
    return error(res, 'Failed to retrieve low stock items', 500);
  }
};

/**
 * Get expired items
 * GET /api/inventory/expired
 */
const getExpiredItems = async (req, res) => {
  try {
    const today = new Date();

    const items = await Inventory.findAll({
      where: {
        expiry_date: { [Op.lt]: today }
      },
      order: [['expiry_date', 'ASC']]
    });

    // Auto-update status to Expired
    for (const item of items) {
      if (item.status !== 'Expired') {
        await Inventory.update(
          { status: 'Expired' },
          { where: { item_id: item.item_id } }
        );
      }
    }

    return success(res, { items, count: items.length }, 'Expired items retrieved');

  } catch (err) {
    securityLogger.error('Get expired items error', { error: err.message });
    return error(res, 'Failed to retrieve expired items', 500);
  }
};

/**
 * Get items expiring soon
 * GET /api/inventory/expiring-soon
 */
const getExpiringItems = async (req, res) => {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // Next 30 days

    const items = await Inventory.findAll({
      where: {
        expiry_date: {
          [Op.between]: [today, futureDate]
        }
      },
      order: [['expiry_date', 'ASC']]
    });

    return success(res, { items, count: items.length }, 'Expiring items retrieved');

  } catch (err) {
    securityLogger.error('Get expiring items error', { error: err.message });
    return error(res, 'Failed to retrieve expiring items', 500);
  }
};

/**
 * Get inventory by category
 * GET /api/inventory/category/:category
 */
const getInventoryByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const validCategories = ['Medicine', 'Vaccine', 'Equipment', 'Supply', 'Food'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
        validCategories,
        timestamp: new Date().toISOString()
      });
    }

    const items = await Inventory.findAll({
      where: { category },
      order: [['item_name', 'ASC']]
    });

    return success(res, { items, category }, `${category} items retrieved successfully`);

  } catch (err) {
    securityLogger.error('Get inventory by category error', { error: err.message });
    return error(res, 'Failed to retrieve inventory items', 500);
  }
};

/**
 * Get inventory statistics
 * GET /api/inventory/stats
 */
const getInventoryStats = async (req, res) => {
  try {
    const totalItems = await Inventory.count();
    const lowStockItems = await Inventory.count({
      where: { status: 'Low Stock' }
    });
    const outOfStockItems = await Inventory.count({
      where: { status: 'Out of Stock' }
    });
    const expiredItems = await Inventory.count({
      where: { status: 'Expired' }
    });

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const expiringItems = await Inventory.count({
      where: {
        expiry_date: {
          [Op.between]: [today, futureDate]
        }
      }
    });

    // Category breakdown
    const categoryStats = await Inventory.findAll({
      attributes: [
        'category',
        [Inventory.sequelize.fn('COUNT', Inventory.sequelize.col('item_id')), 'count']
      ],
      group: ['category']
    });

    return success(res, {
      totalItems,
      lowStockItems,
      outOfStockItems,
      expiredItems,
      expiringItems,
      categoryBreakdown: categoryStats
    }, 'Inventory statistics retrieved');

  } catch (err) {
    securityLogger.error('Get inventory stats error', { error: err.message });
    return error(res, 'Failed to retrieve inventory statistics', 500);
  }
};

module.exports = {
  getAllInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustInventoryQuantity,
  getLowStockItems,
  getExpiredItems,
  getExpiringItems,
  getInventoryByCategory,
  getInventoryStats
};