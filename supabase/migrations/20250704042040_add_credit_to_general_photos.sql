-- Add credit field to general_photos table
ALTER TABLE general_photos 
ADD COLUMN credit TEXT;

-- Add comment for the new column
COMMENT ON COLUMN general_photos.credit IS 'Optional photographer credit for the photo';