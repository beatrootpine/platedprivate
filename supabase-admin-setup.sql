-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  ADMIN SETUP FUNCTION                                       ║
-- ║  Run this in Supabase SQL Editor to enable admin claim      ║
-- ║  via the dashboard UI (no SQL needed after this)            ║
-- ╚═══════════════════════════════════════════════════════════════╝

-- This function lets a logged-in user claim admin role by providing
-- the correct setup key. Runs with SECURITY DEFINER to bypass RLS.

CREATE OR REPLACE FUNCTION claim_admin(p_setup_key TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_expected_key TEXT;
BEGIN
  -- Get the calling user's ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check setup key from platform_settings or use hardcoded default
  SELECT value->>'key' INTO v_expected_key
  FROM platform_settings
  WHERE key = 'admin_setup_key';

  -- If no key in settings, use the default
  IF v_expected_key IS NULL THEN
    v_expected_key := 'PlatedPrivate2026!';
  END IF;

  -- Verify key
  IF p_setup_key != v_expected_key THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid setup key');
  END IF;

  -- Promote to admin
  UPDATE profiles SET role = 'admin' WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Admin access granted');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Store the setup key in platform_settings (so you can change it later)
INSERT INTO platform_settings (key, value)
VALUES ('admin_setup_key', '{"key": "PlatedPrivate2026!"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
