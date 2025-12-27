# Manual Admin User Setup

This is the simplest way to create your first admin user.

## Step 1: Create User in Supabase Auth

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/fmrkxvwyaaolenjiqnox/auth/users
2. Click **Add User** → **Create new user**
3. Fill in:
   - **Email**: Your admin email (e.g., `admin@example.com`)
   - **Password**: A secure password
   - **Auto Confirm User**: ✅ Check this box (so you can login immediately)
4. Click **Create User**
5. **Important**: Copy the **User UID** that appears (you'll need it in the next step)

## Step 2: Make User an Admin

The user will automatically be created in your `users` table by the sync trigger, but with default role `player`. You need to update it to `admin`.

### Option A: Using Supabase SQL Editor (Easiest)

1. Go to **SQL Editor** in your Supabase Dashboard
2. Run this SQL (replace `<USER_UID>` with the UUID you copied):

```sql
UPDATE public.users
SET role = 'admin', updated_at = now()
WHERE id = '<USER_UID>';
```

**Example:**
```sql
UPDATE public.users
SET role = 'admin', updated_at = now()
WHERE id = '123e4567-e89b-12d3-a456-426614174000';
```

3. Click **Run** or press `Ctrl/Cmd + Enter`

### Option B: Using Command Line

If you prefer using the command line:

```bash
node -e "
const { Client } = require('pg');
require('dotenv').config();
const connStr = process.env.DATABASE_URL.replace(/^[\"']|[\"']$/g, '');
const match = connStr.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
const client = new Client({ user: match[1], password: match[2], host: match[3], port: match[4], database: match[5] });
(async () => {
  await client.connect();
  const userId = process.argv[2];
  if (!userId) {
    console.error('Usage: node -e \"...\" <USER_UID>');
    process.exit(1);
  }
  const { rowCount } = await client.query('UPDATE public.users SET role = \$1, updated_at = now() WHERE id = \$2', ['admin', userId]);
  console.log(rowCount > 0 ? '✅ User updated to admin' : '❌ User not found');
  await client.end();
})();
" <USER_UID>
```

## Step 3: Verify Admin User

Check that the user is now an admin:

```sql
SELECT id, username, role, handicap, created_at
FROM public.users
WHERE role = 'admin';
```

You should see your user with `role = 'admin'`.

## Step 4: Test Login

You can now test logging in with:
- **Email**: The email you used when creating the user
- **Password**: The password you set

## Notes

- The user will automatically be synced to your `users` table by the trigger
- The username will be set from the email (part before @) or from user metadata
- You can update the username later if needed
- The user starts with `handicap = 0` by default

## Updating Username (Optional)

If you want to set a custom username:

```sql
UPDATE public.users
SET username = 'admin', updated_at = now()
WHERE id = '<USER_UID>';
```

Replace `'admin'` with your desired username.

