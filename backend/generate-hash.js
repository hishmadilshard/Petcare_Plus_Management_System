const bcrypt = require('bcryptjs');

const password = 'Admin@123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('═══════════════════════════════════════════════');
  console.log('✅ Password Hash Generated Successfully!');
  console.log('═══════════════════════════════════════════════');
  console.log('\nPassword:', password);
  console.log('\nGenerated Hash:');
  console.log(hash);
  console.log('\n═══════════════════════════════════════════════');
  console.log('📋 SQL to Update Database:');
  console.log('═══════════════════════════════════════════════\n');
  console.log(`UPDATE users SET password = '${hash}' WHERE email = 'admin@petcareplus.lk';`);
  console.log('\n═══════════════════════════════════════════════');
  
  // Test the hash immediately
  bcrypt.compare(password, hash, (err, result) => {
    console.log('\n✅ Verification Test:', result ? 'PASSED ✓' : 'FAILED ✗');
    console.log('═══════════════════════════════════════════════\n');
  });
});