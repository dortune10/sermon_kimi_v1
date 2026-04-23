-- Fix infinite recursion in profiles RLS policy
-- The original policy queried `profiles` inside a policy ON `profiles`,
-- causing PostgreSQL infinite recursion.

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles in their church" ON profiles;

-- Replace with a simple self-view policy (avoids recursion)
-- MVP: users can only view their own profile.
-- Church directory can be added later via a SECURITY DEFINER function.
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Also fix churches SELECT policy to avoid recursion risk
DROP POLICY IF EXISTS "Users can view their own church" ON churches;
CREATE POLICY "Users can view their own church" ON churches
  FOR SELECT USING (
    id IN (
      SELECT church_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Fix storage policies: the profiles subquery now works since profiles policy
-- no longer references itself. But we also simplify to be safe.
DROP POLICY IF EXISTS "Users can upload audio to their church" ON storage.objects;
DROP POLICY IF EXISTS "Users can read audio from their church" ON storage.objects;

-- Simplified storage policies: any authenticated user can upload/read
-- from sermon-audio bucket. RLS on sermons table already controls
-- who can see which sermons exist.
CREATE POLICY "Users can upload audio" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'sermon-audio'
  );

CREATE POLICY "Users can read audio" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'sermon-audio'
  );
