// permissions.js
// Role => allowed permission keys
const PERMISSIONS = {
  Admin: [
    'view_dashboard',
    'view_pets', 'add_pet', 'edit_pet', 'delete_pet',
    'view_owners', 'add_owner', 'edit_owner', 'delete_owner',
    'view_appointments', 'add_appointment', 'edit_appointment', 'delete_appointment', 'checkin_appointment',
    'view_medical_records', 'add_medical_record', 'edit_medical_record', 'delete_medical_record',
    'view_veterinarians', 'manage_veterinarians',
    'view_services', 'manage_services',
    'manage_users',
    'manage_settings',
    'view_reports'
  ],
  Veterinarian: [
    'view_dashboard',
    'view_pets', 'edit_pet',
    'view_appointments', 'view_appointments', 'checkin_appointment',
    'view_medical_records', 'add_medical_record', 'edit_medical_record',
    'view_services'
  ],
  Receptionist: [
    'view_dashboard',
    'view_pets', 'add_pet', 'edit_pet',
    'view_owners', 'add_owner', 'edit_owner',
    'view_appointments', 'add_appointment', 'edit_appointment', 'delete_appointment', 'checkin_appointment',
    'view_medical_records' // read-only
  ]
};

module.exports = PERMISSIONS;