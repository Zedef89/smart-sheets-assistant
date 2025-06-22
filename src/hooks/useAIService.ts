
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AIRequest {
  text?: string;
  audio?: string;
  type: 'text' | 'audio';
  action: 'analyze' | 'generate' | 'transcribe';
}

interface AIResponse {
  result: string;
  suggestions?: string[];
  categories?: string[];
}

export function useAIService() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const processWithAI = async (request: AIRequest): Promise<AIResponse | null> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('groq-ai', {
        body: request,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "AI Processing Complete",
        description: "Your request has been processed successfully.",
      });
      return data as AIResponse;
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

  return {
    processWithAI,
    loading
  };
}
