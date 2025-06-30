import React from 'react';
import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription, useHasActiveSubscription, useSmartSubscriptionSync } from '@/hooks/useSubscription';
import { useAIUsage } from '@/hooks/useAIUsage';
import { useToast } from '@/hooks/use-toast';
import AIUsageIndicator from '@/components/AIUsageIndicator';
import { Crown, CreditCard, User, Settings as SettingsIcon, ExternalLink, Brain, RefreshCw } from 'lucide-react';

const PRICE_LIFETIME = 'prod_SXwDwY2785qv8l';
const PRICE_SUB = 'prod_SXwFFkgaad0mAf';
const DAILY_FREE_LIMIT = 2; // Aggiungi questa costante

export default function Settings() {
  const { user } = useAuth();
  const { data: subscription, refetch: refetchSubscription } = useSubscription();
  const hasActiveSubscription = useHasActiveSubscription();
  const { data: usage, isLoading: loading } = useAIUsage();
  const { toast } = useToast();
  const { manualSync, isExpired, hasActive } = useSmartSubscriptionSync();

  const openStripeLink = (url: string) => {
    const email = user?.email || '';
    const urlWithEmail = `${url}${email ? `?prefilled_email=${encodeURIComponent(email)}` : ''}`;
    window.open(urlWithEmail, '_blank');
  };

  const syncSubscription = async () => {
    try {
      await manualSync();
      await refetchSubscription(); // Refresh local data
      
      toast({
        title: "Sincronizzazione completata",
        description: "Lo stato dell'abbonamento è stato aggiornato.",
      });
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: "Errore di sincronizzazione",
        description: error.message || "Non è stato possibile aggiornare lo stato dell'abbonamento.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center space-x-3">
          <SettingsIcon className="w-8 h-8 text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-900">Impostazioni</h1>
        </div>
        
        {/* User Profile Section */}
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Profilo Utente</h2>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>
        </Card>

        {/* AI Usage Limits Section */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Brain className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Utilizzo AI Giornaliero</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Trascrizioni Audio</span>
                  <span className="text-sm text-gray-600">
                    {hasActiveSubscription ? 'Illimitato' : `${usage?.ai_transcriptions || 0}/${DAILY_FREE_LIMIT}`}
                  </span>
                </div>
                {!hasActiveSubscription && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${((usage?.ai_transcriptions || 0) / DAILY_FREE_LIMIT) * 100}%` }}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Input Naturali AI</span>
                  <span className="text-sm text-gray-600">
                    {hasActiveSubscription ? 'Illimitato' : `${usage?.ai_natural_inputs || 0}/${DAILY_FREE_LIMIT}`}
                  </span>
                </div>
                {!hasActiveSubscription && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${((usage?.ai_natural_inputs || 0) / DAILY_FREE_LIMIT) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            {!hasActiveSubscription && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Suggerimento:</strong> Passa a Premium per utilizzo illimitato dell'AI!
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Subscription Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">Abbonamento</h2>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                 variant="outline"
                 size="sm"
                 onClick={syncSubscription}
                 className="flex items-center space-x-1"
               >
                 <RefreshCw className="w-4 h-4" />
                 <span>Sincronizza</span>
               </Button>
              {hasActiveSubscription && (
                <Badge className="bg-green-100 text-green-800">
                  <Crown className="w-4 h-4 mr-1" />
                  Attivo
                </Badge>
              )}
              {isExpired && (
                <Badge className="bg-red-100 text-red-800">
                  Scaduto
                </Badge>
              )}
              {!hasActiveSubscription && !isExpired && (
                <Badge className="bg-gray-100 text-gray-800">
                  Gratuito
                </Badge>
              )}
            </div>
          </div>

          {hasActiveSubscription && subscription ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Piano</p>
                  <p className="font-medium">
                    {subscription.stripe_subscription_id ? 'Abbonamento Mensile' : 'Lifetime'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium capitalize">{subscription.status}</p>
                </div>
                {subscription.current_period_end && (
                  <div>
                    <p className="text-sm text-gray-600">
                      {subscription.stripe_subscription_id ? 'Prossimo rinnovo' : 'Valido fino al'}
                    </p>
                    <p className="font-medium">
                      {new Date(subscription.current_period_end).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                )}
                {subscription.stripe_customer_id && (
                  <div>
                    <p className="text-sm text-gray-600">Customer ID</p>
                    <p className="font-mono text-sm">{subscription.stripe_customer_id}</p>
                  </div>
                )}
              </div>
              
              {subscription.stripe_subscription_id && (
                <div className="pt-4 border-t">
                  <Button variant="outline" className="flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4" />
                    <span>Gestisci Abbonamento</span>
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Ti reindirizzeremo al portale clienti Stripe per gestire il tuo abbonamento
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Non hai ancora un abbonamento attivo. Scegli un piano per accedere a tutte le funzionalità premium.
              </p>
              
              {/* Debug info */}
              {subscription && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-2">🔍 Debug Info - Abbonamento trovato ma non attivo:</p>
                  <div className="text-xs text-yellow-700 space-y-1">
                    <p><strong>Status:</strong> {subscription.status}</p>
                    <p><strong>Stripe Customer ID:</strong> {subscription.stripe_customer_id || 'N/A'}</p>
                    <p><strong>Stripe Subscription ID:</strong> {subscription.stripe_subscription_id || 'N/A'}</p>
                    <p><strong>Price ID:</strong> {subscription.stripe_price_id || 'N/A'}</p>
                    {subscription.current_period_end && (
                      <p><strong>Scadenza:</strong> {new Date(subscription.current_period_end).toLocaleString('it-IT')}</p>
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-semibold">Lifetime</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 mb-2">€50</p>
                  <p className="text-sm text-gray-600 mb-4">Pagamento unico, accesso per sempre</p>
                  <Button 
                    onClick={() => openStripeLink('https://buy.stripe.com/cNi5kD3Ne7qu5OmeZT2B201')}
                    className="w-full"
                  >
                    Acquista
                  </Button>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold">Mensile</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 mb-2">€7<span className="text-sm text-gray-500">/mese</span></p>
                  <p className="text-sm text-gray-600 mb-4">Flessibilità massima</p>
                  <Button 
                    onClick={() => openStripeLink('https://buy.stripe.com/fZu6oHcjKdOS90y7xr2B200')}
                    variant="outline"
                    className="w-full"
                  >
                    Abbonati
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
