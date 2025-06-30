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
    // Debug: Log all headers
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Get authorization header (try both cases)
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    console.log('Auth header found:', !!authHeader, 'Length:', authHeader?.length);
    
    if (!authHeader) {
      console.log('Missing authorization header - available headers:', Object.fromEntries(req.headers.entries()));
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
    console.log('JWT token extracted:', jwt.substring(0, 20) + '...');

    // Get user from JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    console.log('Auth result - User:', !!user, 'Error:', authError?.message);
    
    if (authError || !user) {
      console.log('Authentication failed:', authError);
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Check AI usage limits before processing
    const { data: canUse, error: limitError } = await supabase.rpc('increment_ai_transcription', {
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
        error: 'Limite giornaliero raggiunto per le trascrizioni AI. Aggiorna il tuo piano per continuare.' 
      }), { 
        status: 429, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const body = await req.json();
    const { audioData } = body; // Base64 encoded audio
    
    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) {
      return new Response('Missing API key', { status: 500 });
    }

    // Convert base64 to blob
    const audioBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
    
    // Create FormData for Whisper API
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'it'); // Italian language
    formData.append('response_format', 'json');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Whisper API error:', err);
      return new Response(err, {
        status: response.status,
        headers: corsHeaders,
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (e) {
    console.error('Transcription error:', e);
    return new Response(String(e), {
      status: 500,
      headers: corsHeaders,
    });
  }
});