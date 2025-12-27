-- Supabase Auth Integration
-- This migration creates functions and triggers to sync Supabase Auth users with our users table

-- Function to handle new user creation from Supabase Auth
-- This will be called when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into our users table when a new auth user is created
  -- Use email as username (or we can add a separate username field later)
  INSERT INTO public.users (id, username, password_hash, role, handicap)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    '',  -- Password is handled by Supabase Auth
    'player',  -- Default role
    0  -- Default handicap
  )
  ON CONFLICT (id) DO NOTHING;  -- Don't error if user already exists
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user in our table when auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update username in our users table
-- This allows users to set a custom username after signup
CREATE OR REPLACE FUNCTION public.update_username(user_id UUID, new_username TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET username = new_username, updated_at = now()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

