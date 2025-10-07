-- ========================================
-- Echo Notes Database Schema
-- ========================================

-- Step 1: Create the notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  audio_url TEXT,
  transcription TEXT NOT NULL,
  summary TEXT NOT NULL,
  key_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  action_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Step 4: Create a policy that allows all operations (for demo/testing)
-- WARNING: This allows anyone to read/write ALL notes
-- Update this when you add authentication!
CREATE POLICY "Enable all operations for all users" ON notes
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- Storage Bucket Setup
-- ========================================
-- IMPORTANT: After running this SQL, you need to:
-- 1. Go to Storage in your Supabase dashboard
-- 2. Create a new bucket called "audio-notes"
-- 3. Make it PUBLIC (so audio files can be accessed)
-- 4. Set the following policies:
--
-- Bucket Settings:
--   - Name: audio-notes
--   - Public: Yes
--   - File size limit: 10 MB (or as needed)
--   - Allowed MIME types: audio/webm, audio/wav, audio/mp3
--
-- Storage Policies (create these in the Storage > Policies section):
--   INSERT: Allow anyone to upload (authenticated or anon)
--   SELECT: Allow anyone to download (authenticated or anon)
--   UPDATE: Allow owner only (if using auth)
--   DELETE: Allow owner only (if using auth)

-- ========================================
-- Future: Authentication-based Policies
-- ========================================
-- When you add Supabase Auth, replace the above policy with these:
--
-- DROP POLICY IF EXISTS "Enable all operations for all users" ON notes;
--
-- CREATE POLICY "Users can view their own notes" ON notes
--   FOR SELECT
--   USING (auth.uid() = user_id);
--
-- CREATE POLICY "Users can insert their own notes" ON notes
--   FOR INSERT
--   WITH CHECK (auth.uid() = user_id);
--
-- CREATE POLICY "Users can update their own notes" ON notes
--   FOR UPDATE
--   USING (auth.uid() = user_id);
--
-- CREATE POLICY "Users can delete their own notes" ON notes
--   FOR DELETE
--   USING (auth.uid() = user_id);

-- ========================================
-- Verification Queries
-- ========================================
-- Run these to verify everything is set up correctly:
-- SELECT * FROM notes ORDER BY created_at DESC LIMIT 10;
-- SELECT COUNT(*) as total_notes FROM notes;

