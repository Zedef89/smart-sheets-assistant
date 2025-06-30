import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.0.0?target=deno";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { priceId, successUrl, cancelUrl, userId } = body;
    
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!stripeSecret || !supabaseUrl || !supabaseServiceKey) {
      return new Response('Missing environment variables', { status: 500 });
    }
    
    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-04-10' });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get or create Stripe customer
    let customerId: string;
    
    if (userId) {
      // Check if user already has a Stripe customer ID
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();
      
      if (subscription?.stripe_customer_id) {
        customerId = subscription.stripe_customer_id;
      } else {
        // Get user email from auth
        const { data: { user } } = await supabase.auth.admin.getUserById(userId);
        
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: user?.email,
          metadata: {
            supabase_user_id: userId
          }
        });
        customerId = customer.id;
      }
    } else {
      // Create anonymous customer for one-time payments
      const customer = await stripe.customers.create();
      customerId = customer.id;
    }

    // Determine session mode based on price type
    const price = await stripe.prices.retrieve(priceId);
    const mode = price.type === 'recurring' ? 'subscription' : 'payment';

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode,
      line_items: [
        { price: priceId, quantity: 1 }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId || '',
        price_id: priceId
      }
    };

    // Add subscription-specific configuration
    if (mode === 'subscription') {
      sessionConfig.subscription_data = {
        metadata: {
          user_id: userId || '',
          price_id: priceId
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    
    return new Response(JSON.stringify({ id: session.id, url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Stripe checkout error:', e);
    return new Response(JSON.stringify({ error: String(e) }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
