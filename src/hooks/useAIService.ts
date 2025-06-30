
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
      const { data, error } = await supabase.functions.invoke('groq-ai', {
        body: request,
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
      const { data, error } = await supabase.functions.invoke('whisper-transcription', {
        body: { audioData },
      });

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
