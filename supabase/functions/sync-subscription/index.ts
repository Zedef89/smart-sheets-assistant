import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno&no-check';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SB_URL') || Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SB_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SB_ANON_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
    
    // Verify all required environment variables are present
    if (!stripeSecret || !supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('Missing required environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-04-10' });
    
    // Get user from auth header using anon client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(JSON.stringify({ 
        error: 'Auth session missing!',
        details: 'Missing authorization header'
      }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Verifica che il token sia ben formato
    if (!token || token.length < 10) {
      console.error('Invalid token format');
      return new Response(JSON.stringify({ 
        error: 'Auth session missing!',
        details: 'Invalid token format'
      }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Authenticating user with JWT token...');
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 20) + '...');
    
    // Create anon client for user authentication
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    
    if (authError || !user) {
      const errorMessage = authError?.message || 'No user found';
      console.error('Authentication failed:', errorMessage);
      console.error('Auth error details:', authError);
      
      return new Response(JSON.stringify({ 
        error: 'Auth session missing!',
        details: errorMessage,
        timestamp: new Date().toISOString()
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Syncing subscription for user:', user.id);
    
    // Get user's email to search for Stripe customer
    const userEmail = user.email;
    if (!userEmail) {
      return new Response('User email not found', { status: 400 });
    }
    
    // Search for Stripe customer by email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });
    
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No Stripe customer found for this email',
        email: userEmail 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const customer = customers.data[0];
    console.log('Found Stripe customer:', customer.id);
    
    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 10
    });
    
    console.log('Found subscriptions:', subscriptions.data.length);
    
    // Find active or trialing subscription
    const activeSubscription = subscriptions.data.find(sub => 
      sub.status === 'active' || sub.status === 'trialing'
    );
    
    if (activeSubscription) {
      console.log('Found active subscription:', activeSubscription.id);
      
      // Update or create subscription record
      const { data, error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customer.id,
          stripe_subscription_id: activeSubscription.id,
          stripe_price_id: activeSubscription.items.data[0]?.price.id,
          status: activeSubscription.status,
          current_period_start: new Date(activeSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(activeSubscription.current_period_end * 1000).toISOString(),
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Subscription synced successfully',
        subscription: {
          id: activeSubscription.id,
          status: activeSubscription.status,
          customer_id: customer.id
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Check for one-time payments (lifetime purchases)
      const payments = await stripe.paymentIntents.list({
        customer: customer.id,
        limit: 10
      });
      
      const successfulPayment = payments.data.find(payment => 
        payment.status === 'succeeded' && 
        payment.metadata?.type === 'lifetime'
      );
      
      if (successfulPayment) {
        console.log('Found lifetime payment:', successfulPayment.id);
        
        const { data, error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            stripe_customer_id: customer.id,
            stripe_price_id: successfulPayment.metadata?.price_id,
            status: 'active',
            current_period_end: new Date('2099-12-31').toISOString(),
          }, {
            onConflict: 'user_id'
          });
        
        if (error) {
          console.error('Database error:', error);
          throw error;
        }
        
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Lifetime subscription synced successfully',
          payment: {
            id: successfulPayment.id,
            customer_id: customer.id
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ 
        message: 'No active subscription or lifetime purchase found',
        customer_id: customer.id,
        subscriptions_count: subscriptions.data.length,
        payments_count: payments.data.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});