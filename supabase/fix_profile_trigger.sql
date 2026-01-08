-- ==============================================================================
-- FIX PROFILE TRIGGER SCRIPT
-- Purpose: Ensure new users automatically get a profile with their Name.
-- ==============================================================================

-- 1. Create Handle New User Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name', -- Extract Name from Metadata
    now(),
    now()
  );
  
  -- Create default settings
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);

  RETURN new;
END;
$$;

-- 2. Bind Trigger to Auth Table
-- Drop if exists first to avoid errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- END OF SCRIPT
-- Run this in your Supabase SQL Editor
-- ==============================================================================
