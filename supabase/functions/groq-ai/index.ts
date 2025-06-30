import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, Authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header (try both cases)
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Missing authorization header', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract JWT token from authorization header
    const jwt = authHeader.replace('Bearer ', '');

    // Get user from JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Check AI usage limits before processing
    const { data: canUse, error: limitError } = await supabase.rpc('increment_ai_natural_input', {
      p_user_id: user.id
    });

    if (limitError) {
      console.error('Error checking AI limits:', limitError);
      return new Response('Error checking usage limits', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    if (!canUse) {
      return new Response(JSON.stringify({ 
        error: 'Limite giornaliero raggiunto per gli input naturali AI. Aggiorna il tuo piano per continuare.' 
      }), { 
        status: 429, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const body = await req.json();
    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) {
      return new Response('Missing API key', { status: 500 });
    }
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: body.messages ?? [{ role: 'user', content: body.text ?? '' }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(err, { status: response.status });
    }
    const data = await response.json();
    
    // Extract JSON from markdown code blocks if present
    let content = data.choices?.[0]?.message?.content || '';
    
    // Remove markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      content = jsonMatch[1].trim();
    }
    
    // Try to parse the extracted content as JSON
    try {
      const parsedContent = JSON.parse(content);
      // Return the parsed JSON directly for transaction processing
      return new Response(JSON.stringify({
        ...data,
        parsedResult: parsedContent
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    } catch (parseError) {
      // If parsing fails, return original response with error info
      return new Response(JSON.stringify({
        ...data,
        parseError: 'Failed to parse JSON from response',
        rawContent: content
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (e) {
    return new Response(String(e), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
