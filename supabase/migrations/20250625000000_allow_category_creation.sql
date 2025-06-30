-- Allow authenticated users to create new categories
CREATE POLICY "Authenticated users can create categories" 
  ON public.categories 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);