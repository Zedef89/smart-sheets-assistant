import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export function useAccounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: async () => {
      if (!user) return [] as Account[];
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');

      if (error) {
        console.error('Failed to load accounts', error);
        return [] as Account[];
      }

      return data as Account[];
    },
    enabled: !!user,
  });
}

export function useAddAccount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('accounts')
        .insert([{ name, user_id: user.id }])
        .select()
        .single();
      if (error) {
        console.error('Failed to add account', error);
        throw error;
      }
      return data as Account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
