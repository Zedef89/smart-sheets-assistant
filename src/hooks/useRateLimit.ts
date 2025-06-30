import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHasActiveSubscription, useSmartSubscriptionSync } from './useSubscription';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitState {
  aiTranscriptions: number;
  aiNaturalInputs: number;
  lastResetDate: string;
}

const DAILY_FREE_LIMIT = 2; // 2 trascrizioni + 2 input naturali = 4 richieste totali
const STORAGE_KEY = 'ai_usage_';

export function useRateLimit() {
  const { user } = useAuth();
  const hasActiveSubscription = useHasActiveSubscription();
  const { isExpired, hasActive } = useSmartSubscriptionSync();
  const [usage, setUsage] = useState<RateLimitState>({
    aiTranscriptions: 0,
    aiNaturalInputs: 0,
    lastResetDate: new Date().toDateString()
  });
  const [loading, setLoading] = useState(true);

  // Carica l'utilizzo dal localStorage
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const storageKey = `${STORAGE_KEY}${user.id}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      const parsedUsage = JSON.parse(stored);
      const today = new Date().toDateString();
      
      // Reset se è un nuovo giorno
      if (parsedUsage.lastResetDate !== today) {
        const resetUsage = {
          aiTranscriptions: 0,
          aiNaturalInputs: 0,
          lastResetDate: today
        };
        setUsage(resetUsage);
        localStorage.setItem(storageKey, JSON.stringify(resetUsage));
      } else {
        setUsage(parsedUsage);
      }
    } else {
      // Prima volta, inizializza
      const initialUsage = {
        aiTranscriptions: 0,
        aiNaturalInputs: 0,
        lastResetDate: new Date().toDateString()
      };
      setUsage(initialUsage);
      localStorage.setItem(storageKey, JSON.stringify(initialUsage));
    }
    
    setLoading(false);
  }, [user]);

  // Salva l'utilizzo nel localStorage quando cambia
  useEffect(() => {
    if (!user || loading) return;
    
    const storageKey = `${STORAGE_KEY}${user.id}`;
    localStorage.setItem(storageKey, JSON.stringify(usage));
  }, [usage, user, loading]);

  const canUseAITranscription = () => {
    if (!user) return false;
    if (hasActiveSubscription) return true;
    return usage.aiTranscriptions < DAILY_FREE_LIMIT;
  };

  const canUseAINaturalInput = () => {
    if (!user) return false;
    if (hasActiveSubscription) return true;
    return usage.aiNaturalInputs < DAILY_FREE_LIMIT;
  };

  const incrementAITranscription = () => {
    if (!canUseAITranscription()) {
      throw new Error('Limite giornaliero raggiunto per le trascrizioni AI');
    }
    
    setUsage(prev => ({
      ...prev,
      aiTranscriptions: prev.aiTranscriptions + 1
    }));
  };

  const incrementAINaturalInput = () => {
    if (!canUseAINaturalInput()) {
      throw new Error('Limite giornaliero raggiunto per gli input naturali AI');
    }
    
    setUsage(prev => ({
      ...prev,
      aiNaturalInputs: prev.aiNaturalInputs + 1
    }));
  };

  const getRemainingUsage = () => {
    if (hasActiveSubscription) {
      return {
        aiTranscriptions: 'illimitato',
        aiNaturalInputs: 'illimitato',
        total: 'illimitato'
      };
    }
    
    return {
      aiTranscriptions: Math.max(0, DAILY_FREE_LIMIT - usage.aiTranscriptions),
      aiNaturalInputs: Math.max(0, DAILY_FREE_LIMIT - usage.aiNaturalInputs),
      total: Math.max(0, (DAILY_FREE_LIMIT * 2) - (usage.aiTranscriptions + usage.aiNaturalInputs))
    };
  };

  const getUsagePercentage = () => {
    if (hasActiveSubscription) return 0;
    
    const totalUsed = usage.aiTranscriptions + usage.aiNaturalInputs;
    const totalLimit = DAILY_FREE_LIMIT * 2;
    return (totalUsed / totalLimit) * 100;
  };

  return {
    usage,
    loading,
    canUseAITranscription,
    canUseAINaturalInput,
    incrementAITranscription,
    incrementAINaturalInput,
    getRemainingUsage,
    getUsagePercentage,
    hasActiveSubscription,
    dailyLimit: DAILY_FREE_LIMIT
  };
}

export default useRateLimit;