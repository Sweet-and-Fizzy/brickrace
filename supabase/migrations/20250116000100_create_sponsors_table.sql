-- Create sponsors table
CREATE TABLE IF NOT EXISTS public.sponsors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    website_url TEXT,
    logo_url TEXT,
    sponsorship_amount DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Policy for public read access (only active sponsors)
CREATE POLICY "Public can view active sponsors" ON public.sponsors
    FOR SELECT
    USING (is_active = true);

-- Policy for admin/race_admin to manage sponsors
CREATE POLICY "Admins can manage sponsors" ON public.sponsors
    FOR ALL
    USING (
        auth.role() = 'authenticated'
        AND public.is_race_admin()
    )
    WITH CHECK (
        auth.role() = 'authenticated'
        AND public.is_race_admin()
    );

-- Create index for ordering
CREATE INDEX idx_sponsors_display_order ON public.sponsors(display_order, created_at DESC);
CREATE INDEX idx_sponsors_active ON public.sponsors(is_active) WHERE is_active = true;