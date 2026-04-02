-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  FIX: handle_new_user trigger                               ║
-- ║  Run this in Supabase SQL Editor to fix signup error        ║
-- ╚═══════════════════════════════════════════════════════════════╝

-- Drop and recreate the trigger function with safer role handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role := 'client';
  v_role_text TEXT;
BEGIN
  -- Safely extract role from metadata
  v_role_text := NEW.raw_user_meta_data->>'role';
  
  IF v_role_text IS NOT NULL AND v_role_text != '' THEN
    BEGIN
      v_role := v_role_text::user_role;
    EXCEPTION WHEN OTHERS THEN
      v_role := 'client';
    END;
  END IF;

  INSERT INTO profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    v_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
