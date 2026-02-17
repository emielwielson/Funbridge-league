/**
 * Copy all app data from one Supabase database to another.
 * Use when migrating to a new Supabase project (e.g. different account).
 *
 * Usage: node supabase/copy-data-to-new-db.js
 *
 * Requires in .env:
 *   OLD_DATABASE_URL = current (source) Supabase DB connection string
 *   NEW_DATABASE_URL = new (destination) Supabase DB connection string
 *
 * Run schema migrations on the new DB first (see MIGRATION.md).
 */

const { Client } = require('pg');
require('dotenv').config();

const OLD_DATABASE_URL = process.env.OLD_DATABASE_URL;
const NEW_DATABASE_URL = process.env.NEW_DATABASE_URL;

if (!OLD_DATABASE_URL || !NEW_DATABASE_URL) {
  console.error('❌ Set OLD_DATABASE_URL and NEW_DATABASE_URL in .env');
  process.exit(1);
}

// Same parser as run-migrations.js (handles special chars in password)
function parseConnectionString(connStr) {
  connStr = connStr.replace(/^["']|["']$/g, '');
  const protocolEnd = connStr.indexOf('://');
  if (protocolEnd === -1) throw new Error('Invalid connection string: missing ://');
  const atIndex = connStr.lastIndexOf('@');
  if (atIndex === -1) throw new Error('Invalid connection string: missing @');
  const authPart = connStr.substring(protocolEnd + 3, atIndex);
  const serverPart = connStr.substring(atIndex + 1);
  const colonIndex = authPart.indexOf(':');
  if (colonIndex === -1) throw new Error('Invalid connection string: missing : in auth');
  const user = authPart.substring(0, colonIndex);
  const password = authPart.substring(colonIndex + 1);
  const serverMatch = serverPart.match(/^([^:]+):(\d+)\/(.+)$/);
  if (!serverMatch) throw new Error('Invalid connection string: server part');
  return {
    user,
    password,
    host: serverMatch[1],
    port: parseInt(serverMatch[2], 10),
    database: serverMatch[3],
  };
}

const TABLE_ORDER = [
  'users',
  'divisions',
  'leagues',
  'player_divisions',
  'matches',
  'match_results',
];

async function copyTable(oldClient, newClient, table) {
  const res = await oldClient.query(`SELECT * FROM ${table}`);
  const rows = res.rows;
  const fields = res.fields;
  if (rows.length === 0) {
    console.log(`   ${table}: 0 rows (skip)`);
    return;
  }
  const columns = fields.map((f) => f.name);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const insertSql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`;
  for (const row of rows) {
    const values = columns.map((c) => row[c]);
    await newClient.query(insertSql, values);
  }
  console.log(`   ${table}: ${rows.length} rows copied`);
}

async function main() {
  let oldConfig;
  let newConfig;
  try {
    oldConfig = parseConnectionString(OLD_DATABASE_URL);
    newConfig = parseConnectionString(NEW_DATABASE_URL);
  } catch (e) {
    console.error('❌ Invalid connection string:', e.message);
    process.exit(1);
  }

  const oldClient = new Client(oldConfig);
  const newClient = new Client(newConfig);

  try {
    console.log('🔌 Connecting to OLD database...');
    await oldClient.connect();
    console.log('🔌 Connecting to NEW database...');
    await newClient.connect();
    console.log('');

    for (const table of TABLE_ORDER) {
      console.log(`📋 Copying ${table}...`);
      await copyTable(oldClient, newClient, table);
    }

    console.log('\n🎉 Data copy finished.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await oldClient.end();
    await newClient.end();
  }
}

main();
