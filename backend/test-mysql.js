const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('🔍 Testing MySQL connection...\n');

  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'petcare_plus',
      connectTimeout: 10000
    });

    console.log('✅ Connected successfully!');

    const [rows] = await connection.query('SELECT DATABASE() as db, VERSION() as version, NOW() as now');
    console.log('✅ Database:', rows[0].db);
    console.log('✅ Version:', rows[0].version);
    console.log('✅ Server time:', rows[0].now);

    // Test tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\n📊 Tables:', tables.length);
    tables.forEach(table => {
      console.log('  -', Object.values(table)[0]);
    });

    await connection.end();
    console.log('\n✅ Connection test passed!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    process.exit(1);
  }
}

testConnection();