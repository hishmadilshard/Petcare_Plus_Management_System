const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function fixPassword() {
  console.log('🔧 Fixing admin password...\n');
  
  const password = 'Admin@123';
  const hash = await bcrypt.hash(password, 12);
  
  console.log('Generated hash:', hash);
  console.log('');
  
  // Test the hash immediately
  const test = await bcrypt.compare(password, hash);
  console.log('Hash test:', test ? '✅ VALID' : '❌ INVALID');
  console.log('');
  
  // Connect to database
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'petcare_plus'
  });
  
  console.log('✅ Connected to database\n');
  
  // Update password
  const [result] = await connection.execute(
    'UPDATE users SET password_hash = ? WHERE email = ?',
    [hash, 'admin@petcareplus.lk']
  );
  
  console.log('✅ Password updated! Rows affected:', result.affectedRows);
  console.log('');
  
  // Verify
  const [rows] = await connection.execute(
    'SELECT email, role, status, LEFT(password_hash, 30) as hash FROM users WHERE email = ?',
    ['admin@petcareplus.lk']
  );
  
  console.log('User details:');
  console.log(rows[0]);
  console.log('');
  
  // Test login
  console.log('Testing password match...');
  const storedHash = rows[0].hash; // This is truncated, get full hash
  const [fullHash] = await connection.execute(
    'SELECT password_hash FROM users WHERE email = ?',
    ['admin@petcareplus.lk']
  );
  
  const match = await bcrypt.compare(password, fullHash[0].password_hash);
  console.log('Password verification:', match ? '✅ PASS' : '❌ FAIL');
  
  await connection.end();
  
  console.log('');
  console.log('✅ Done! Try logging in now with:');
  console.log('   Email: admin@petcareplus.lk');
  console.log('   Password: Admin@123');
  
  process.exit(0);
}

fixPassword().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});