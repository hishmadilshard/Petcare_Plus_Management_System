module.exports = (sequelize, DataTypes) => {
  const PetOwner = sequelize.define('PetOwner', {
    owner_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    postal_code: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    emergency_contact: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
        is: {
          args: /^[0-9]{10,15}$/,
          msg: 'Emergency contact must be 10-15 digits'
        }
      }
    },
    registered_date: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'pet_owners',
    timestamps: false,
    indexes: [
      { fields: ['user_id'] }
    ]
  });

  // Define associations
  PetOwner.associate = (models) => {
    PetOwner.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    PetOwner.hasMany(models.Pet, {
      foreignKey: 'owner_id',
      as: 'pets'
    });

    PetOwner.hasMany(models.Invoice, {
      foreignKey: 'owner_id',
      as: 'invoices'
    });
  };

  return PetOwner;
};