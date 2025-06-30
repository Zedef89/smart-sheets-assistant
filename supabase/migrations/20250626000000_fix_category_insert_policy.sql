-- Drop the existing policy and create a more specific one
DROP POLICY IF EXISTS "Authenticated users can create categories" ON public.categories;

-- Create a new policy that checks for authenticated user ID
CREATE POLICY "Users can create categories" 
  ON public.categories 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);