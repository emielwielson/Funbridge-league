-- Initial admin user creation
-- This migration creates the first admin user in the system
-- 
-- IMPORTANT: 
-- 1. This migration should be run manually after setting up Supabase Auth
-- 2. The password should be changed immediately after first login
-- 3. Replace 'your_secure_password' with a strong password before running
-- 4. Replace 'admin_username' with the desired admin username
--
-- NOTE: This assumes you're using Supabase Auth. If using custom auth,
-- you'll need to hash the password using bcrypt or similar and insert directly
-- into the users table.

-- Option 1: If using Supabase Auth (recommended)
-- First, create the user in Supabase Auth dashboard or via API
-- Then run this to set the role and initial data:

-- Example: After creating user in Supabase Auth with email 'admin@example.com'
-- You would get the auth.users.id, then insert into our users table:
-- 
-- INSERT INTO users (id, username, password_hash, role, handicap)
-- VALUES (
--     'auth_user_uuid_here',  -- Get this from auth.users after creating in Supabase Auth
--     'admin_username',
--     '',  -- Password is handled by Supabase Auth
--     'admin',
--     0
-- );

-- Option 2: If using custom authentication (not recommended, but supported by schema)
-- You would hash the password using bcrypt and insert:
--
-- INSERT INTO users (username, password_hash, role, handicap)
-- VALUES (
--     'admin_username',
--     '$2b$10$...',  -- bcrypt hash of password
--     'admin',
--     0
-- );

-- For now, this is a placeholder migration that documents the process.
-- The actual admin creation should be done through:
-- 1. Supabase Dashboard -> Authentication -> Add User
-- 2. Or via Supabase Auth API
-- 3. Then manually insert into users table with the auth.users.id

-- This migration file serves as documentation for the admin creation process.
-- To actually create an admin:
-- 
-- Step 1: Create user in Supabase Auth (via dashboard or API)
-- Step 2: Note the user's UUID from auth.users
-- Step 3: Run the following SQL in Supabase SQL Editor:
--
-- INSERT INTO users (id, username, password_hash, role, handicap)
-- VALUES (
--     '<auth_user_uuid>',  -- Replace with actual UUID from auth.users
--     'admin',             -- Replace with desired username
--     '',                  -- Empty, password handled by Supabase Auth
--     'admin',
--     0
-- );

-- Alternatively, if you want to create a script to do this programmatically,
-- you would:
-- 1. Use Supabase Admin API to create auth user
-- 2. Get the returned user ID
-- 3. Insert into users table with that ID

