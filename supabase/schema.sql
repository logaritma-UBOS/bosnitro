-- ==============================================================================
-- UBOS: ANTI-LOSS INTERLOCKING NITROGEN & RETAIL MULTI-BRANCH SYSTEM
-- Supabase (PostgreSQL) DDL Schema & Initial Seeds
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Branches Table (4 Target Cabang)
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Products / Catalog Table (Nitrogen & Retail Interlocking)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL, -- Nullable for global items
    category TEXT NOT NULL CHECK (category IN ('NITROGEN', 'RETAIL')),
    vehicle_type TEXT CHECK (vehicle_type IN ('MOTOR', 'MOBIL')),
    service_type TEXT CHECK (service_type IN ('TAMBAH', 'FULL')),
    name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    cost_price NUMERIC NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    barcode TEXT,
    timer_seconds INTEGER DEFAULT 0, -- Solenoid valve duration (seconds) for Nitrogen
    requires_photo BOOLEAN NOT NULL DEFAULT true, -- Interlocking mandatory photo requirement
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Transactions Table (Audited Transactions)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    cashier_id TEXT, -- User ID or Name
    total_amount NUMERIC NOT NULL DEFAULT 0,
    vehicle_photo_url TEXT, -- Cloudinary URL for Nitrogen License Plate
    used_bottle_photo_url TEXT, -- Cloudinary URL for Used Oil Bottle
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'PENDING', 'CANCELLED')),
    payment_method TEXT NOT NULL DEFAULT 'CASH',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Transaction Items Table
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    qty INTEGER NOT NULL DEFAULT 1,
    price NUMERIC NOT NULL DEFAULT 0,
    hpp NUMERIC NOT NULL DEFAULT 0,
    subtotal NUMERIC NOT NULL DEFAULT 0
);

-- 6. Fraud Alerts / IoT Logs Table
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    alert_type TEXT NOT NULL, -- UNAUTHORIZED_FLOW, TAMPER_DETECTED, etc.
    message TEXT NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Shift Closings Table (Blind Cashier Closing)
CREATE TABLE IF NOT EXISTS public.shift_closings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    cashier_id TEXT NOT NULL,
    cashier_name TEXT NOT NULL,
    physical_cash NUMERIC NOT NULL DEFAULT 0,
    system_revenue NUMERIC NOT NULL DEFAULT 0,
    discrepancy NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    closed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Enable Supabase Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fraud_alerts;

-- 9. Initial Seeds for 4 Target Branches
INSERT INTO public.branches (id, name, location) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Tambun 1', 'Jl. Sultan Hasanudin, Tambun Selatan'),
    ('00000000-0000-0000-0000-000000000002', 'Tambun 2', 'Jl. Rawa Kalong, Tambun Utara'),
    ('00000000-0000-0000-0000-000000000003', 'Cibitung 1', 'Jl. Raya Fatahillah, Cibitung'),
    ('00000000-0000-0000-0000-000000000004', 'Cibitung 2', 'Jl. Selang Cau, Wanasari, Cibitung')
ON CONFLICT (id) DO NOTHING;

-- 10. Initial Seeds for Standard Nitrogen Services
INSERT INTO public.products (category, vehicle_type, service_type, name, price, cost_price, timer_seconds, requires_photo) VALUES
    ('NITROGEN', 'MOTOR', 'TAMBAH', 'Tambah Angin Motor', 5000, 500, 15, true),
    ('NITROGEN', 'MOTOR', 'FULL', 'Isi Angin Full Motor', 10000, 1000, 35, true),
    ('NITROGEN', 'MOBIL', 'TAMBAH', 'Tambah Angin Mobil', 10000, 1000, 30, true),
    ('NITROGEN', 'MOBIL', 'FULL', 'Isi Angin Full Mobil', 25000, 2500, 90, true);

-- 11. Initial Seeds for Retail & Oli Goods
INSERT INTO public.products (category, name, barcode, price, cost_price, stock, requires_photo) VALUES
    ('RETAIL', 'Oli AHM MPX2 Matic 0.8L', '8999901001', 52000, 42000, 35, true),
    ('RETAIL', 'Oli Shell Advance AX7 10W-40 0.8L', '8999901002', 65000, 53000, 20, true),
    ('RETAIL', 'Oli Yamalube Silver 0.8L', '8999901003', 48000, 39000, 15, true),
    ('RETAIL', 'Minyak Rem Jumbo Dot 3 50ml', '8999901004', 15000, 9000, 40, true),
    ('RETAIL', 'Busi Denso U27EPR9 Motor', '8999901005', 25000, 16000, 25, false);
