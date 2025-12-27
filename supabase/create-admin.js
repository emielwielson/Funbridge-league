/**
 * Create Initial Admin User
 * 
 * This script creates the first admin user in Supabase Auth and syncs it to our users table.
 * 
 * Usage: node supabase/create-admin.js <email> <password> <username>
 * Example: node supabase/create-admin.js admin@example.com SecurePass123 admin
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('❌ Missing arguments');
    console.error('\nUsage: node supabase/create-admin.js <email> <password> <username>');
    console.error('Example: node supabase/create-admin.js admin@example.com SecurePass123 admin');
    process.exit(1);
  }

  const [email, password, username] = args;

  console.log('🔐 Creating admin user...\n');
  console.log('   Email:', email);
  console.log('   Username:', username);
  console.log('   Password:', '*'.repeat(password.length), '\n');

  try {
    // Step 1: Create user in Supabase Auth
    console.log('1. Creating user in Supabase Auth...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,  // Auto-confirm email
      user_metadata: {
        username: username,
      },
    });

    if (authError) {
      console.error('❌ Failed to create auth user:', authError.message);
      process.exit(1);
    }

    console.log('   ✅ Auth user created with ID:', authUser.user.id);

    // Step 2: Wait a moment for the trigger to fire
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Check if user was created in our users table by the trigger
    console.log('\n2. Checking if user was synced to users table...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('   ❌ Error checking user:', checkError.message);
      process.exit(1);
    }

    if (existingUser) {
      console.log('   ✅ User found in users table');
      
      // Step 4: Update user to admin role
      console.log('\n3. Updating user to admin role...');
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          role: 'admin',
          username: username,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.user.id);

      if (updateError) {
        console.error('   ❌ Failed to update user role:', updateError.message);
        process.exit(1);
      }

      console.log('   ✅ User role updated to admin');
    } else {
      // If trigger didn't fire, create user manually
      console.log('   ⚠️  User not found in users table, creating manually...');
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          username: username,
          password_hash: '',  // Password handled by Supabase Auth
          role: 'admin',
          handicap: 0,
        });

      if (insertError) {
        console.error('   ❌ Failed to create user:', insertError.message);
        process.exit(1);
      }

      console.log('   ✅ User created in users table with admin role');
    }

    // Step 5: Verify admin user
    console.log('\n4. Verifying admin user...');
    const { data: adminUser, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (verifyError) {
      console.error('   ❌ Failed to verify user:', verifyError.message);
      process.exit(1);
    }

    console.log('\n🎉 Admin user created successfully!\n');
    console.log('User Details:');
    console.log('   ID:', adminUser.id);
    console.log('   Email:', email);
    console.log('   Username:', adminUser.username);
    console.log('   Role:', adminUser.role);
    console.log('   Handicap:', adminUser.handicap);
    console.log('\n✅ You can now log in with:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('\n⚠️  Remember to change the password after first login!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

createAdmin();

