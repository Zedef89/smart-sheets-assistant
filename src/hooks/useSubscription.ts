import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useSyncSubscription } from './useSyncSubscription';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  status: 'active' | 'inactive' | 'canceled' | 'past_due' | 'trialing';
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as Subscription | null;
    },
    enabled: !!user
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (subscriptionData: Partial<Subscription>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          ...subscriptionData
        })
        .select()
        .single();

      if (error) throw error;
      return data as Subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    }
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (subscriptionData: Partial<Subscription>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    }
  });
}

// Helper function to check if user has active subscription
export function useHasActiveSubscription() {
  const { data: subscription } = useSubscription();
  
  return subscription?.status === 'active' || subscription?.status === 'trialing';
}

// Helper function to check if subscription is expired
export function useIsSubscriptionExpired() {
  const { data: subscription } = useSubscription();
  
  if (!subscription || !subscription.current_period_end) {
    return false;
  }
  
  const now = new Date();
  const endDate = new Date(subscription.current_period_end);
  
  return now > endDate && subscription.status !== 'active' && subscription.status !== 'trialing';
}

// Hook per gestire la sincronizzazione intelligente
export function useSmartSubscriptionSync() {
  const { data: subscription, refetch } = useSubscription();
  const syncMutation = useSyncSubscription();
  const isExpired = useIsSubscriptionExpired();
  const hasActive = useHasActiveSubscription();
  
  const syncSubscription = async () => {
    return syncMutation.mutateAsync();
  };
  
  // Sincronizza automaticamente se l'abbonamento è scaduto (non bloccante)
  useEffect(() => {
    if (isExpired) {
      console.log('Subscription expired, syncing...');
      syncSubscription().catch(error => {
        console.error('Auto sync failed for expired subscription:', error);
      });
    }
  }, [isExpired, syncSubscription]);
  
  // Sincronizza periodicamente (ogni 5 minuti) se non ha abbonamento attivo (non bloccante)
  useEffect(() => {
    if (!hasActive) {
      const interval = setInterval(() => {
        console.log('Periodic sync for inactive subscription...');
        syncSubscription().catch(error => {
          console.error('Periodic sync failed:', error);
        });
      }, 5 * 60 * 1000); // 5 minuti
      
      return () => clearInterval(interval);
    }
  }, [hasActive, syncSubscription]);
  
  return {
    subscription,
    isExpired,
    hasActive,
    manualSync: syncSubscription,
    refetch
  };
}