import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserSettings {
  user_id: string;
  // Settings interface - can be extended with other user preferences
}

export function useUserSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as UserSettings | null;
    },
    enabled: !!user
  });
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, ...settings })
        .select()
        .single();
      if (error) throw error;
      return data as UserSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    }
  });
}
