-- ============================================================
--  Seed: Menu KHOPI Tjap Chacoh
--  Run once: supabase db query --file supabase/seed.sql
--  ON CONFLICT (sku) DO NOTHING = safe to re-run
-- ============================================================

INSERT INTO products (title, sku, category, price, stock, stock_status, image_url)
VALUES
  -- ── KHOPI ────────────────────────────────────────────────
  ('KHOCASU (Kopi Caramel Susu) ES',  'KHOPI-001', 'KHOPI', 14000, 99, 'in_stock',     NULL),
  ('KHORASU (Kopi Aren Susu) ES',     'KHOPI-002', 'KHOPI', 14000, 99, 'in_stock',     NULL),
  ('KHOBEER (Kopi Beer)',              'KHOPI-003', 'KHOPI', 0,     0,  'coming_soon',  NULL),
  ('KHOPIMADOE',                      'KHOPI-004', 'KHOPI', 10000, 99, 'in_stock',     NULL),
  ('KHOPI DJAHE',                     'KHOPI-005', 'KHOPI', 0,     0,  'coming_soon',  NULL),
  ('KHOPI LEMON',                     'KHOPI-006', 'KHOPI', 0,     0,  'coming_soon',  NULL),
  ('KHOPI BUTTER SCOTCH ES',          'KHOPI-007', 'KHOPI', 15000, 99, 'in_stock',     NULL),
  ('AMERICANO',                       'KHOPI-008', 'KHOPI', 10000, 99, 'in_stock',     NULL),
  ('Air Mineral',                     'KHOPI-009', 'KHOPI', 5000,  99, 'in_stock',     NULL),

  -- ── NON KHOPI ────────────────────────────────────────────
  ('Teh Manis',                       'NKHP-001',  'NON KHOPI', 4000,  99, 'in_stock', NULL),
  ('Teh Kampul',                      'NKHP-002',  'NON KHOPI', 7000,  99, 'in_stock', NULL),
  ('Teh Leci ES',                     'NKHP-003',  'NON KHOPI', 10000, 99, 'in_stock', NULL),
  ('Red Velvet ES',                   'NKHP-004',  'NON KHOPI', 13000, 99, 'in_stock', NULL),
  ('Taro Ice ES',                     'NKHP-005',  'NON KHOPI', 13000, 99, 'in_stock', NULL),
  ('Coklat',                          'NKHP-006',  'NON KHOPI', 13000, 99, 'in_stock', NULL),
  ('Susu Vanila',                     'NKHP-007',  'NON KHOPI', 12000, 99, 'in_stock', NULL),
  ('Susu Jahe PANAS',                 'NKHP-008',  'NON KHOPI', 10000, 99, 'in_stock', NULL),
  ('Jeruk',                           'NKHP-009',  'NON KHOPI', 8000,  99, 'in_stock', NULL),
  ('Joshua (Extra Joss Susu)',        'NKHP-010',  'NON KHOPI', 10000, 99, 'in_stock', NULL),
  ('Matcha ES',                       'NKHP-011',  'NON KHOPI', 15000, 99, 'in_stock', NULL),
  ('Teh Tarik',                       'NKHP-012',  'NON KHOPI', 12000, 99, 'in_stock', NULL),

  -- ── SNACK ────────────────────────────────────────────────
  ('Pisang Goreng',                   'SNCK-001',  'SNACK', 12000, 99, 'in_stock',    NULL),
  ('Pisang Bakar',                    'SNCK-002',  'SNACK', 10000, 99, 'in_stock',    NULL),
  ('Roti Bakar',                      'SNCK-003',  'SNACK', 12000, 99, 'in_stock',    NULL),
  ('Kentang Goreng',                  'SNCK-004',  'SNACK', 9000,  99, 'in_stock',    NULL),
  ('Dimsum',                          'SNCK-005',  'SNACK', 14000, 99, 'in_stock',    NULL),
  ('Cireng',                          'SNCK-006',  'SNACK', 10000, 99, 'in_stock',    NULL),
  ('Lumpia Udang',                    'SNCK-007',  'SNACK', 0,     0,  'coming_soon', NULL),
  ('Mix Plater',                      'SNCK-008',  'SNACK', 16000, 99, 'in_stock',    NULL),
  ('Jajan Ringan',                    'SNCK-009',  'SNACK', 5000,  99, 'in_stock',    NULL),

  -- ── MAKANAN ─────────────────────────────────────────────
  ('Mie Goreng',                      'RICE-001',  'MAKANAN', 7000,  99, 'in_stock', NULL),
  ('Nasi Telor',                      'RICE-002',  'MAKANAN', 10000, 99, 'in_stock', NULL),
  ('Nasi Kulit',                      'RICE-003',  'MAKANAN', 14000, 99, 'in_stock', NULL),
  ('Nasi Ayam Suwir',                 'RICE-004',  'MAKANAN', 14000, 99, 'in_stock', NULL),
  ('Nasi Ayam Lada Hitam',            'RICE-005',  'MAKANAN', 15000, 99, 'in_stock', NULL),
  ('Mie Ayam Punk Shit',              'RICE-006',  'MAKANAN', 15000, 99, 'in_stock', NULL),

  -- ── TOPPING ──────────────────────────────────────────────
  ('Telor',                           'TOPP-001',  'TOPPING', 4000, 99, 'in_stock', NULL),
  ('Bakso',                           'TOPP-002',  'TOPPING', 5000, 99, 'in_stock', NULL),
  ('Sosiss',                          'TOPP-003',  'TOPPING', 3000, 99, 'in_stock', NULL)

ON CONFLICT (sku) DO NOTHING;
