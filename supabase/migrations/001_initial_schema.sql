-- SermonScriber v2.1 Initial Schema
-- Enable UUID extension (modern Supabase uses pgcrypto's gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Churches table
CREATE TABLE churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  primary_language TEXT NOT NULL DEFAULT 'en',
  secondary_language TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  plan_tier TEXT NOT NULL DEFAULT 'spark',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'member',
  full_name TEXT,
  avatar_url TEXT,
  email TEXT NOT NULL,
  language_preference TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sermons table
CREATE TABLE sermons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  speaker TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_seconds INTEGER,
  audio_url TEXT,
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  language TEXT NOT NULL DEFAULT 'en',
  transcript TEXT,
  processing_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scripture references table
CREATE TABLE scripture_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sermon_id UUID NOT NULL REFERENCES sermons(id) ON DELETE CASCADE,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_start INTEGER,
  verse_end INTEGER,
  translation TEXT,
  detected_text TEXT,
  normalized_ref TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content assets table (clips, summaries, social posts, etc.)
CREATE TABLE content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sermon_id UUID NOT NULL REFERENCES sermons(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  parent_asset_id UUID REFERENCES content_assets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripture_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_assets ENABLE ROW LEVEL SECURITY;

-- Churches policies
CREATE POLICY "Users can view their own church" ON churches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.church_id = churches.id
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own church" ON churches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.church_id = churches.id
      AND profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Profiles policies
CREATE POLICY "Users can view profiles in their church" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.church_id = profiles.church_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Sermons policies
CREATE POLICY "Users can view sermons in their church" ON sermons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.church_id = sermons.church_id
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can create sermons in their church" ON sermons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.church_id = sermons.church_id
      AND profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'editor')
    )
  );

CREATE POLICY "Users can update sermons in their church" ON sermons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.church_id = sermons.church_id
      AND profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'editor')
    )
  );

CREATE POLICY "Users can delete sermons in their church" ON sermons
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.church_id = sermons.church_id
      AND profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Scripture references policies
CREATE POLICY "Users can view scripture references in their church" ON scripture_references
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sermons
      JOIN profiles ON profiles.church_id = sermons.church_id
      WHERE sermons.id = scripture_references.sermon_id
      AND profiles.id = auth.uid()
    )
  );

-- Content assets policies
CREATE POLICY "Users can view content assets in their church" ON content_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sermons
      JOIN profiles ON profiles.church_id = sermons.church_id
      WHERE sermons.id = content_assets.sermon_id
      AND profiles.id = auth.uid()
    )
  );

-- Performance indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_sermons_church_id ON sermons(church_id);
CREATE INDEX IF NOT EXISTS idx_sermons_church_created ON sermons(church_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sermons_status ON sermons(status);
CREATE INDEX IF NOT EXISTS idx_profiles_church_id ON profiles(church_id);
CREATE INDEX IF NOT EXISTS idx_content_assets_sermon_id ON content_assets(sermon_id);
CREATE INDEX IF NOT EXISTS idx_scripture_references_sermon_id ON scripture_references(sermon_id);

-- Create storage bucket for sermon audio
INSERT INTO storage.buckets (id, name, public)
VALUES ('sermon-audio', 'sermon-audio', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for sermon-audio bucket
CREATE POLICY "Users can upload audio to their church" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'sermon-audio' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'editor')
    )
  );

CREATE POLICY "Users can read audio from their church" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'sermon-audio'
  );

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on auth.user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
