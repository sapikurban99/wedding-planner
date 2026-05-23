-- ============================================================
-- Wedding Planner - Full Migration + Seed Data
-- Run ALL at once in Supabase SQL Editor
-- ============================================================

-- ===== DROP EXISTING TABLES =====
DROP TABLE IF EXISTS wedding_plan_savings_deposits CASCADE;
DROP TABLE IF EXISTS wedding_plan_seserahan_items CASCADE;
DROP TABLE IF EXISTS wedding_plan_engagement_items CASCADE;
DROP TABLE IF EXISTS wedding_plan_checklist_items CASCADE;
DROP TABLE IF EXISTS wedding_plan_checklist_categories CASCADE;
DROP TABLE IF EXISTS wedding_plan_timeline CASCADE;
DROP TABLE IF EXISTS wedding_plan_transactions CASCADE;
DROP TABLE IF EXISTS wedding_plan_budgets CASCADE;
DROP TABLE IF EXISTS wedding_plan_settings CASCADE;

-- ============================================================
-- 1. SETTINGS
-- ============================================================
CREATE TABLE wedding_plan_settings (
  id bigint primary key default 1,
  target_amount bigint not null default 0,
  wedding_date date,
  couple_name text default 'Qisti & Aldi',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

ALTER TABLE wedding_plan_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO wedding_plan_settings (id, target_amount, wedding_date, couple_name)
VALUES (1, 70000000, '2026-11-08', 'Qisti & Aldi')
ON CONFLICT (id) DO UPDATE SET
  target_amount = EXCLUDED.target_amount,
  wedding_date = EXCLUDED.wedding_date;

-- ============================================================
-- 2. BUDGET ITEMS
-- ============================================================
CREATE TABLE wedding_plan_budgets (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'Umum',
  item text not null,
  plan bigint not null default 0,
  paid bigint not null default 0,
  status text not null default 'planned' check (status in ('planned', 'paid', 'cancelled')),
  party text default 'joint' check (party in ('pria', 'wanita', 'joint')),
  vendor text,
  notes text,
  "dueDate" date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

ALTER TABLE wedding_plan_budgets ENABLE ROW LEVEL SECURITY;

INSERT INTO wedding_plan_budgets (item, plan, paid, status, category)
VALUES
('Wedding Organizer (WO)', 41700000, 3000000, 'paid', 'Umum'),
('MUA', 9000000, 3600000, 'paid', 'Umum'),
('Souvenir', 1000000, 0, 'planned', 'Umum'),
('Cincin Nikah', 1500000, 0, 'planned', 'Umum'),
('Foto Prewed', 2000000, 0, 'planned', 'Umum'),
('Sisa Seserahan', 1500000, 0, 'planned', 'Umum'),
('Undangan', 300000, 0, 'planned', 'Umum'),
('Bridesmaid + Kel', 5000000, 0, 'planned', 'Umum'),
('Lamaran', 4000000, 0, 'planned', 'Umum'),
('Tambahan Mas Kawin', 4000000, 0, 'planned', 'Umum');

-- ============================================================
-- 3. TRANSACTIONS
-- ============================================================
CREATE TABLE wedding_plan_transactions (
  id uuid primary key default gen_random_uuid(),
  date timestamptz not null default now(),
  "desc" text not null,
  amount bigint not null,
  type text not null check (type in ('income', 'expense')),
  category text not null default 'Lainnya',
  created_at timestamptz default now()
);

ALTER TABLE wedding_plan_transactions ENABLE ROW LEVEL SECURITY;

INSERT INTO wedding_plan_transactions (date, "desc", amount, type, category)
VALUES
('2026-02-11T15:13:09.763Z', 'DP', 3000000, 'expense', 'Wedding Organizer (WO)'),
('2026-02-11T15:13:52.209Z', 'Koreksi Saldo Fisik', 27685273, 'income', 'Lainnya'),
('2026-02-27T12:10:04.408Z', 'Gaji Aldi', 1500000, 'income', 'Income'),
('2026-02-27T12:10:08.481Z', 'Gaji Aldi', 1500000, 'income', 'Income'),
('2026-03-03T07:01:06.605Z', 'DP MUA', 3600000, 'expense', 'MUA'),
('2026-03-03T07:03:58.420Z', 'Koreksi Saldo Fisik', 3051267, 'income', 'Lainnya'),
('2026-04-01T15:58:19.386Z', 'Gaji', 3000000, 'income', 'Income'),
('2026-04-01T16:00:04.381Z', 'Koreksi Saldo Fisik', 55945, 'income', 'Lainnya');

-- ============================================================
-- 4. TIMELINE
-- ============================================================
CREATE TABLE wedding_plan_timeline (
  id uuid primary key default gen_random_uuid(),
  task text not null,
  title text,
  category text not null default 'Umum',
  status text not null default 'Pending' check (status in ('Pending', 'Done', 'planned', 'confirmed', 'completed', 'cancelled')),
  deadline date,
  date date,
  time text,
  location text,
  description text,
  attendees text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

ALTER TABLE wedding_plan_timeline ENABLE ROW LEVEL SECURITY;

INSERT INTO wedding_plan_timeline (task, deadline, status, category)
VALUES
('DP MUA (Urgent)', '2026-02-01', 'Done', 'Vendor'),
('Finalisasi Tanggal Venue', '2026-02-01', 'Done', 'Vendor'),
('Tentukan Tema Dekorasi', '2026-03-01', 'Pending', 'Konsep'),
('Booking Fotografer & Videografer', '2026-03-01', 'Pending', 'Vendor'),
('Booking Hiburan / MC', '2026-04-01', 'Pending', 'Vendor'),
('Beli/Pesan Cincin Nikah', '2026-05-01', 'Pending', 'Perhiasan'),
('Jahit Seragam Keluarga/Bridesmaid', '2026-05-01', 'Pending', 'Busana'),
('Foto Pre-wedding', '2026-06-01', 'Pending', 'Vendor'),
('Urus Surat N1-N4 & Daftar KUA', '2026-07-01', 'Pending', 'Admin'),
('Pelunasan Tambahan Mas Kawin', '2026-07-01', 'Pending', 'Keuangan'),
('Lamaran', '2026-08-09', 'Pending', 'Acara'),
('Cetak Undangan Fisik', '2026-08-10', 'Pending', 'Vendor'),
('Pesan Souvenir', '2026-08-11', 'Pending', 'Vendor'),
('Lengkapi Sisa Seserahan', '2026-09-01', 'Pending', 'Barang'),
('Fitting Baju Pengantin (Final)', '2026-09-01', 'Pending', 'Busana'),
('Buat Undangan Digital', '2026-10-01', 'Pending', 'Digital'),
('Sebar Undangan (H-1 Bulan)', '2026-10-02', 'Pending', 'Admin'),
('Technical Meeting (TM) WO', '2026-10-03', 'Pending', 'Vendor'),
('Perawatan Diri (Pingitan)', '2026-11-01', 'Pending', 'Personal'),
('HARI H (Akad & Resepsi)', '2026-11-08', 'Pending', 'Acara');

-- ============================================================
-- 5. CHECKLIST CATEGORIES
-- ============================================================
CREATE TABLE wedding_plan_checklist_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int default 0,
  created_at timestamptz default now()
);

ALTER TABLE wedding_plan_checklist_categories ENABLE ROW LEVEL SECURITY;

INSERT INTO wedding_plan_checklist_categories (name) VALUES
('Vendor'), ('Konsep'), ('Perhiasan'), ('Busana'), ('Admin'),
('Keuangan'), ('Acara'), ('Barang'), ('Digital'), ('Personal');

-- ============================================================
-- 6. CHECKLIST ITEMS
-- ============================================================
CREATE TABLE wedding_plan_checklist_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references wedding_plan_checklist_categories(id) on delete cascade,
  title text not null,
  description text,
  completed boolean not null default false,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  assigned_to text check (assigned_to in ('pria', 'wanita', 'joint')),
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

ALTER TABLE wedding_plan_checklist_items ENABLE ROW LEVEL SECURITY;

INSERT INTO wedding_plan_checklist_items (category_id, title, due_date, completed) VALUES
((SELECT id FROM wedding_plan_checklist_categories WHERE name = 'Vendor'), 'DP MUA (Urgent)', '2026-02-01', true),
((SELECT id FROM wedding_plan_checklist_categories WHERE name = 'Vendor'), 'Finalisasi Tanggal Venue', '2026-02-01', true),
((SELECT id FROM wedding_plan_checklist_categories WHERE name = 'Konsep'), 'Tentukan Tema Dekorasi', '2026-03-01', false),
((SELECT id FROM wedding_plan_checklist_categories WHERE name = 'Vendor'), 'Booking Fotografer & Videografer', '2026-03-01', false),
((SELECT id FROM wedding_plan_checklist_categories WHERE name = 'Vendor'), 'Booking Hiburan / MC', '2026-04-01', false),
((SELECT id FROM wedding_plan_checklist_categories WHERE name = 'Perhiasan'), 'Beli/Pesan Cincin Nikah', '2026-05-01', false),
((SELECT id FROM wedding_plan_checklist_categories WHERE name = 'Busana'), 'Jahit Seragam Keluarga/Bridesmaid', '2026-05-01', false),
((SELECT id FROM wedding_plan_checklist_categories WHERE name = 'Vendor'), 'Foto Pre-wedding', '2026-06-01', false),
((SELECT id FROM wedding_plan_checklist_categories WHERE name = 'Admin'), 'Urus Surat N1-N4 & Daftar KUA', '2026-07-01', false),
((SELECT id FROM wedding_plan_checklist_categories WHERE name = 'Keuangan'), 'Pelunasan Tambahan Mas Kawin', '2026-07-01', false),
((SELECT id FROM wedding_plan_checklist_categories WHERE name = 'Acara'), 'Lamaran', '2026-08-09', false),
((SELECT id FROM wedding_plan_checklist_categories WHERE name = 'Vendor'), 'Cetak Undangan Fisik', '2026-08-10', false),
((SELECT id FROM wedding_plan_checklist_categories WHERE name = 'Vendor'), 'Pesan Souvenir', '2026-08-11', false),
((SELECT id FROM wedding_plan_checklist_categories WHERE name = 'Barang'), 'Lengkapi Sisa Seserahan', '2026-09-01', false),
((SELECT id FROM wedding_plan_checklist_categories WHERE name = 'Busana'), 'Fitting Baju Pengantin (Final)', '2026-09-01', false),
((SELECT id FROM wedding_plan_checklist_categories WHERE name = 'Digital'), 'Buat Undangan Digital', '2026-10-01', false),
((SELECT id FROM wedding_plan_checklist_categories WHERE name = 'Admin'), 'Sebar Undangan (H-1 Bulan)', '2026-10-02', false),
((SELECT id FROM wedding_plan_checklist_categories WHERE name = 'Vendor'), 'Technical Meeting (TM) WO', '2026-10-03', false),
((SELECT id FROM wedding_plan_checklist_categories WHERE name = 'Personal'), 'Perawatan Diri (Pingitan)', '2026-11-01', false),
((SELECT id FROM wedding_plan_checklist_categories WHERE name = 'Acara'), 'HARI H (Akad & Resepsi)', '2026-11-08', false);

-- ============================================================
-- 7. ENGAGEMENT ITEMS
-- ============================================================
CREATE TABLE wedding_plan_engagement_items (
  id uuid primary key default gen_random_uuid(),
  item text not null,
  category text not null default 'Umum',
  budget_amount bigint not null default 0,
  actual_amount bigint not null default 0,
  party text not null default 'joint' check (party in ('pria', 'wanita', 'joint')),
  status text not null default 'planned' check (status in ('planned', 'ordered', 'done', 'cancelled')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

ALTER TABLE wedding_plan_engagement_items ENABLE ROW LEVEL SECURITY;

INSERT INTO wedding_plan_engagement_items (item, category, budget_amount, actual_amount, party, status) VALUES
('Sewa Venue Lamaran', 'Venue', 2000000, 0, 'joint', 'planned'),
('Dekorasi Lamaran', 'Dekor', 1000000, 0, 'joint', 'planned'),
('Sewa Tenda & Kursi', 'Tenda', 500000, 0, 'joint', 'planned'),
('Catering Keluarga', 'Konsumsi', 500000, 0, 'joint', 'planned');

-- ============================================================
-- 8. SESERAHAN ITEMS (ISI SESUAI DATA EXCEL KAMU)
-- ============================================================
CREATE TABLE wedding_plan_seserahan_items (
  id uuid primary key default gen_random_uuid(),
  item text not null,
  category text not null default 'Umum',
  budget_amount bigint not null default 0,
  actual_amount bigint not null default 0,
  party text not null default 'joint' check (party in ('pria', 'wanita', 'joint')),
  status text not null default 'planned' check (status in ('planned', 'ordered', 'done', 'cancelled')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

ALTER TABLE wedding_plan_seserahan_items ENABLE ROW LEVEL SECURITY;

INSERT INTO wedding_plan_seserahan_items (item, category, budget_amount, actual_amount, party, status) VALUES
('Seserahan Item 1', 'Kategori', 500000, 0, 'joint', 'planned');

-- ============================================================
-- 9. SAVINGS DEPOSITS
-- ============================================================
CREATE TABLE wedding_plan_savings_deposits (
  id uuid primary key default gen_random_uuid(),
  amount bigint not null,
  deposited_by text default 'joint' check (deposited_by in ('pria', 'wanita', 'joint')),
  notes text,
  date timestamptz not null default now(),
  created_at timestamptz default now()
);

ALTER TABLE wedding_plan_savings_deposits ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================
CREATE POLICY "Allow all on wedding_plan_settings"
  ON wedding_plan_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on wedding_plan_budgets"
  ON wedding_plan_budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on wedding_plan_transactions"
  ON wedding_plan_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on wedding_plan_timeline"
  ON wedding_plan_timeline FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on wedding_plan_checklist_categories"
  ON wedding_plan_checklist_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on wedding_plan_checklist_items"
  ON wedding_plan_checklist_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on wedding_plan_engagement_items"
  ON wedding_plan_engagement_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on wedding_plan_seserahan_items"
  ON wedding_plan_seserahan_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on wedding_plan_savings_deposits"
  ON wedding_plan_savings_deposits FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_wp_budgets_category ON wedding_plan_budgets(category);
CREATE INDEX idx_wp_transactions_date ON wedding_plan_transactions(date);
CREATE INDEX idx_wp_transactions_type ON wedding_plan_transactions(type);
CREATE INDEX idx_wp_timeline_status ON wedding_plan_timeline(status);
CREATE INDEX idx_wp_timeline_category ON wedding_plan_timeline(category);
CREATE INDEX idx_wp_checklist_items_category ON wedding_plan_checklist_items(category_id);
CREATE INDEX idx_wp_checklist_items_completed ON wedding_plan_checklist_items(completed);
CREATE INDEX idx_wp_engagement_party ON wedding_plan_engagement_items(party);
CREATE INDEX idx_wp_seserahan_party ON wedding_plan_seserahan_items(party);
CREATE INDEX idx_wp_savings_deposits_date ON wedding_plan_savings_deposits(date);
