module.exports = (sequelize, DataTypes) => {
  const MedicalRecord = sequelize.define('MedicalRecord', {
    record_id: {
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
    vet_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
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
    visit_type: {
      type: DataTypes.ENUM('Checkup', 'Emergency', 'Surgery', 'Vaccination', 'Follow-up'),
      defaultValue: 'Checkup'
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    symptoms: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    treatment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    prescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lab_results: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    record_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Record date is required' },
        isDate: { msg: 'Invalid date format' }
      }
    },
    next_visit_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    attachments: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    temperature: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      validate: {
        min: { args: 35, msg: 'Temperature seems too low' },
        max: { args: 45, msg: 'Temperature seems too high' }
      }
    },
    heart_rate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: { args: 40, msg: 'Heart rate seems too low' },
        max: { args: 250, msg: 'Heart rate seems too high' }
      }
    },
    respiratory_rate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: { args: 10, msg: 'Respiratory rate seems too low' },
        max: { args: 100, msg: 'Respiratory rate seems too high' }
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
    tableName: 'medical_records',
    timestamps: false,
    indexes: [
      { fields: ['pet_id'] },
      { fields: ['record_date'] },
      { fields: ['visit_type'] }
    ]
  });

  // Define associations
  MedicalRecord.associate = (models) => {
    MedicalRecord.belongsTo(models.Pet, {
      foreignKey: 'pet_id',
      as: 'pet'
    });

    MedicalRecord.belongsTo(models.User, {
      foreignKey: 'vet_id',
      as: 'veterinarian'
    });

    MedicalRecord.belongsTo(models.Appointment, {
      foreignKey: 'appointment_id',
      as: 'appointment'
    });
  };

  return MedicalRecord;
};