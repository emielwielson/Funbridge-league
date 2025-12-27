/**
 * Run Supabase migrations using direct database connection
 * 
 * Usage: node supabase/run-migrations.js
 * 
 * Requires: DATABASE_URL in .env file
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

// Parse connection string manually to handle special characters
function parseConnectionString(connStr) {
  // Remove quotes if present
  connStr = connStr.replace(/^["']|["']$/g, '');
  
  // Format: postgresql://user:password@host:port/database
  // Handle special characters in password by splitting on @ first
  const protocolEnd = connStr.indexOf('://');
  if (protocolEnd === -1) {
    throw new Error('Invalid connection string format: missing ://');
  }
  
  const atIndex = connStr.lastIndexOf('@');
  if (atIndex === -1) {
    throw new Error('Invalid connection string format: missing @');
  }
  
  const authPart = connStr.substring(protocolEnd + 3, atIndex); // Skip '://'
  const serverPart = connStr.substring(atIndex + 1);
  
  const colonIndex = authPart.indexOf(':');
  if (colonIndex === -1) {
    throw new Error('Invalid connection string format: missing : in auth');
  }
  
  const user = authPart.substring(0, colonIndex);
  const password = authPart.substring(colonIndex + 1);
  
  const serverMatch = serverPart.match(/^([^:]+):(\d+)\/(.+)$/);
  if (!serverMatch) {
    throw new Error('Invalid connection string format: server part');
  }
  
  return {
    user: user,
    password: password,
    host: serverMatch[1],
    port: parseInt(serverMatch[2]),
    database: serverMatch[3],
  };
}

const migrationsDir = path.join(__dirname, 'migrations');
const migrationFiles = [
  '001_initial_schema.sql',
  '002_rls_policies.sql',
  // Skip 003_initial_admin.sql as it's documentation only
];

async function runMigrations() {
  let connectionConfig;
  try {
    connectionConfig = parseConnectionString(DATABASE_URL);
  } catch (error) {
    console.error('❌ Failed to parse DATABASE_URL:', error.message);
    process.exit(1);
  }
  
  const client = new Client(connectionConfig);

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${file} (not found)`);
        continue;
      }

      console.log(`📄 Running migration: ${file}`);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await client.query(sql);
        console.log(`✅ Migration ${file} completed successfully\n`);
      } catch (error) {
        console.error(`❌ Error running ${file}:`);
        console.error(error.message);
        console.error('\n⚠️  Migration may have partially completed. Check the database.\n');
        throw error;
      }
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();

