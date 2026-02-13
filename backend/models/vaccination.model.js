module.exports = (sequelize, DataTypes) => {
  const Vaccination = sequelize.define('Vaccination', {
    vaccination_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    pet_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'pets',
        key: 'pet_id'
      }
    },
    vaccine_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Vaccine name is required' }
      }
    },
    vaccine_type: {
      type: DataTypes.ENUM('Core', 'Non-Core', 'Required'),
      defaultValue: 'Core'
    },
    given_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Given date is required' },
        isDate: { msg: 'Invalid date format' }
      }
    },
    next_due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    batch_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    manufacturer: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    vet_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reminder_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'vaccinations',
    timestamps: false,
    indexes: [
      { fields: ['pet_id'] },
      { fields: ['next_due_date'] },
      { fields: ['vaccine_type'] }
    ]
  });

  // Define associations
  Vaccination.associate = (models) => {
    Vaccination.belongsTo(models.Pet, {
      foreignKey: 'pet_id',
      as: 'pet'
    });

    Vaccination.belongsTo(models.User, {
      foreignKey: 'vet_id',
      as: 'veterinarian'
    });
  };

  return Vaccination;
};