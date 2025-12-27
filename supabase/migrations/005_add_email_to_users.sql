-- Add email column to users table for username-based login
-- This allows us to look up a user's email by their username

ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;

-- Update the trigger function to also store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into our users table when a new auth user is created
  INSERT INTO public.users (id, username, password_hash, role, handicap, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    '',  -- Password is handled by Supabase Auth
    'player',  -- Default role
    0,  -- Default handicap
    NEW.email  -- Store email for username lookup
  )
  ON CONFLICT (id) DO UPDATE
  SET email = NEW.email;  -- Update email if user already exists
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing users to have email (if they don't have it)
-- This queries auth.users to get emails for existing users
UPDATE public.users u
SET email = au.email
FROM auth.users au
WHERE u.id = au.id AND u.email IS NULL;

