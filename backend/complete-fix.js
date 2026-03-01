const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function completeFix() {
  try {
    console.log('🔧 Complete Password Fix\n');
    
    // Connect to database
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'petcare_plus'
    });
    
    console.log('✅ Connected to database\n');
    
    // Generate fresh hash
    const password = 'Admin@123';
    const hash = await bcrypt.hash(password, 12);
    
    console.log('Password:', password);
    console.log('New hash:', hash);
    console.log('Hash length:', hash.length);
    console.log('');
    
    // Verify hash works
    const testMatch = await bcrypt.compare(password, hash);
    console.log('Hash verification test:', testMatch ? '✅ PASS' : '❌ FAIL');
    console.log('');
    
    if (!testMatch) {
      console.error('❌ Generated hash is invalid!');
      process.exit(1);
    }
    
    // Update database
    const [result] = await conn.execute(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hash, 'admin@petcareplus.lk']
    );
    
    console.log('✅ Database updated! Rows affected:', result.affectedRows);
    console.log('');
    
    // Verify stored hash
    const [rows] = await conn.execute(
      'SELECT email, password_hash FROM users WHERE email = ?',
      ['admin@petcareplus.lk']
    );
    
    if (rows.length === 0) {
      console.error('❌ User not found after update!');
      process.exit(1);
    }
    
    const storedHash = rows[0].password_hash;
    console.log('Stored hash:', storedHash);
    console.log('Stored hash length:', storedHash.length);
    console.log('');
    
    // Final verification
    const finalMatch = await bcrypt.compare(password, storedHash);
    console.log('Final verification:', finalMatch ? '✅ PASS' : '❌ FAIL');
    console.log('');
    
    if (finalMatch) {
      console.log('✅✅✅ SUCCESS! Password is now fixed! ✅✅✅');
      console.log('');
      console.log('Now login with:');
      console.log('  Email: admin@petcareplus.lk');
      console.log('  Password: Admin@123');
    } else {
      console.error('❌ Something went wrong! Hashes don\'t match!');
    }
    
    await conn.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

completeFix();