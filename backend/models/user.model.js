const { hashPassword } = require('../utils/encryption');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Full name is required' },
        len: {
          args: [2, 100],
          msg: 'Full name must be between 2-100 characters'
        }
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        msg: 'Email already exists'
      },
      validate: {
        isEmail: { msg: 'Must be a valid email address' },
        notEmpty: { msg: 'Email is required' }
      },
      set(value) {
        this.setDataValue('email', value.toLowerCase().trim());
      }
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
        is: {
          args: /^[0-9]{10,15}$/,
          msg: 'Phone number must be 10-15 digits'
        }
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password is required' }
      }
    },
    role: {
      type: DataTypes.ENUM('Admin', 'Vet', 'Receptionist', 'Owner'),
      allowNull: false,
      defaultValue: 'Owner',
      validate: {
        isIn: {
          args: [['Admin', 'Vet', 'Receptionist', 'Owner']],
          msg: 'Invalid role'
        }
      }
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Suspended'),
      defaultValue: 'Active'
    },
    profile_image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'users',
    timestamps: false,
    indexes: [
      { fields: ['email'] },
      { fields: ['role'] },
      { fields: ['status'] }
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash && !user.password_hash.startsWith('$2a$')) {
          user.password_hash = await hashPassword(user.password_hash);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password_hash') && !user.password_hash.startsWith('$2a$')) {
          user.password_hash = await hashPassword(user.password_hash);
        }
      }
    }
  });

  // Define associations
  User.associate = (models) => {
    User.hasOne(models.PetOwner, {
      foreignKey: 'user_id',
      as: 'ownerProfile'
    });

    User.hasMany(models.Appointment, {
      foreignKey: 'vet_id',
      as: 'appointments'
    });

    User.hasMany(models.MedicalRecord, {
      foreignKey: 'vet_id',
      as: 'medicalRecords'
    });

    User.hasMany(models.Vaccination, {
      foreignKey: 'vet_id',
      as: 'vaccinations'
    });

    User.hasMany(models.Notification, {
      foreignKey: 'user_id',
      as: 'notifications'
    });

    User.hasMany(models.RefreshToken, {
      foreignKey: 'user_id',
      as: 'refreshTokens'
    });
  };

  // Hide password in JSON output
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password_hash;
    return values;
  };

  return User;
};