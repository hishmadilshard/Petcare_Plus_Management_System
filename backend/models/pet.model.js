module.exports = (sequelize, DataTypes) => {
  const Pet = sequelize.define('Pet', {
    pet_id: {
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
    pet_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Pet name is required' },
        len: {
          args: [1, 50],
          msg: 'Pet name must be 1-50 characters'
        }
      }
    },
    species: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Species is required' }
      }
    },
    breed: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: { args: 0, msg: 'Age cannot be negative' },
        max: { args: 50, msg: 'Age seems unrealistic' }
      }
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['Male', 'Female']],
          msg: 'Gender must be Male or Female'
        }
      }
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: { args: 0, msg: 'Weight cannot be negative' }
      }
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    microchip_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    qr_code: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    profile_image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    special_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    allergies: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Deceased'),
      defaultValue: 'Active'
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
    tableName: 'pets',
    timestamps: false,
    indexes: [
      { fields: ['owner_id'] },
      { fields: ['species'] },
      { fields: ['status'] },
      { fields: ['qr_code'] }
    ]
  });

  // Define associations
  Pet.associate = (models) => {
    Pet.belongsTo(models.PetOwner, {
      foreignKey: 'owner_id',
      as: 'owner'
    });

    Pet.hasMany(models.Appointment, {
      foreignKey: 'pet_id',
      as: 'appointments'
    });

    Pet.hasMany(models.MedicalRecord, {
      foreignKey: 'pet_id',
      as: 'medicalRecords'
    });

    Pet.hasMany(models.Vaccination, {
      foreignKey: 'pet_id',
      as: 'vaccinations'
    });
  };

  return Pet;
};