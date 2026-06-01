-- ============================================================
-- Wedding Planner - Invitations / Pembagian Undangan
-- AMAN dijalankan di database yang sudah ada (tidak menghapus data).
-- Jalankan di Supabase SQL Editor.
-- ============================================================

-- 1. Kuota per sisi di settings (default 150 / 150 = total 300 pax)
ALTER TABLE wedding_plan_settings
  ADD COLUMN IF NOT EXISTS groom_quota int NOT NULL DEFAULT 150,
  ADD COLUMN IF NOT EXISTS bride_quota int NOT NULL DEFAULT 150;

-- 2. Tabel daftar undangan
CREATE TABLE IF NOT EXISTS wedding_plan_invitations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pax int not null default 1,
  party text not null default 'pria' check (party in ('pria', 'wanita')),
  category text,
  notes text,
  invited boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

ALTER TABLE wedding_plan_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on wedding_plan_invitations" ON wedding_plan_invitations;
CREATE POLICY "Allow all on wedding_plan_invitations"
  ON wedding_plan_invitations FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_wp_invitations_party ON wedding_plan_invitations(party);
