-- Create general_photos table for non-racer-specific photos
CREATE TABLE IF NOT EXISTS general_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('crowd', 'setup', 'awards', 'venue', 'action', 'general')),
    description TEXT,
    race_id UUID REFERENCES races(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    featured BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_general_photos_race_id ON general_photos(race_id);
CREATE INDEX IF NOT EXISTS idx_general_photos_user_id ON general_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_general_photos_status ON general_photos(status);
CREATE INDEX IF NOT EXISTS idx_general_photos_featured ON general_photos(featured);
CREATE INDEX IF NOT EXISTS idx_general_photos_category ON general_photos(category);
CREATE INDEX IF NOT EXISTS idx_general_photos_uploaded_at ON general_photos(uploaded_at DESC);

-- Use existing updated_at trigger function
CREATE TRIGGER update_general_photos_updated_at 
    BEFORE UPDATE ON general_photos 
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_updated_at();

-- RLS (Row Level Security) policies
ALTER TABLE general_photos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own photos and approved photos
CREATE POLICY "Users can view own photos and approved photos" ON general_photos
    FOR SELECT USING (
        user_id = auth.uid() OR 
        status = 'approved'
    );

-- Policy: Users can insert their own photos
CREATE POLICY "Users can insert own photos" ON general_photos
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own photos
CREATE POLICY "Users can update own photos" ON general_photos
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete own photos" ON general_photos
    FOR DELETE USING (user_id = auth.uid());

-- Policy: Race admins can view all photos
CREATE POLICY "Race admins can view all photos" ON general_photos
    FOR SELECT USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    );

-- Policy: Race admins can update all photos (for approval/rejection)
CREATE POLICY "Race admins can update all photos" ON general_photos
    FOR UPDATE USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    );

-- Policy: Race admins can delete all photos
CREATE POLICY "Race admins can delete all photos" ON general_photos
    FOR DELETE USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    );

-- Add comments
COMMENT ON TABLE general_photos IS 'Stores general race photos uploaded by users (non-racer-specific photos like crowd shots, setup photos, etc.)';
COMMENT ON COLUMN general_photos.category IS 'Category of photo: crowd, setup, awards, venue, action, general';
COMMENT ON COLUMN general_photos.status IS 'Approval status: pending, approved, rejected';
COMMENT ON COLUMN general_photos.featured IS 'Whether photo is featured on homepage/galleries';
COMMENT ON COLUMN general_photos.race_id IS 'Associated race (optional - can be NULL for general photos)';
COMMENT ON COLUMN general_photos.user_id IS 'User who uploaded the photo';