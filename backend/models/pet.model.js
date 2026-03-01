module.exports = (sequelize, DataTypes) => {
  const Pet = sequelize.define('Pet', {
    pet_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    pet_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    species: {
      type: DataTypes.ENUM('Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Other'),
      allowNull: false
    },
    breed: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female'),
      allowNull: false
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    age_years: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    age_months: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    microchip_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    blood_type: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    allergies: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    medical_conditions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    special_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    photo_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Active', 'Deceased', 'Transferred'),
      defaultValue: 'Active'
    }
  }, {
    tableName: 'pets',
    timestamps: true,
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