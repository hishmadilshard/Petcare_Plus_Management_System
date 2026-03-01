/**
 * =====================================================
 * PetCare Plus - Database Seeder Entry Point
 * Run: npm run db:seed
 * =====================================================
 */

const { sequelize } = require('../../backend/config/db.config');
const { User, PetOwner, Pet, Appointment, MedicalRecord, Vaccination, Inventory, Invoice, InvoiceItem, Notification } = require('../../backend/models');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // 1. Seed sample owner users
    const ownerPassword = await bcrypt.hash('Owner@123', 12);

    const owners = await User.bulkCreate([
      { full_name: 'Amal Silva',      email: 'amal@gmail.com',    phone: '0771111111', password_hash: ownerPassword, role: 'Owner', status: 'Active', email_verified: true },
      { full_name: 'Nimal Perera',    email: 'nimal@gmail.com',   phone: '0772222222', password_hash: ownerPassword, role: 'Owner', status: 'Active', email_verified: true },
      { full_name: 'Kamali Fernando', email: 'kamali@gmail.com',  phone: '0773333333', password_hash: ownerPassword, role: 'Owner', status: 'Active', email_verified: true },
    ], { ignoreDuplicates: true });

    console.log(`✅ Seeded ${owners.length} owner users`);

    // 2. Fetch all owner users to get their IDs
    const ownerUsers = await User.findAll({ where: { role: 'Owner' } });

    const ownerProfiles = await PetOwner.bulkCreate(
      ownerUsers.map((u, i) => ({
        user_id: u.user_id,
        address: ['12 Galle Road, Colombo 3', '45 Kandy Road, Kurunegala', '78 Main Street, Galle'][i] || 'N/A',
        city:    ['Colombo', 'Kurunegala', 'Galle'][i] || 'Colombo',
        postal_code:       ['00300', '60000', '80000'][i] || '00000',
        emergency_contact: ['0771000001', '0771000002', '0771000003'][i] || '0770000000',
        registered_date: new Date(),
      })),
      { ignoreDuplicates: true }
    );
    console.log(`✅ Seeded ${ownerProfiles.length} pet owner profiles`);

    // 3. Seed pets
    const allOwners = await PetOwner.findAll();
    const petData = [
      { owner_id: allOwners[0].owner_id, pet_name: 'Buddy',    species: 'Dog', breed: 'Golden Retriever', age: 3, gender: 'Male',   weight: 28.5, color: 'Golden',    status: 'Active' },
      { owner_id: allOwners[0].owner_id, pet_name: 'Whiskers', species: 'Cat', breed: 'Persian',          age: 5, gender: 'Female', weight: 4.2,  color: 'White',     status: 'Active' },
      { owner_id: allOwners[1].owner_id, pet_name: 'Rocky',    species: 'Dog', breed: 'German Shepherd',  age: 2, gender: 'Male',   weight: 32.0, color: 'Black/Tan', status: 'Active' },
      { owner_id: allOwners[2].owner_id, pet_name: 'Luna',     species: 'Cat', breed: 'Siamese',          age: 4, gender: 'Female', weight: 3.8,  color: 'Cream',     status: 'Active' },
      { owner_id: allOwners[2].owner_id, pet_name: 'Max',      species: 'Dog', breed: 'Labrador',         age: 6, gender: 'Male',   weight: 30.0, color: 'Black',     status: 'Active' },
    ];
    const pets = await Pet.bulkCreate(petData, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${pets.length} pets`);

    // 4. Add more inventory items
    const inventoryData = [
      { item_name: 'DHPP Vaccine',        category: 'Vaccine',   description: 'Distemper combo vaccine',       quantity: 40, unit: 'vial',   unit_price: 1200.00, reorder_level: 10, status: 'Available' },
      { item_name: 'FVRCP Vaccine',       category: 'Vaccine',   description: 'Feline combo vaccine',          quantity: 30, unit: 'vial',   unit_price: 1100.00, reorder_level: 10, status: 'Available' },
      { item_name: 'IV Drip Set',         category: 'Equipment', description: 'Sterile IV drip sets',          quantity: 20, unit: 'set',    unit_price: 200.00,  reorder_level: 5,  status: 'Available' },
      { item_name: 'Surgical Scissors',   category: 'Equipment', description: 'Stainless steel scissors',      quantity: 5,  unit: 'piece',  unit_price: 1500.00, reorder_level: 2,  status: 'Available' },
      { item_name: 'Deworming Tablets',   category: 'Medicine',  description: 'Broad-spectrum dewormer',       quantity:  8, unit: 'pack',   unit_price: 320.00,  reorder_level: 10, status: 'Low Stock' },
      { item_name: 'Premium Cat Food',    category: 'Food',      description: 'Prescription diet dry food',    quantity: 25, unit: 'bag',    unit_price: 2500.00, reorder_level: 5,  status: 'Available' },
    ];
    const items = await Inventory.bulkCreate(inventoryData, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${items.length} additional inventory items`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Sample login credentials:');
    console.log('   Admin:       admin@petcareplus.lk    / Admin@123');
    console.log('   Vet:         vet@petcareplus.lk      / Vet@123');
    console.log('   Reception:   reception@petcareplus.lk / Reception@123');
    console.log('   Pet Owners:  amal@gmail.com          / Owner@123');
    console.log('               nimal@gmail.com          / Owner@123');
    console.log('               kamali@gmail.com         / Owner@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seed();