-- Rename username column to name
-- This represents the user's full name (firstname & lastname)

ALTER TABLE users RENAME COLUMN username TO name;

-- Update the unique constraint (if it exists, we'll need to drop and recreate)
-- First, drop the unique constraint on username if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;

-- Add unique constraint on name
ALTER TABLE users ADD CONSTRAINT users_name_key UNIQUE (name);

-- Update the trigger function to use name instead of username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into our users table when a new auth user is created
  -- Email is used internally by Supabase Auth but we don't require it from users
  INSERT INTO public.users (id, name, password_hash, role, handicap, email, funbridge_username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    '',  -- Password is handled by Supabase Auth
    'player',  -- Default role
    0,  -- Default handicap
    NEW.email,  -- Store email for Supabase Auth (internal use only)
    NEW.raw_user_meta_data->>'funbridge_username'  -- Store Funbridge username
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = NEW.email,
    name = COALESCE(NEW.raw_user_meta_data->>'name', users.name),
    funbridge_username = COALESCE(NEW.raw_user_meta_data->>'funbridge_username', users.funbridge_username);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

