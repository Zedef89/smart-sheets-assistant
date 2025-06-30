import { supabase } from '@/integrations/supabase/client';

export async function createCheckoutSession(priceId: string, successUrl: string, cancelUrl: string) {
  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: { priceId, successUrl, cancelUrl },
  });
  if (error) throw error;
  return data as { id: string; url: string };
}
