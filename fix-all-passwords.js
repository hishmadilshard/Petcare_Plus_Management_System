const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAllPasswords() {
  try {
    console.log('🔧 Fixing all user passwords...\n');

    // Connect to database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'petcare_plus'
    });

    console.log('✅ Connected to database\n');

    // Define users and passwords
    const users = [
      { email: 'admin@petcareplus.lk', password: 'Admin@123', role: 'Admin' },
      { email: 'vet@petcareplus.lk', password: 'Vet@123', role: 'Vet' },
      { email: 'reception@petcareplus.lk', password: 'Reception@123', role: 'Receptionist' }
    ];

    // Generate hashes and update database
    for (const user of users) {
      console.log(`Processing ${user.role}...`);
      
      // Generate hash
      const hash = await bcrypt.hash(user.password, 12);
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Hash: ${hash}`);

      // Update in database
      const [result] = await connection.execute(
        'UPDATE users SET password_hash = ? WHERE email = ?',
        [hash, user.email]
      );

      if (result.affectedRows > 0) {
        console.log('✅ Updated successfully\n');
      } else {
        console.log('⚠️ User not found, creating...');
        
        // Insert new user if doesn't exist
        await connection.execute(
          `INSERT INTO users (full_name, email, phone, password_hash, role, status, email_verified, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, 'Active', 1, NOW(), NOW())`,
          [
            user.role === 'Admin' ? 'System Admin' : 
            user.role === 'Vet' ? 'Dr. John Smith' : 'Sarah Johnson',
            user.email,
            '077' + Math.floor(Math.random() * 10000000),
            hash,
            user.role
          ]
        );
        console.log('✅ User created\n');
      }
    }

    // Verify all users
    console.log('\n📋 Verifying all users...\n');
    const [rows] = await connection.execute(
      'SELECT user_id, full_name, email, role, status FROM users ORDER BY user_id'
    );

    console.table(rows);

    // Test passwords
    console.log('\n🧪 Testing passwords...\n');
    for (const user of users) {
      const [userRows] = await connection.execute(
        'SELECT email, password_hash FROM users WHERE email = ?',
        [user.email]
      );

      if (userRows.length > 0) {
        const dbUser = userRows[0];
        const isValid = await bcrypt.compare(user.password, dbUser.password_hash);
        
        console.log(`${user.role}:`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Password: ${user.password}`);
        console.log(`  Valid: ${isValid ? '✅ YES' : '❌ NO'}`);
        console.log('');
      }
    }

    console.log('\n🎉 All passwords fixed successfully!');
    console.log('\nYou can now login with:');
    console.log('━'.repeat(50));
    console.log('👨‍💼 Admin: admin@petcareplus.lk / Admin@123');
    console.log('🩺 Vet: vet@petcareplus.lk / Vet@123');
    console.log('📋 Reception: reception@petcareplus.lk / Reception@123');
    console.log('━'.repeat(50));

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixAllPasswords();