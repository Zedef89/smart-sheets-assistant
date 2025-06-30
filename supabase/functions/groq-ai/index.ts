import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
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
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }
  } catch (e) {
    return new Response(String(e), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }
});
