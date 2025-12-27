# Database Setup Verification Checklist

Use this checklist to verify that the database setup is complete and working correctly.

## Prerequisites

- [ ] Supabase project created
- [ ] Environment variables configured in `.env` file
- [ ] Supabase CLI installed (optional, for local development)

## Migration Verification

### Step 1: Run Migrations

- [ ] Migration `001_initial_schema.sql` executed successfully
- [ ] Migration `002_rls_policies.sql` executed successfully
- [ ] Migration `003_initial_admin.sql` reviewed (admin creation documented)

### Step 2: Verify Tables

Check that all tables exist in your Supabase dashboard (Table Editor):

- [ ] `users` table exists
- [ ] `divisions` table exists
- [ ] `leagues` table exists
- [ ] `matches` table exists
- [ ] `match_results` table exists
- [ ] `player_divisions` table exists

### Step 3: Verify Constraints

Test the following constraints:

- [ ] Unique username constraint: Try inserting two users with the same username (should fail)
- [ ] League status check: Try inserting a league with status 'invalid' (should fail)
- [ ] User role check: Try inserting a user with role 'invalid_role' (should fail)
- [ ] Only one active league: Try creating two leagues with status 'active' (second should fail)
- [ ] Foreign keys: Try creating a match with non-existent league/division/player IDs (should fail)
- [ ] Player-division uniqueness: Try assigning a player to two divisions in the same league (should fail)

### Step 4: Verify Indexes

Check that indexes exist (in Supabase SQL Editor, run):

```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'divisions', 'leagues', 'matches', 'match_results', 'player_divisions');
```

- [ ] Indexes exist for performance-critical queries

### Step 5: Verify RLS Policies

**Important Note**: The RLS policies assume Supabase Auth is being used. If you're using custom authentication, the policies will need to be adjusted.

Test RLS policies (requires authenticated users):

- [ ] Create a test player user
- [ ] Create a test admin user
- [ ] Verify player can only see their own user data
- [ ] Verify admin can see all user data
- [ ] Verify players can read divisions and leagues
- [ ] Verify only admins can create/update/delete divisions and leagues
- [ ] Verify players can only see matches they're part of
- [ ] Verify players can create/update results for their own matches
- [ ] Verify admins can see and update all match results

### Step 6: Test Supabase Client Connection

Create a simple test script:

```typescript
import { supabase } from './lib/supabase/client';

async function test() {
  const { data, error } = await supabase.from('users').select('count');
  console.log('Connection:', { data, error });
}
```

- [ ] Client connects successfully
- [ ] Can query database (with appropriate RLS permissions)

### Step 7: Verify Helper Functions

Check that helper functions exist:

- [ ] `is_admin(user_id)` function exists
- [ ] `is_match_participant(match_uuid, user_uuid)` function exists
- [ ] `update_updated_at_column()` trigger function exists

### Step 8: Verify Triggers

Check that triggers are set up:

- [ ] `update_users_updated_at` trigger exists
- [ ] `update_divisions_updated_at` trigger exists
- [ ] `update_leagues_updated_at` trigger exists
- [ ] `update_match_results_updated_at` trigger exists

Test by updating a record and verifying `updated_at` changes.

## Authentication Integration Note

The RLS policies use `auth.uid()` which requires Supabase Auth integration. If you're using custom authentication:

1. You'll need to adjust the RLS policies to work with your auth system
2. Consider using a custom function to get the current user ID
3. Or use the service role key for server-side operations (bypasses RLS)

## Next Steps

After verification:

1. Create the initial admin user (see `003_initial_admin.sql`)
2. Test authentication flow
3. Proceed with implementing Task 2.0: Authentication & User Management

