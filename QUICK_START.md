# Quick Start Guide

## ✅ Completed Setup

1. ✅ Database schema created (6 tables)
2. ✅ RLS policies enabled (24 policies)
3. ✅ Supabase client installed and configured
4. ✅ Auth sync migration applied (auto-syncs Auth users to your users table)

## 🚀 Next Steps: Enable Auth & Create Admin

### Step 1: Enable Supabase Auth (5 minutes)

1. Go to: https://supabase.com/dashboard/project/fmrkxvwyaaolenjiqnox/auth/providers
2. Click on **Email** provider
3. Toggle **Enable Email provider** to ON
4. (Optional) Disable **Confirm email** for development
5. Click **Save**

### Step 2: Create Admin User (2 minutes)

Run this command (replace with your details):

```bash
npm run create-admin <email> <password> <username>
```

**Example:**
```bash
npm run create-admin admin@example.com MySecurePass123 admin
```

Or use the direct command:
```bash
node supabase/create-admin.js admin@example.com MySecurePass123 admin
```

### Step 3: Verify Setup

Test that everything works:

```bash
npm run test:supabase
```

## 📚 Documentation

- **Auth Setup Details**: See `supabase/AUTH_SETUP.md`
- **Database Verification**: See `supabase/VERIFICATION.md`
- **Supabase Setup**: See `supabase/README.md`

## 🔧 Available Commands

- `npm run test:supabase` - Test Supabase connection
- `npm run migrate` - Run database migrations
- `npm run create-admin` - Create admin user (see usage above)

## 🎯 What's Next?

After creating the admin user:

1. Test login with the admin account
2. Start implementing Task 2.0: Authentication & User Management
3. Build registration and login pages

## ⚠️ Important Notes

- The `.env` file contains sensitive credentials - never commit it
- Change the admin password after first login
- Auth users are automatically synced to your `users` table
- New users default to `player` role with `handicap` of 0

