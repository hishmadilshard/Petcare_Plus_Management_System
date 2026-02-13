module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define('Invoice', {
    invoice_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'pet_owners',
        key: 'owner_id'
      }
    },
    appointment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'appointments',
        key: 'appointment_id'
      }
    },
    invoice_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: 0, msg: 'Subtotal cannot be negative' }
      }
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: { args: 0, msg: 'Tax cannot be negative' }
      }
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: { args: 0, msg: 'Discount cannot be negative' }
      }
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: 0, msg: 'Total amount cannot be negative' }
      }
    },
    payment_status: {
      type: DataTypes.ENUM('Pending', 'Paid', 'Partially Paid', 'Cancelled', 'Refunded'),
      defaultValue: 'Pending'
    },
    payment_method: {
      type: DataTypes.ENUM('Cash', 'Card', 'Bank Transfer', 'Online'),
      allowNull: true
    },
    invoice_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: { msg: 'Invalid date format' }
      }
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    paid_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    paid_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: { args: 0, msg: 'Paid amount cannot be negative' }
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
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
    tableName: 'invoices',
    timestamps: false,
    indexes: [
      { fields: ['owner_id'] },
      { fields: ['invoice_number'] },
      { fields: ['payment_status'] },
      { fields: ['invoice_date'] }
    ]
  });

  // Define associations
  Invoice.associate = (models) => {
    Invoice.belongsTo(models.PetOwner, {
      foreignKey: 'owner_id',
      as: 'owner'
    });

    Invoice.belongsTo(models.Appointment, {
      foreignKey: 'appointment_id',
      as: 'appointment'
    });

    Invoice.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });

    Invoice.hasMany(models.InvoiceItem, {
      foreignKey: 'invoice_id',
      as: 'items'
    });
  };

  return Invoice;
};