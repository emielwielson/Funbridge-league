/**
 * Check user(s) in the database by name.
 * Run with: node scripts/check-user.js "Sam Verstuyft"
 * Uses .env for NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });

const nameArg = process.argv[2] || 'Sam Verstuyft';

async function checkUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('Looking up users with name containing:', JSON.stringify(nameArg), '\n');

  // Exact match (how login looks up)
  const { data: exact, error: exactError } = await supabase
    .from('users')
    .select('id, name, role, created_at, updated_at')
    .eq('name', nameArg);

  console.log('--- Exact match (name =', JSON.stringify(nameArg) + ') ---');
  if (exactError) {
    console.log('Error:', exactError.message);
  } else {
    console.log('Count:', exact?.length ?? 0);
    if (exact?.length) {
      exact.forEach((row, i) => {
        console.log('  Row', i + 1, ':', row.id, '|', row.name, '|', row.role, '|', row.created_at);
      });
    }
  }

  // Also get password_hash presence and length (not the hash itself) for exact matches
  const { data: withHash, error: hashError } = await supabase
    .from('users')
    .select('id, name, password_hash')
    .eq('name', nameArg);

  if (!hashError && withHash?.length) {
    console.log('\n--- Password hash check (exact match) ---');
    withHash.forEach((row, i) => {
      const len = row.password_hash ? row.password_hash.length : 0;
      const ok = row.password_hash && row.password_hash.startsWith('$2');
      console.log('  Row', i + 1, ':', row.name, '| hash length:', len, '| looks like bcrypt:', ok);
    });
  }

  // Partial match (ilike) to catch typos or extra spaces
  const { data: partial, error: partialError } = await supabase
    .from('users')
    .select('id, name, role, created_at')
    .ilike('name', '%' + nameArg.replace(/%/g, '\\%') + '%');

  console.log('\n--- Partial match (name contains', JSON.stringify(nameArg) + ') ---');
  if (partialError) {
    console.log('Error:', partialError.message);
  } else {
    console.log('Count:', partial?.length ?? 0);
    if (partial?.length) {
      partial.forEach((row, i) => {
        console.log('  Row', i + 1, ':', JSON.stringify(row.name), '| id:', row.id, '|', row.role);
      });
    }
  }
}

checkUser().catch((err) => {
  console.error(err);
  process.exit(1);
});
