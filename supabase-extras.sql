-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  BOOKING EXTRAS — Ingredient Budget & Cost Estimates        ║
-- ║  Run in Supabase SQL Editor after the main schema           ║
-- ╚═══════════════════════════════════════════════════════════════╝

-- Status flow: chef submits estimate → client reviews → approved/revision_requested
CREATE TYPE estimate_status AS ENUM ('draft', 'submitted', 'approved', 'revision_requested', 'revised');

-- ─── Cost Estimates (one per booking) ───────────────────────────
CREATE TABLE booking_estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Status
  status estimate_status NOT NULL DEFAULT 'draft',
  revision_number INTEGER NOT NULL DEFAULT 1,
  
  -- Cost breakdown
  ingredients_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  travel_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  equipment_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  other_fees NUMERIC(10,2) NOT NULL DEFAULT 0,
  other_fees_description TEXT,
  
  -- Calculated
  extras_subtotal NUMERIC(10,2) GENERATED ALWAYS AS (
    ingredients_total + travel_fee + equipment_fee + other_fees
  ) STORED,
  
  -- Chef notes to client
  chef_notes TEXT,
  
  -- Client response
  client_notes TEXT,
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_estimates_booking ON booking_estimates(booking_id);
CREATE INDEX idx_estimates_status ON booking_estimates(status);

-- ─── Estimate Line Items (itemized ingredients) ────────────────
CREATE TABLE estimate_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estimate_id UUID NOT NULL REFERENCES booking_estimates(id) ON DELETE CASCADE,
  
  category TEXT NOT NULL DEFAULT 'ingredient',  -- ingredient, protein, produce, dairy, pantry, beverage, equipment, other
  item_name TEXT NOT NULL,
  quantity TEXT,                                 -- e.g. "2kg", "500ml", "6 pieces"
  estimated_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,                                    -- e.g. "organic preferred", "substitute available"
  
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_items_estimate ON estimate_items(estimate_id);

-- ─── Update bookings table with extras totals ──────────────────
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS extras_total NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS grand_total NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS estimate_status estimate_status DEFAULT NULL;

-- ─── Auto-sync estimate approval to booking ────────────────────
CREATE OR REPLACE FUNCTION sync_estimate_to_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    UPDATE bookings SET
      extras_total = NEW.extras_subtotal,
      grand_total = subtotal + NEW.extras_subtotal,
      estimate_status = 'approved',
      updated_at = NOW()
    WHERE id = NEW.booking_id;
  ELSE
    UPDATE bookings SET
      estimate_status = NEW.status,
      updated_at = NOW()
    WHERE id = NEW.booking_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_estimate_updated
  AFTER INSERT OR UPDATE OF status ON booking_estimates
  FOR EACH ROW EXECUTE FUNCTION sync_estimate_to_booking();

-- ─── Updated_at trigger ────────────────────────────────────────
CREATE TRIGGER set_updated_at_estimates
  BEFORE UPDATE ON booking_estimates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RLS ───────────────────────────────────────────────────────
ALTER TABLE booking_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_items ENABLE ROW LEVEL SECURITY;

-- Clients can view estimates for their bookings
CREATE POLICY "Clients view own estimates" ON booking_estimates
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM bookings WHERE id = booking_estimates.booking_id AND client_id = auth.uid())
  );

-- Clients can approve/request revision
CREATE POLICY "Clients update estimate status" ON booking_estimates
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM bookings WHERE id = booking_estimates.booking_id AND client_id = auth.uid())
  );

-- Chefs can manage estimates for their bookings
CREATE POLICY "Chefs manage own estimates" ON booking_estimates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN chefs c ON c.id = b.chef_id
      WHERE b.id = booking_estimates.booking_id AND c.user_id = auth.uid()
    )
  );

-- Admins see all
CREATE POLICY "Admins manage estimates" ON booking_estimates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Line items follow estimate access
CREATE POLICY "View estimate items" ON estimate_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM booking_estimates be
      JOIN bookings b ON b.id = be.booking_id
      WHERE be.id = estimate_items.estimate_id
        AND (b.client_id = auth.uid() OR EXISTS (
          SELECT 1 FROM chefs c WHERE c.id = b.chef_id AND c.user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Chefs manage estimate items" ON estimate_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM booking_estimates be
      JOIN bookings b ON b.id = be.booking_id
      JOIN chefs c ON c.id = b.chef_id
      WHERE be.id = estimate_items.estimate_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage items" ON estimate_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── Admin view update ─────────────────────────────────────────
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
  b.extras_total,
  b.grand_total,
  b.status,
  b.estimate_status,
  b.payment_status,
  b.created_at,
  cp.first_name || ' ' || cp.last_name AS client_name,
  cp.email AS client_email,
  chp.first_name || ' ' || chp.last_name AS chef_name,
  c.rate_per_hour AS chef_rate,
  c.specialities AS chef_specialities
FROM bookings b
JOIN profiles cp ON cp.id = b.client_id
JOIN chefs c ON c.id = b.chef_id
JOIN profiles chp ON chp.id = c.user_id
ORDER BY b.created_at DESC;
