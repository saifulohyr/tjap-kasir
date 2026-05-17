-- ============================================================
--  Tjap Chacoh — Full Database Schema & Seed Backup
--  Last updated: 2026-05-17
--
--  ⚠️  PERINGATAN: Script ini AKAN MENGHAPUS semua data lama!
--      Hanya jalankan kalau memang ingin reset total.
--      Kalau hanya ingin tambah kolom, gunakan ALTER TABLE saja.
--
--  Cara pakai (reset total):
--    1. Buka Supabase Dashboard → SQL Editor
--    2. Paste seluruh file ini
--    3. Klik RUN
-- ============================================================

-- ── Drop existing tables (CASCADE = hapus semua relasi) ──
-- DROP TABLE IF EXISTS public.transaction_items CASCADE;
-- DROP TABLE IF EXISTS public.transactions CASCADE;
-- DROP TABLE IF EXISTS public.products CASCADE;
-- ⬆️ UNCOMMENT 3 baris di atas HANYA kalau mau reset total

-- ═══════════════════════════════════════════════════════════
--  1. PRODUCTS TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    stock_status TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ═══════════════════════════════════════════════════════════
--  2. TRANSACTIONS TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL,
    total_amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL,
    order_type TEXT DEFAULT 'Dine In',
    kitchen_status TEXT DEFAULT 'pending',
    customer_name TEXT,
    cashier_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ═══════════════════════════════════════════════════════════
--  3. TRANSACTION ITEMS TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    quantity INT NOT NULL,
    price_at_time NUMERIC NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ═══════════════════════════════════════════════════════════
--  4. SAFE COLUMN ADDITIONS (idempotent — aman di-run berkali-kali)
--     Gunakan bagian ini kalau tabel sudah ada tapi kolom belum ada
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'Dine In';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS kitchen_status TEXT DEFAULT 'pending';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS cashier_name TEXT;
ALTER TABLE public.transaction_items ADD COLUMN IF NOT EXISTS note TEXT;

-- ═══════════════════════════════════════════════════════════
--  5. DISABLE RLS (untuk development, enable di production)
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items DISABLE ROW LEVEL SECURITY;
