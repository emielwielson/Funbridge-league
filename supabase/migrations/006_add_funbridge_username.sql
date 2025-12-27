-- Add funbridge_username column to users table
-- Make email optional (it's only used internally for Supabase Auth)

ALTER TABLE users ADD COLUMN IF NOT EXISTS funbridge_username TEXT;

-- Update the trigger function to store funbridge username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into our users table when a new auth user is created
  -- Email is used internally by Supabase Auth but we don't require it from users
  INSERT INTO public.users (id, username, password_hash, role, handicap, email, funbridge_username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    '',  -- Password is handled by Supabase Auth
    'player',  -- Default role
    0,  -- Default handicap
    NEW.email,  -- Store email for Supabase Auth (internal use only)
    NEW.raw_user_meta_data->>'funbridge_username'  -- Store Funbridge username
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = NEW.email,
    funbridge_username = COALESCE(NEW.raw_user_meta_data->>'funbridge_username', users.funbridge_username);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

