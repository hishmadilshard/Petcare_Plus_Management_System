const { sequelize } = require('../config/db.config');
const { DataTypes } = require('sequelize');

// Import all models
const User = require('./user.model');
const PetOwner = require('./petOwner.model');
const Pet = require('./pet.model');
const Appointment = require('./appointment.model');
const MedicalRecord = require('./medicalRecord.model');
const Vaccination = require('./vaccination.model');
const Inventory = require('./inventory.model');
const Invoice = require('./invoice.model');
const InvoiceItem = require('./invoiceItem.model');
const Notification = require('./notification.model');
const RefreshToken = require('./refreshToken.model');

// Initialize models
const models = {
  User: User(sequelize, DataTypes),
  PetOwner: PetOwner(sequelize, DataTypes),
  Pet: Pet(sequelize, DataTypes),
  Appointment: Appointment(sequelize, DataTypes),
  MedicalRecord: MedicalRecord(sequelize, DataTypes),
  Vaccination: Vaccination(sequelize, DataTypes),
  Inventory: Inventory(sequelize, DataTypes),
  Invoice: Invoice(sequelize, DataTypes),
  InvoiceItem: InvoiceItem(sequelize, DataTypes),
  Notification: Notification(sequelize, DataTypes),
  RefreshToken: RefreshToken(sequelize, DataTypes)
};

// Define relationships
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Export models and sequelize
module.exports = {
  sequelize,
  ...models
};