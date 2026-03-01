module.exports = (sequelize, DataTypes) => {
  const PetOwner = sequelize.define('PetOwner', {
    owner_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    address: {
      type: DataTypes.TEXT
    },
    city: {
      type: DataTypes.STRING(50)
    },
    nic: {
      type: DataTypes.STRING(20)
    },
    emergency_contact: {
      type: DataTypes.STRING(20)
    },
    notes: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active'
    }
  }, {
    tableName: 'pet_owners',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  PetOwner.associate = (models) => {
    PetOwner.hasMany(models.Pet, {
      foreignKey: 'owner_id',
      as: 'pets'
    });
  };

  return PetOwner;
};