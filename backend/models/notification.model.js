module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    notification_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Title is required' }
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Message is required' }
      }
    },
    notification_type: {
      type: DataTypes.ENUM('Appointment', 'Vaccination', 'Payment', 'General', 'System'),
      defaultValue: 'General'
    },
    delivery_method: {
      type: DataTypes.ENUM('App', 'Email', 'SMS', 'All'),
      defaultValue: 'App'
    },
    priority: {
      type: DataTypes.ENUM('Low', 'Medium', 'High'),
      defaultValue: 'Medium'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sent_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Sent', 'Failed', 'Delivered'),
      defaultValue: 'Pending'
    }
  }, {
    tableName: 'notifications',
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['is_read'] },
      { fields: ['status'] },
      { fields: ['notification_type'] }
    ]
  });

  // Define associations
  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return Notification;
};