import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export async function createCheckoutSession(priceId: string, successUrl: string, cancelUrl: string, userId?: string) {
  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: { priceId, successUrl, cancelUrl, userId },
  });
  if (error) throw error;
  return data as { id: string; url: string };
}

export function useStripeCheckout() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ priceId, successUrl, cancelUrl }: {
      priceId: string;
      successUrl: string;
      cancelUrl: string;
    }) => {
      if (!user) throw new Error('User must be authenticated');
      
      return createCheckoutSession(priceId, successUrl, cancelUrl, user.id);
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      window.location.href = data.url;
    },
    onError: (error) => {
      console.error('Stripe checkout error:', error);
    }
  });
}
