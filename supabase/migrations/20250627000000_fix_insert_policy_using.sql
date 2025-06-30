-- Fix the INSERT policy - INSERT policies only support WITH CHECK
DROP POLICY IF EXISTS "Users can create categories" ON public.categories;

-- Create INSERT policy with only WITH CHECK (correct syntax)
CREATE POLICY "Users can create categories" 
  ON public.categories 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);