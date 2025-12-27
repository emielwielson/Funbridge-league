# Supabase Auth Setup Guide

This guide will help you set up Supabase Authentication and create your first admin user.

## Step 1: Enable Supabase Auth

### 1.1 Enable Email/Password Authentication

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/fmrkxvwyaaolenjiqnox
2. Navigate to **Authentication** → **Providers**
3. Find **Email** in the list and click on it
4. Make sure **Enable Email provider** is toggled ON
5. Configure email settings:
   - **Confirm email**: You can disable this for development, or set up email templates for production
   - **Secure email change**: Recommended to enable
6. Click **Save**

### 1.2 (Optional) Configure Email Templates

If you want email confirmation:
1. Go to **Authentication** → **Email Templates**
2. Customize the templates as needed
3. For development, you can disable email confirmation in the provider settings

### 1.3 Verify Auth is Working

The auth sync migration (`004_auth_sync.sql`) has already been run. This creates:
- A trigger that automatically syncs new Supabase Auth users to your `users` table
- A function to update usernames
- Proper permissions for authenticated users

## Step 2: Create Initial Admin User

### Option A: Using the Script (Recommended)

Use the provided script to create your admin user:

```bash
node supabase/create-admin.js <email> <password> <username>
```

**Example:**
```bash
node supabase/create-admin.js admin@example.com SecurePass123 admin
```

**What the script does:**
1. Creates a user in Supabase Auth with the provided email and password
2. Waits for the sync trigger to create the user in your `users` table
3. Updates the user's role to `admin`
4. Sets the username

**Requirements:**
- Email must be a valid email format
- Password should be at least 6 characters (Supabase requirement)
- Username will be used for display in the app

### Option B: Manual Creation via Dashboard

1. Go to **Authentication** → **Users** in your Supabase Dashboard
2. Click **Add User** → **Create new user**
3. Enter:
   - **Email**: Your admin email (e.g., `admin@example.com`)
   - **Password**: A secure password
   - **Auto Confirm User**: Check this box (or confirm email manually)
4. Click **Create User**
5. Note the **User UID** that appears
6. Go to **SQL Editor** in Supabase Dashboard
7. Run this SQL (replace the values):

```sql
-- Insert admin user into your users table
INSERT INTO public.users (id, username, password_hash, role, handicap)
VALUES (
    '<USER_UID_FROM_STEP_5>',  -- Replace with actual UUID
    'admin',                    -- Your desired username
    '',                         -- Empty, password handled by Supabase Auth
    'admin',                    -- Admin role
    0                           -- Initial handicap
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin', username = 'admin';
```

### Option C: Using Supabase Admin API

You can also create the admin programmatically using the Supabase Admin API. See the `create-admin.js` script for reference.

## Step 3: Verify Admin User

After creating the admin user, verify it works:

### Test Login

1. You can test login using the Supabase client:

```javascript
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'SecurePass123'
});

if (error) {
  console.error('Login failed:', error.message);
} else {
  console.log('Login successful!', data.user.id);
}
```

### Verify Admin Role

Check that the user has admin role in your database:

```sql
SELECT id, username, role, handicap 
FROM users 
WHERE role = 'admin';
```

## Step 4: Test Authentication Flow

### Test User Registration

New users who sign up via Supabase Auth will automatically:
1. Be created in `auth.users` (Supabase Auth)
2. Be synced to `public.users` (your table) via the trigger
3. Have default role of `player`
4. Have default handicap of 0

### Test RLS Policies

The RLS policies should now work correctly:
- Users can only see their own data
- Admins can see all users
- Users can read divisions and leagues
- Only admins can create/update/delete divisions and leagues

## Troubleshooting

### Issue: User created in Auth but not in users table

**Solution:** The trigger might not have fired. You can manually insert:

```sql
INSERT INTO public.users (id, username, password_hash, role, handicap)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
  '',
  'player',
  0
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);
```

### Issue: Cannot login with admin user

**Check:**
1. Email is confirmed (check in Auth → Users)
2. Password is correct
3. User exists in both `auth.users` and `public.users`

### Issue: RLS policies blocking access

**Solution:** Make sure you're authenticated. RLS policies require `auth.uid()` to be set, which happens when a user is logged in via Supabase Auth.

## Next Steps

After setting up Auth and creating the admin:

1. ✅ Test login with the admin account
2. ✅ Verify you can access admin-only features
3. ✅ Proceed with Task 2.0: Authentication & User Management implementation
4. ✅ Build the registration and login pages

## Security Notes

- ⚠️ **Change the admin password** after first login
- ⚠️ **Never commit** `.env` file with credentials
- ⚠️ **Use strong passwords** for admin accounts
- ⚠️ **Enable email confirmation** in production
- ⚠️ **Set up proper email templates** for production use

