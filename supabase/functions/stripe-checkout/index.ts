import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.0.0?target=deno";

serve(async (req: Request) => {
  try {
    const body = await req.json();
    const secret = Deno.env.get('STRIPE_SECRET_KEY');
    if (!secret) return new Response('Missing key', { status: 500 });
    const stripe = new Stripe(secret, { apiVersion: '2024-04-10' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        { price: body.priceId, quantity: 1 }
      ],
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
    });
    return new Response(JSON.stringify({ id: session.id, url: session.url }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
});
