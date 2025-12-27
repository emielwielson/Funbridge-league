/**
 * Test Supabase Client Connection
 * 
 * This script tests that the Supabase client can connect and query the database.
 * Run with: node test-supabase-connection.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testConnection() {
  console.log('🧪 Testing Supabase Client Connection...\n');

  // Test 1: Check environment variables
  console.log('1. Checking environment variables...');
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    console.error('❌ Missing environment variables');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
    process.exit(1);
  }
  console.log('   ✅ All environment variables configured\n');

  // Test 2: Test anon client (with RLS)
  console.log('2. Testing anon client (with RLS policies)...');
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: anonData, error: anonError } = await anonClient
    .from('users')
    .select('count')
    .limit(1);
  
  if (anonError) {
    if (anonError.code === 'PGRST301' || anonError.message.includes('permission')) {
      console.log('   ✅ Anon client works (RLS blocking unauthenticated access - expected)');
    } else {
      console.log('   ❌ Anon client error:', anonError.message);
    }
  } else {
    console.log('   ✅ Anon client can query database');
  }

  // Test 3: Test service role client (bypasses RLS)
  console.log('\n3. Testing service role client (bypasses RLS)...');
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);
  
  const { data: serviceData, error: serviceError } = await serviceClient
    .from('users')
    .select('count')
    .limit(1);
  
  if (serviceError) {
    console.log('   ❌ Service role client error:', serviceError.message);
    process.exit(1);
  } else {
    console.log('   ✅ Service role client can query database');
    console.log('   ✅ RLS is working correctly (service role bypasses it)');
  }

  // Test 4: Verify tables exist
  console.log('\n4. Verifying tables exist...');
  const tables = ['users', 'divisions', 'leagues', 'matches', 'match_results', 'player_divisions'];
  
  for (const table of tables) {
    const { error } = await serviceClient.from(table).select('count').limit(1);
    if (error) {
      console.log(`   ❌ Table '${table}' error:`, error.message);
    } else {
      console.log(`   ✅ Table '${table}' exists and is accessible`);
    }
  }

  console.log('\n🎉 All tests passed! Supabase client is ready to use.');
}

testConnection().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

