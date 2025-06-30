import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAIUsage, useAIUsageStats } from '@/hooks/useAIUsage';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { useHasActiveSubscription } from '@/hooks/useSubscription';
import { Zap, Crown, AlertTriangle } from 'lucide-react';

const PRICE_LIFETIME = 'price_1QVYyOGqQs2bNXTdVQYyOGqQ';
const PRICE_SUB = 'price_1QVYyOGqQs2bNXTdVQYyOGqR';

interface AIUsageIndicatorProps {
  compact?: boolean;
  showType?: 'transcriptions' | 'naturalInputs' | 'both';
}

export function AIUsageIndicator({ compact = false, showType = 'both' }: AIUsageIndicatorProps) {
  const { 
    transcriptionsUsed,
    naturalInputsUsed,
    transcriptionsRemaining,
    naturalInputsRemaining,
    usagePercentage
  } = useAIUsageStats();
  
  const hasSubscription = useHasActiveSubscription();
  
  const { isLoading: loading } = useAIUsage();
  const stripeCheckout = useStripeCheckout();
  
  // Calcola la percentuale in base al tipo di utilizzo da mostrare
  const getSpecificPercentage = () => {
    if (showType === 'transcriptions') {
      return hasSubscription ? 0 : Math.min((transcriptionsUsed / 2) * 100, 100);
    } else if (showType === 'naturalInputs') {
      return hasSubscription ? 0 : Math.min((naturalInputsUsed / 2) * 100, 100);
    } else {
      return hasSubscription ? 0 : usagePercentage;
    }
  };
  
  const percentage = getSpecificPercentage();
  
  const getRemainingUsage = () => {
    if (showType === 'transcriptions') {
      return transcriptionsRemaining;
    } else if (showType === 'naturalInputs') {
      return naturalInputsRemaining;
    } else {
      return hasSubscription ? 'illimitato' : Math.max(0, 4 - transcriptionsUsed - naturalInputsUsed);
    }
  };
  
  const remaining = getRemainingUsage();

  const startCheckout = (priceId: string) => {
    stripeCheckout.mutate({ priceId });
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (hasSubscription) {
    return (
      <Card className={`${compact ? 'p-3' : 'p-4'} bg-green-50 border-green-200`}>
        <div className="flex items-center space-x-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          <div className="flex-1">
            <p className={`font-medium text-green-800 ${compact ? 'text-sm' : ''}`}>
              Piano Premium Attivo
            </p>
            {!compact && (
              <p className="text-xs text-green-600">Utilizzo AI illimitato</p>
            )}
          </div>
          <Badge className="bg-green-100 text-green-800">Illimitato</Badge>
        </div>
      </Card>
    );
  }

  const isNearLimit = percentage > 75;
  const isAtLimit = percentage >= 100;

  return (
    <Card className={`${compact ? 'p-3' : 'p-4'} ${isAtLimit ? 'bg-red-50 border-red-200' : isNearLimit ? 'bg-yellow-50 border-yellow-200' : ''}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className={`w-4 h-4 ${isAtLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-blue-500'}`} />
            <span className={`font-medium ${compact ? 'text-sm' : ''}`}>
              Utilizzo AI Giornaliero
            </span>
          </div>
          {isAtLimit && (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
        </div>

        <div className="space-y-2">
          {showType !== 'both' && (
            <div className="text-xs text-gray-600 text-center">
              {showType === 'transcriptions' && (
                <span>Trascrizioni Audio: {transcriptionsUsed}/2</span>
              )}
              {showType === 'naturalInputs' && (
                <span>Input Naturali AI: {naturalInputsUsed}/2</span>
              )}
            </div>
          )}
          {showType === 'both' && (
            <div className="flex justify-between text-xs text-gray-600">
              <span>Trascrizioni: {transcriptionsUsed}/2</span>
              <span>Input Naturali: {naturalInputsUsed}/2</span>
            </div>
          )}
          
          <Progress 
            value={percentage} 
            className={`h-2 ${isAtLimit ? 'bg-red-100' : isNearLimit ? 'bg-yellow-100' : 'bg-blue-100'}`}
          />
          
          <div className="flex justify-between text-xs">
            <span className={isAtLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-gray-600'}>
              {showType === 'transcriptions' ? `${transcriptionsRemaining} trascrizioni rimaste` :
               showType === 'naturalInputs' ? `${naturalInputsRemaining} input rimasti` :
               `${remaining} richieste rimaste`}
            </span>
            <span className="text-gray-500">
              Reset: domani
            </span>
          </div>
        </div>

        {(isNearLimit || isAtLimit) && !compact && (
          <div className="pt-2 border-t space-y-2">
            <p className={`text-xs ${isAtLimit ? 'text-red-600' : 'text-yellow-600'}`}>
              {isAtLimit 
                ? 'Hai raggiunto il limite giornaliero. Passa a Premium per utilizzo illimitato!' 
                : 'Stai per raggiungere il limite giornaliero.'}
            </p>
            
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                onClick={() => startCheckout(PRICE_LIFETIME)}
                disabled={stripeCheckout.isPending}
                className="flex-1 text-xs"
              >
                Lifetime €50
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => startCheckout(PRICE_SUB)}
                disabled={stripeCheckout.isPending}
                className="flex-1 text-xs"
              >
                €7/mese
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default AIUsageIndicator;