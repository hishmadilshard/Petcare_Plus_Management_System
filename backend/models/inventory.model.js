module.exports = (sequelize, DataTypes) => {
  const Inventory = sequelize.define('Inventory', {
    item_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    item_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Item name is required' }
      }
    },
    category: {
      type: DataTypes.ENUM('Medicine', 'Vaccine', 'Equipment', 'Supply', 'Food'),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Category is required' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: { args: 0, msg: 'Quantity cannot be negative' }
      }
    },
    unit: {
      type: DataTypes.STRING(20),
      defaultValue: 'unit'
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: { args: 0, msg: 'Price cannot be negative' }
      }
    },
    reorder_level: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      validate: {
        min: { args: 0, msg: 'Reorder level cannot be negative' }
      }
    },
    supplier: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Available', 'Low Stock', 'Out of Stock', 'Expired'),
      defaultValue: 'Available'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'inventory',
    timestamps: false,
    indexes: [
      { fields: ['category'] },
      { fields: ['status'] },
      { fields: ['expiry_date'] }
    ],
    hooks: {
      beforeSave: (item) => {
        // Auto-update status based on quantity
        if (item.quantity === 0) {
          item.status = 'Out of Stock';
        } else if (item.quantity <= item.reorder_level) {
          item.status = 'Low Stock';
        } else if (item.expiry_date && new Date(item.expiry_date) < new Date()) {
          item.status = 'Expired';
        } else {
          item.status = 'Available';
        }
      }
    }
  });

  return Inventory;
};