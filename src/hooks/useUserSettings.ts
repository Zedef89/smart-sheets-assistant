import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserSettings {
  user_id: string;
  google_sheet_id: string | null;
  google_sheet_title: string | null;
  created_at: string;
}

export function useUserSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error, status } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // row not found, create an empty settings record
        if (error.code === 'PGRST116') {
          const { data: inserted } = await supabase
            .from('user_settings')
            .insert({ user_id: user.id })
            .select()
            .single();
          return inserted as UserSettings;
        }
        // table might not exist in some environments
        if (status === 404) {
          console.warn('user_settings table not found');
          return null;
        }
        console.error('Failed to load user settings', error);
        return null;
      }

      return data as UserSettings | null;
    },
    enabled: !!user,
  });
}

export function useSaveUserSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({ ...settings, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as UserSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
  });
}
