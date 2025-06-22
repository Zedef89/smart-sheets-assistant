
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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
      // Replace with your n8n webhook URL
      const n8nWebhookUrl = 'https://your-n8n-instance.com/webhook/ai-finance';
      
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          timestamp: new Date().toISOString(),
          userId: 'user-id-placeholder' // You can get this from auth context
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      toast({
        title: "AI Processing Complete",
        description: "Your request has been processed successfully.",
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

  return {
    processWithAI,
    loading
  };
}
