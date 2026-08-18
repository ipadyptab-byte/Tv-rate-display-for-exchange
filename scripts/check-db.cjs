#!/usr/bin/env node
/**
 * Database connection checker
 * Usage: node scripts/check-db.js
 */

const mysql = require('mysql2/promise');

const connectionStrings = [
  process.env.MARIA_URL,
  process.env.MYSQL_URL,
  process.env.DATABASE_URL,
  'mysql://root:Mangesh@1981@103.159.153.24:3307/devi_jewellers'
].filter(Boolean);

async function testConnection(url) {
  console.log(`\nTesting: ${url.replace(/:[^:@]+@/, ':****@')}`);
  try {
    const pool = mysql.createPool({ 
      uri: url,
      waitForConnections: true,
      connectionLimit: 2,
      connectTimeout: 10000
    });
    
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT 1 as test');
    console.log('✓ Connection successful!');
    
    const [tables] = await conn.query('SHOW TABLES');
    console.log('Tables:', tables.map(t => Object.values(t)[0]));
    
    const [rates] = await conn.query('SELECT * FROM gold_rates WHERE is_active = 1 ORDER BY id DESC LIMIT 1');
    if (rates.length > 0) {
      console.log('Active rate:', {
        id: rates[0].id,
        gold_24k: rates[0].gold_24k_sale,
        source: rates[0].source
      });
    }
    
    conn.release();
    await pool.end();
    return true;
  } catch (err) {
    console.log('✗ Connection failed:', err.message);
    return false;
  }
}

async function main() {
  console.log('=== Database Connection Checker ===\n');
  
  // Test each connection string
  for (const url of connectionStrings) {
    await testConnection(url);
  }
  
  // Check environment variables
  console.log('\n=== Environment Variables ===');
  console.log('MARIA_URL:', process.env.MARIA_URL ? 'Set' : 'Not set');
  console.log('MYSQL_URL:', process.env.MYSQL_URL ? 'Set' : 'Not set');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
}

main().catch(console.error);
