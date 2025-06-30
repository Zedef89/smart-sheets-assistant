import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AIUsage {
  ai_transcriptions: number;
  ai_natural_inputs: number;
  has_subscription: boolean;
  can_use_transcription: boolean;
  can_use_natural_input: boolean;
}

export function useAIUsage() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai-usage', user?.id],
    queryFn: async (): Promise<AIUsage | null> => {
      if (!user) return null;

      const { data, error } = await supabase.rpc('get_current_ai_usage', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching AI usage:', error);
        throw error;
      }

      return data as AIUsage;
    },
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  });
}

export function useIncrementAITranscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('increment_ai_transcription', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error incrementing AI transcription:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Limite giornaliero raggiunto per le trascrizioni AI');
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch AI usage data
      queryClient.invalidateQueries({ queryKey: ['ai-usage', user?.id] });
    },
  });
}

export function useIncrementAINaturalInput() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('increment_ai_natural_input', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error incrementing AI natural input:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Limite giornaliero raggiunto per gli input naturali AI');
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch AI usage data
      queryClient.invalidateQueries({ queryKey: ['ai-usage', user?.id] });
    },
  });
}

// Helper hooks for easier usage
export function useCanUseAITranscription() {
  const { data: usage } = useAIUsage();
  return usage?.can_use_transcription ?? false;
}

export function useCanUseAINaturalInput() {
  const { data: usage } = useAIUsage();
  return usage?.can_use_natural_input ?? false;
}

export function useAIUsageStats() {
  const { data: usage } = useAIUsage();
  
  if (!usage) {
    return {
      transcriptionsUsed: 0,
      naturalInputsUsed: 0,
      transcriptionsRemaining: 0,
      naturalInputsRemaining: 0,
      hasSubscription: false,
      usagePercentage: 0
    };
  }

  const transcriptionsRemaining = usage.has_subscription ? 'illimitato' : Math.max(0, 2 - usage.ai_transcriptions);
  const naturalInputsRemaining = usage.has_subscription ? 'illimitato' : Math.max(0, 2 - usage.ai_natural_inputs);
  
  const usagePercentage = usage.has_subscription ? 0 : 
    ((usage.ai_transcriptions + usage.ai_natural_inputs) / 4) * 100;

  return {
    transcriptionsUsed: usage.ai_transcriptions,
    naturalInputsUsed: usage.ai_natural_inputs,
    transcriptionsRemaining,
    naturalInputsRemaining,
    hasSubscription: usage.has_subscription,
    usagePercentage
  };
}