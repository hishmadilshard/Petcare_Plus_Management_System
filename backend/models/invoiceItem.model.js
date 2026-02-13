module.exports = (sequelize, DataTypes) => {
  const InvoiceItem = sequelize.define('InvoiceItem', {
    item_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    invoice_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'invoice_id'
      }
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Description is required' }
      }
    },
    item_type: {
      type: DataTypes.ENUM('Service', 'Medicine', 'Vaccine', 'Product', 'Other'),
      defaultValue: 'Service'
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        min: { args: 1, msg: 'Quantity must be at least 1' }
      }
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: 0, msg: 'Unit price cannot be negative' }
      }
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: 0, msg: 'Total cannot be negative' }
      }
    }
  }, {
    tableName: 'invoice_items',
    timestamps: false,
    indexes: [
      { fields: ['invoice_id'] }
    ],
    hooks: {
      beforeSave: (item) => {
        // Auto-calculate total
        item.total = item.quantity * item.unit_price;
      }
    }
  });

  // Define associations
  InvoiceItem.associate = (models) => {
    InvoiceItem.belongsTo(models.Invoice, {
      foreignKey: 'invoice_id',
      as: 'invoice'
    });
  };

  return InvoiceItem;
};