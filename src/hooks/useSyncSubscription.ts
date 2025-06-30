import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSyncSubscription() {
  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No active session');
      }
      
      const response = await supabase.functions.invoke('sync-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (response.error) {
        throw response.error;
      }
      
      return response.data;
    },
  });
}