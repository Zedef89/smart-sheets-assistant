-- Ensure correct RLS policy for category insertion
-- Drop any existing policies first
DROP POLICY IF EXISTS "Users can create categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can create categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;

-- Create the correct policies
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create categories" ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure RLS is enabled
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;