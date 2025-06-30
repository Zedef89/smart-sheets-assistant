
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AIRequest {
  text?: string;
  messages?: Array<{ role: string; content: string }>;
  type: 'text';
  action: 'analyze' | 'generate';
}

interface AIResponse {
  result: string;
  suggestions?: string[];
  categories?: string[];
}

interface TranscriptionRequest {
  audioData: string; // Base64 encoded audio
}

interface TranscriptionResponse {
  text: string;
}

export function useAIService() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const processWithAI = async (request: AIRequest): Promise<any | null> => {
    setLoading(true);
    
    try {
      // Get the current session to include auth headers
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('groq-ai', {
        body: request,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      // Check if we have a parsed result from the updated function
      if (data.parsedResult) {
        toast({
          title: "Analisi AI Completata",
          description: "La transazione è stata analizzata con successo.",
        });
        return data.parsedResult;
      }
      
      // Handle parse errors
      if (data.parseError) {
        console.warn('JSON Parse Error:', data.parseError, 'Raw content:', data.rawContent);
        toast({
          title: "Errore Parsing",
          description: "Risposta AI non valida. Riprova.",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Analisi AI Completata",
        description: "La transazione è stata analizzata con successo.",
      });
      return data;
    } catch (error) {
      console.error('AI Service Error:', error);
      toast({
        title: "AI Service Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const transcribeAudio = async (audioData: string): Promise<string | null> => {
    setLoading(true);
    
    try {
      // Get the current session to include auth headers
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Debug logging
      console.log('Session status:', {
        hasSession: !!session,
        hasAccessToken: !!session.access_token,
        tokenLength: session.access_token?.length,
        expiresAt: session.expires_at,
        currentTime: Math.floor(Date.now() / 1000)
      });

      // Try direct fetch instead of supabase.functions.invoke
      const SUPABASE_URL = 'https://agdskvhbmbpowwqyfanr.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZHNrdmhibWJwb3d3cXlmYW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTQ1NjEsImV4cCI6MjA2NjEzMDU2MX0.cvBnDFd6flGlB4jXMT4jHefHzr__svn0Kivt4eONExE';
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/whisper-transcription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ audioData })
      });

      console.log('Direct fetch response status:', response.status);
      console.log('Direct fetch response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Transcription response data:', data);
      
      const error = null; // No error if we reach here

      if (error) {
        throw error;
      }

      toast({
        title: "Trascrizione Completata",
        description: "Il tuo audio è stato trascritto con successo.",
      });
      
      return data.text;
    } catch (error) {
      console.error('Transcription Error:', error);
      toast({
        title: "Errore Trascrizione",
        description: "Impossibile trascrivere l'audio. Riprova.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    processWithAI,
    transcribeAudio,
    loading
  };
}
