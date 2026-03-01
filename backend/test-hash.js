const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function testHash() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'petcare_plus'
  });
  
  const [rows] = await connection.execute(
    'SELECT email, password_hash FROM users WHERE email = ?',
    ['admin@petcareplus.lk']
  );
  
  if (rows.length === 0) {
    console.log('❌ User not found!');
    process.exit(1);
  }
  
  const user = rows[0];
  console.log('Email:', user.email);
  console.log('Stored hash:', user.password_hash);
  console.log('Hash length:', user.password_hash.length);
  console.log('');
  
  // Test various passwords
  const passwords = ['Admin@123', 'admin@123', 'Admin123', 'admin'];
  
  for (const pwd of passwords) {
    const match = await bcrypt.compare(pwd, user.password_hash);
    console.log(`Testing "${pwd}":`, match ? '✅ MATCH!' : '❌ No match');
  }
  
  await connection.end();
  process.exit(0);
}

testHash();