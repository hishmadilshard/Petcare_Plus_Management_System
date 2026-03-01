const bcrypt = require('bcryptjs');

const password = 'Admin@123';
const hash = '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGQMQX0KoOKJT3TTs6YqGKW';

const isValid = bcrypt.compareSync(password, hash);
console.log('Password:', password);
console.log('Valid:', isValid);