-- ╔═══════════════════════════════════════════════════════════════════╗
-- ║  PLATED PRIVATE — Supabase Database Schema                      ║
-- ║  Run this FIRST in Supabase SQL Editor before deploying the app ║
-- ║  Platform: Private Chef Marketplace (South Africa)              ║
-- ║  Owner: Branded SA Corporation (Pty) Ltd                        ║
-- ╚═══════════════════════════════════════════════════════════════════╝

-- ─────────────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─────────────────────────────────────────────────────────────────────
-- 1. ENUM TYPES
-- ─────────────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('client', 'chef', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'disputed');
CREATE TYPE chef_status AS ENUM ('pending_review', 'active', 'suspended', 'removed');
CREATE TYPE document_type AS ENUM ('sa_id', 'passport', 'qualification', 'portfolio', 'reference', 'other');
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE qualification_type AS ENUM ('formal', 'self_taught');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'paid', 'failed');


-- ─────────────────────────────────────────────────────────────────────
-- 2. PROFILES (extends Supabase auth.users)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'client',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ─────────────────────────────────────────────────────────────────────
-- 3. CHEFS (chef-specific profile data)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE chefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Profile
  bio TEXT,
  specialities TEXT[] NOT NULL DEFAULT '{}',
  
  -- Rates
  rate_per_hour NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_hours INTEGER NOT NULL DEFAULT 2 CHECK (min_hours >= 1 AND min_hours <= 12),
  
  -- Service areas (SA suburbs/regions)
  areas TEXT[] NOT NULL DEFAULT '{}',
  
  -- Qualifications
  qualification_type qualification_type NOT NULL DEFAULT 'self_taught',
  qualification_detail TEXT, -- e.g. "Prue Leith Chef's Academy" or "8 years experience"
  
  -- Status & verification
  status chef_status NOT NULL DEFAULT 'pending_review',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  
  -- Availability
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Stats (denormalized for fast reads)
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  total_bookings INTEGER NOT NULL DEFAULT 0,
  
  -- Admin notes
  admin_notes TEXT,
  suspended_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chefs_status ON chefs(status);
CREATE INDEX idx_chefs_available ON chefs(is_available, status);
CREATE INDEX idx_chefs_specialities ON chefs USING GIN(specialities);
CREATE INDEX idx_chefs_areas ON chefs USING GIN(areas);
CREATE INDEX idx_chefs_rating ON chefs(rating_avg DESC);


-- ─────────────────────────────────────────────────────────────────────
-- 4. CHEF DOCUMENTS (ID, qualifications, portfolio uploads)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE chef_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chef_id UUID NOT NULL REFERENCES chefs(id) ON DELETE CASCADE,
  
  doc_type document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,           -- Supabase Storage path
  file_size INTEGER,                -- bytes
  mime_type TEXT,
  
  status document_status NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chef_docs_chef ON chef_documents(chef_id);


-- ─────────────────────────────────────────────────────────────────────
-- 5. BOOKINGS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_ref TEXT NOT NULL UNIQUE,  -- e.g. PP-001
  
  -- Parties
  client_id UUID NOT NULL REFERENCES profiles(id),
  chef_id UUID NOT NULL REFERENCES chefs(id),
  
  -- Event details
  event_date DATE NOT NULL,
  event_time TIME NOT NULL DEFAULT '18:00',
  guest_count INTEGER NOT NULL DEFAULT 4 CHECK (guest_count >= 1),
  hours INTEGER NOT NULL DEFAULT 3 CHECK (hours >= 1),
  location_area TEXT,
  
  -- Cuisine & requirements
  cuisine_preferences TEXT[] DEFAULT '{}',
  dietary_requirements TEXT,
  special_requests TEXT,
  
  -- Financials
  rate_per_hour NUMERIC(10,2) NOT NULL,          -- locked at booking time
  subtotal NUMERIC(10,2) NOT NULL,               -- rate × hours
  platform_fee_pct NUMERIC(5,4) NOT NULL DEFAULT 0.15,
  platform_fee NUMERIC(10,2) NOT NULL,           -- subtotal × 0.15
  chef_payout NUMERIC(10,2) NOT NULL,            -- subtotal − platform_fee
  
  -- Status
  status booking_status NOT NULL DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Payment
  payment_reference TEXT,          -- Paystack reference
  payment_status TEXT DEFAULT 'unpaid',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_chef ON bookings(chef_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(event_date);
CREATE INDEX idx_bookings_ref ON bookings(booking_ref);

-- Auto-generate booking reference PP-001, PP-002 etc.
CREATE SEQUENCE booking_ref_seq START 1;

CREATE OR REPLACE FUNCTION generate_booking_ref()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_ref := 'PP-' || LPAD(nextval('booking_ref_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_ref
  BEFORE INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.booking_ref IS NULL)
  EXECUTE FUNCTION generate_booking_ref();

-- Auto-calculate financials
CREATE OR REPLACE FUNCTION calculate_booking_financials()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subtotal := NEW.rate_per_hour * NEW.hours;
  NEW.platform_fee := ROUND(NEW.subtotal * NEW.platform_fee_pct, 2);
  NEW.chef_payout := NEW.subtotal - NEW.platform_fee;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calc_booking_financials
  BEFORE INSERT OR UPDATE OF rate_per_hour, hours, platform_fee_pct ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_booking_financials();


-- ─────────────────────────────────────────────────────────────────────
-- 6. REVIEWS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  chef_id UUID NOT NULL REFERENCES chefs(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id),
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Chef can respond
  chef_response TEXT,
  chef_responded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_chef ON reviews(chef_id);
CREATE INDEX idx_reviews_rating ON reviews(chef_id, rating);

-- Auto-update chef rating stats after review
CREATE OR REPLACE FUNCTION update_chef_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chefs SET
    rating_avg = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE chef_id = NEW.chef_id),
    rating_count = (SELECT COUNT(*) FROM reviews WHERE chef_id = NEW.chef_id),
    updated_at = NOW()
  WHERE id = NEW.chef_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_created
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_chef_rating();


-- ─────────────────────────────────────────────────────────────────────
-- 7. CHEF PAYOUTS (tracking commission payouts)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chef_id UUID NOT NULL REFERENCES chefs(id),
  booking_id UUID REFERENCES bookings(id),
  
  amount NUMERIC(10,2) NOT NULL,
  status payout_status NOT NULL DEFAULT 'pending',
  
  -- Payment details
  payment_method TEXT DEFAULT 'bank_transfer',
  payment_reference TEXT,
  
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payouts_chef ON payouts(chef_id);
CREATE INDEX idx_payouts_status ON payouts(status);


-- ─────────────────────────────────────────────────────────────────────
-- 8. PLATFORM SETTINGS (admin-configurable)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Seed default settings
INSERT INTO platform_settings (key, value) VALUES
  ('platform_fee_pct', '"0.15"'),
  ('min_booking_hours', '"2"'),
  ('max_booking_hours', '"12"'),
  ('supported_areas', '["Sandton","Rosebank","Fourways","Bryanston","Houghton","Waterfall","Midrand","Centurion","Pretoria East","Menlyn","Stellenbosch","Camps Bay","Constantia","Umhlanga","Ballito","Bedfordview","Benoni","Boksburg","Kempton Park","Alberton"]'),
  ('supported_specialities', '["Fine Dining","African Cuisine","Asian Fusion","Mediterranean","BBQ & Braai","Vegan & Plant-Based","French Classical","Italian","Pastry & Desserts","Seafood","Indian","Mexican & Latin","Farm-to-Table","Molecular Gastronomy","Comfort Food"]');


-- ─────────────────────────────────────────────────────────────────────
-- 9. UPDATED_AT TRIGGER (auto-update timestamp)
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_chefs BEFORE UPDATE ON chefs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_bookings BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ─────────────────────────────────────────────────────────────────────
-- 10. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chef_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ──
-- Anyone can read basic profiles
CREATE POLICY "Public profiles readable" ON profiles
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ── CHEFS ──
-- Active/verified chefs are publicly visible
CREATE POLICY "Active chefs publicly readable" ON chefs
  FOR SELECT USING (status = 'active' OR user_id = auth.uid());

-- Chefs can insert their own record
CREATE POLICY "Chefs insert own record" ON chefs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Chefs can update their own record
CREATE POLICY "Chefs update own record" ON chefs
  FOR UPDATE USING (user_id = auth.uid());

-- Admins can do anything with chefs
CREATE POLICY "Admins manage chefs" ON chefs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── CHEF DOCUMENTS ──
-- Chefs can manage their own docs
CREATE POLICY "Chefs manage own docs" ON chef_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM chefs WHERE id = chef_documents.chef_id AND user_id = auth.uid())
  );

-- Admins can view all docs
CREATE POLICY "Admins view all docs" ON chef_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update doc status
CREATE POLICY "Admins update doc status" ON chef_documents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── BOOKINGS ──
-- Clients see their own bookings
CREATE POLICY "Clients see own bookings" ON bookings
  FOR SELECT USING (client_id = auth.uid());

-- Chefs see bookings assigned to them
CREATE POLICY "Chefs see assigned bookings" ON bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM chefs WHERE id = bookings.chef_id AND user_id = auth.uid())
  );

-- Clients can create bookings
CREATE POLICY "Clients create bookings" ON bookings
  FOR INSERT WITH CHECK (client_id = auth.uid());

-- Chefs can update booking status (confirm/complete)
CREATE POLICY "Chefs update booking status" ON bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM chefs WHERE id = bookings.chef_id AND user_id = auth.uid())
  );

-- Admins see and manage all bookings
CREATE POLICY "Admins manage bookings" ON bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── REVIEWS ──
-- Reviews are publicly readable
CREATE POLICY "Reviews publicly readable" ON reviews
  FOR SELECT USING (true);

-- Clients can create reviews for their completed bookings
CREATE POLICY "Clients create reviews" ON reviews
  FOR INSERT WITH CHECK (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE id = reviews.booking_id
        AND client_id = auth.uid()
        AND status = 'completed'
    )
  );

-- Chefs can add responses to their reviews
CREATE POLICY "Chefs respond to reviews" ON reviews
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM chefs WHERE id = reviews.chef_id AND user_id = auth.uid())
  );

-- ── PAYOUTS ──
-- Chefs see their own payouts
CREATE POLICY "Chefs see own payouts" ON payouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM chefs WHERE id = payouts.chef_id AND user_id = auth.uid())
  );

-- Admins manage all payouts
CREATE POLICY "Admins manage payouts" ON payouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── PLATFORM SETTINGS ──
-- Readable by all authenticated users
CREATE POLICY "Settings readable" ON platform_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can update
CREATE POLICY "Admins update settings" ON platform_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ─────────────────────────────────────────────────────────────────────
-- 11. STORAGE BUCKETS (run in Supabase Dashboard → Storage)
-- ─────────────────────────────────────────────────────────────────────
-- These need to be created via Supabase Dashboard or API:
--
-- Bucket: chef-documents (private)
--   → For ID docs, qualifications, certificates
--   → Max file size: 10MB
--   → Allowed MIME: image/jpeg, image/png, application/pdf
--
-- Bucket: chef-avatars (public)
--   → For chef profile photos
--   → Max file size: 5MB
--   → Allowed MIME: image/jpeg, image/png, image/webp
--
-- Storage policies (apply via Dashboard):
--   chef-documents: Only the owning chef can upload/read, admins can read all
--   chef-avatars: Anyone can read, only the owning chef can upload/update

-- Note: Storage bucket creation via SQL (Supabase supports this):
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('chef-documents', 'chef-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
  ('chef-avatars', 'chef-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Storage RLS: chef-documents (private)
CREATE POLICY "Chefs upload own docs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chef-documents'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Chefs read own docs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chef-documents'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins read all docs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chef-documents'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Storage RLS: chef-avatars (public read, owner write)
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'chef-avatars');

CREATE POLICY "Chefs upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chef-avatars'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Chefs update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'chef-avatars'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );


-- ─────────────────────────────────────────────────────────────────────
-- 12. USEFUL VIEWS (for admin dashboard queries)
-- ─────────────────────────────────────────────────────────────────────

-- Admin: Booking summary with chef & client names
CREATE OR REPLACE VIEW admin_bookings_view AS
SELECT
  b.id,
  b.booking_ref,
  b.event_date,
  b.event_time,
  b.guest_count,
  b.hours,
  b.location_area,
  b.subtotal,
  b.platform_fee,
  b.chef_payout,
  b.status,
  b.payment_status,
  b.created_at,
  -- Client info
  cp.first_name || ' ' || cp.last_name AS client_name,
  cp.email AS client_email,
  -- Chef info
  chp.first_name || ' ' || chp.last_name AS chef_name,
  c.rate_per_hour AS chef_rate,
  c.specialities AS chef_specialities
FROM bookings b
JOIN profiles cp ON cp.id = b.client_id
JOIN chefs c ON c.id = b.chef_id
JOIN profiles chp ON chp.id = c.user_id
ORDER BY b.created_at DESC;

-- Admin: Revenue summary
CREATE OR REPLACE VIEW admin_revenue_view AS
SELECT
  COUNT(*) AS total_bookings,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_bookings,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_bookings,
  COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_bookings,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_bookings,
  COALESCE(SUM(subtotal) FILTER (WHERE status IN ('completed', 'confirmed')), 0) AS total_revenue,
  COALESCE(SUM(platform_fee) FILTER (WHERE status IN ('completed', 'confirmed')), 0) AS total_commission,
  COALESCE(SUM(chef_payout) FILTER (WHERE status IN ('completed', 'confirmed')), 0) AS total_chef_payouts
FROM bookings;

-- Admin: Chef overview
CREATE OR REPLACE VIEW admin_chefs_view AS
SELECT
  c.id,
  c.user_id,
  p.first_name || ' ' || p.last_name AS name,
  p.email,
  p.phone,
  c.specialities,
  c.rate_per_hour,
  c.min_hours,
  c.areas,
  c.qualification_type,
  c.qualification_detail,
  c.status,
  c.is_verified,
  c.is_available,
  c.rating_avg,
  c.rating_count,
  c.total_bookings,
  c.created_at,
  -- Doc status
  (SELECT COUNT(*) FROM chef_documents cd WHERE cd.chef_id = c.id AND cd.status = 'approved') AS approved_docs,
  (SELECT COUNT(*) FROM chef_documents cd WHERE cd.chef_id = c.id AND cd.status = 'pending') AS pending_docs
FROM chefs c
JOIN profiles p ON p.id = c.user_id
ORDER BY c.created_at DESC;


-- ─────────────────────────────────────────────────────────────────────
-- 13. HELPER FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────

-- Match chefs to a booking request
CREATE OR REPLACE FUNCTION match_chefs(
  p_area TEXT,
  p_cuisines TEXT[] DEFAULT '{}',
  p_hours INTEGER DEFAULT 3,
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  chef_id UUID,
  user_id UUID,
  name TEXT,
  bio TEXT,
  specialities TEXT[],
  rate_per_hour NUMERIC,
  min_hours INTEGER,
  areas TEXT[],
  qualification_type qualification_type,
  qualification_detail TEXT,
  is_verified BOOLEAN,
  rating_avg NUMERIC,
  rating_count INTEGER,
  avatar_url TEXT,
  match_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS chef_id,
    c.user_id,
    (p.first_name || ' ' || p.last_name)::TEXT AS name,
    c.bio,
    c.specialities,
    c.rate_per_hour,
    c.min_hours,
    c.areas,
    c.qualification_type,
    c.qualification_detail,
    c.is_verified,
    c.rating_avg,
    c.rating_count,
    p.avatar_url,
    -- Calculate match score
    (
      CASE WHEN p_area = ANY(c.areas) THEN 10 ELSE 0 END +
      (SELECT COUNT(*)::INTEGER FROM unnest(p_cuisines) cuisine WHERE cuisine = ANY(c.specialities)) * 5 +
      CASE WHEN c.is_verified THEN 3 ELSE 0 END +
      CASE WHEN c.rating_avg >= 4.5 THEN 2 ELSE 0 END
    ) AS match_score
  FROM chefs c
  JOIN profiles p ON p.id = c.user_id
  WHERE c.status = 'active'
    AND c.is_available = true
    AND c.min_hours <= p_hours
    AND (p_area = '' OR p_area = ANY(c.areas))
  ORDER BY match_score DESC, c.rating_avg DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment chef booking count after confirmed booking
CREATE OR REPLACE FUNCTION increment_chef_bookings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE chefs
    SET total_bookings = total_bookings + 1, updated_at = NOW()
    WHERE id = NEW.chef_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_booking_completed
  AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION increment_chef_bookings();


-- ─────────────────────────────────────────────────────────────────────
-- 14. SEED: Create admin user profile (run after signing up as admin)
-- ─────────────────────────────────────────────────────────────────────
-- After you sign up with your admin email, run this to set admin role:
--
-- UPDATE profiles SET role = 'admin' WHERE email = 'mo@beatrootpine.com';
--


-- ─────────────────────────────────────────────────────────────────────
-- ✅ SCHEMA COMPLETE
-- ─────────────────────────────────────────────────────────────────────
-- Tables: profiles, chefs, chef_documents, bookings, reviews, payouts, platform_settings
-- Enums: user_role, booking_status, chef_status, document_type, document_status, qualification_type, payout_status
-- Triggers: auto profile creation, updated_at, booking ref generation, financial calc, rating updates, booking count
-- Views: admin_bookings_view, admin_revenue_view, admin_chefs_view
-- Functions: match_chefs (smart matching), handle_new_user, calculate_booking_financials
-- Storage: chef-documents (private), chef-avatars (public)
-- RLS: Full row-level security on all tables + storage
