const bcrypt = require('bcryptjs');

async function generatePassword() {
  const passwords = ['Admin@123', 'Vet@123', 'Reception@123'];
  
  console.log('Generating password hashes with salt rounds 12:\n');
  
  for (const pwd of passwords) {
    const hash = await bcrypt.hash(pwd, 12);
    console.log(`Password: ${pwd}`);
    console.log(`Hash: ${hash}`);
    console.log('---\n');
  }
}

generatePassword();