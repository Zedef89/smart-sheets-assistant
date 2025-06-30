import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Category } from './useCategories';

export function useAddCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Omit<Category, 'id'>) => {
      // Log authentication status
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 Auth Session:', {
        user: session?.user?.id,
        email: session?.user?.email,
        role: session?.user?.role,
        isAuthenticated: !!session?.user,
        accessToken: session?.access_token ? 'present' : 'missing'
      });
      
      // Test if we can read categories (should work with current policy)
      const { data: testRead, error: readError } = await supabase
        .from('categories')
        .select('id')
        .limit(1);
      console.log('🔍 Categories read test:', { success: !readError, error: readError?.message });
      
      // Log the category data being inserted
      console.log('📝 Inserting category:', category);
      
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();
        
      // Log the result
      if (error) {
        console.error('❌ Category insert error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('✅ Category created successfully:', data);
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
