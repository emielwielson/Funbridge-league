/**
 * Fix user name: trim leading/trailing whitespace in the database.
 * Run with: node scripts/fix-user-name-whitespace.js "Sam Verstuyft "
 * Or run without args to fix ALL users with leading/trailing spaces.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });

const nameArg = process.argv[2];

async function fixWhitespace() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (nameArg) {
    const trimmed = nameArg.trim();
    if (trimmed !== nameArg) {
      const { data, error } = await supabase
        .from('users')
        .update({ name: trimmed, updated_at: new Date().toISOString() })
        .eq('name', nameArg)
        .select('id, name');
      if (error) {
        console.error('Update failed:', error.message);
        process.exit(1);
      }
      console.log('Updated', data?.length ?? 0, 'row(s). Before:', JSON.stringify(nameArg), '-> After:', JSON.stringify(trimmed));
      if (data?.length) data.forEach((r) => console.log('  id:', r.id, 'name:', JSON.stringify(r.name)));
    } else {
      console.log('Name has no leading/trailing spaces:', JSON.stringify(nameArg));
    }
    return;
  }

  // No arg: fetch all users and fix any with leading/trailing spaces
  const { data: users, error: fetchError } = await supabase.from('users').select('id, name');
  if (fetchError) {
    console.error('Fetch failed:', fetchError.message);
    process.exit(1);
  }
  const toFix = (users || []).filter((u) => u.name !== u.name.trim());
  if (toFix.length === 0) {
    console.log('No users with leading/trailing spaces found.');
    return;
  }
  console.log('Found', toFix.length, 'user(s) with leading/trailing spaces:');
  for (const u of toFix) {
    const trimmed = u.name.trim();
    const { error } = await supabase
      .from('users')
      .update({ name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', u.id);
    if (error) {
      console.error('  Failed to fix', u.id, error.message);
    } else {
      console.log('  Fixed:', JSON.stringify(u.name), '->', JSON.stringify(trimmed), '(id:', u.id + ')');
    }
  }
}

fixWhitespace().catch((err) => {
  console.error(err);
  process.exit(1);
});
