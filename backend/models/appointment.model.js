module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define('Appointment', {
    appointment_id: {
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
    appointment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Appointment date is required' },
        isDate: { msg: 'Invalid date format' }
      }
    },
    appointment_time: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Appointment time is required' }
      }
    },
    service_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Service type is required' }
      }
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      validate: {
        min: { args: 15, msg: 'Duration must be at least 15 minutes' },
        max: { args: 480, msg: 'Duration cannot exceed 8 hours' }
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No-Show'),
      defaultValue: 'Scheduled'
    },
    cancellation_reason: {
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
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'appointments',
    timestamps: false,
    indexes: [
      { fields: ['pet_id'] },
      { fields: ['vet_id'] },
      { fields: ['appointment_date'] },
      { fields: ['status'] },
      { unique: true, fields: ['vet_id', 'appointment_date', 'appointment_time'] }
    ]
  });

  // Define associations
  Appointment.associate = (models) => {
    Appointment.belongsTo(models.Pet, {
      foreignKey: 'pet_id',
      as: 'pet'
    });

    Appointment.belongsTo(models.User, {
      foreignKey: 'vet_id',
      as: 'veterinarian'
    });

    Appointment.hasMany(models.MedicalRecord, {
      foreignKey: 'appointment_id',
      as: 'medicalRecords'
    });
  };

  return Appointment;
};