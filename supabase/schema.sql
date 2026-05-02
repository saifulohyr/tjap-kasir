-- Supabase Database Schema and Seeding setup

-- 1. Create Products Table
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

-- 2. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL,
    total_amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL,
    order_type TEXT NOT NULL DEFAULT 'Dine In',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Transaction Items Table
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    title TEXT NOT NULL, -- Storing title historically in case product name changes
    quantity INT NOT NULL,
    price_at_time NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed Initial Data into Products
INSERT INTO public.products (id, title, sku, category, price, stock, stock_status, image_url)
VALUES
    (gen_random_uuid(), 'Kopi Susu Gula Aren', 'CP-202', 'Khopi', 22000, 42, 'In Stock', '/images/kopi-susu.jpg'),
    (gen_random_uuid(), 'Americano Heritage', 'CP-205', 'Khopi', 18000, 18, 'In Stock', '/images/americano.jpg'),
    (gen_random_uuid(), 'Matcha Ceremonial', 'CP-401', 'Non-Khopi', 28000, 5, 'Low Stock', '/images/matcha.jpg'),
    (gen_random_uuid(), 'Nasi Ayam Tjap Chacoh', 'RB-101', 'Rice Bowl', 35000, 22, 'In Stock', '/images/rice-bowl.jpg')
ON CONFLICT (sku) DO NOTHING;

-- Turn off RLS for these tables temporarily to allow immediate connection
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items DISABLE ROW LEVEL SECURITY;

-- If updating existing database, run this to add the new column
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'Dine In';
