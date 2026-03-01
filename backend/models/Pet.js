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
      type: DataTypes.STRING(100),
      allowNull: false
    },
    species: {
      type: DataTypes.ENUM('Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Reptile', 'Other'),
      allowNull: false
    },
    breed: {
      type: DataTypes.STRING(100)
    },
    date_of_birth: {
      type: DataTypes.DATEONLY
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Unknown'),
      defaultValue: 'Unknown'
    },
    color: {
      type: DataTypes.STRING(50)
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2)
    },
    microchip_number: {
      type: DataTypes.STRING(50)
    },
    photo_url: {
      type: DataTypes.STRING(255)
    },
    medical_conditions: {
      type: DataTypes.TEXT
    },
    allergies: {
      type: DataTypes.TEXT
    },
    current_medications: {
      type: DataTypes.TEXT
    },
    special_notes: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Deceased'),
      defaultValue: 'Active'
    }
  }, {
    tableName: 'pets',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Pet.associate = (models) => {
    Pet.belongsTo(models.PetOwner, {
      foreignKey: 'owner_id',
      as: 'owner'
    });
  };

  return Pet;
};