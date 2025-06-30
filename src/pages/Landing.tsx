import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, useHasActiveSubscription } from "@/hooks/useSubscription";
import { Zap, Crown, CheckCircle } from "lucide-react";

const PRICE_LIFETIME = 'prod_SXwDwY2785qv8l';
const PRICE_SUB = 'prod_SXwFFkgaad0mAf';

const Landing = () => {
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const hasActiveSubscription = useHasActiveSubscription();
  const stripeCheckout = useStripeCheckout();

  const startCheckout = (priceId: string) => {
    const successUrl = `${window.location.origin}/dashboard?success=true`;
    const cancelUrl = window.location.href;
    
    stripeCheckout.mutate({
      priceId,
      successUrl,
      cancelUrl
    });
  };

  const features = [
    "Classificazione automatica delle transazioni con AI",
    "Categorie personalizzabili",
    "Dashboard con grafici e statistiche",
    "Gestione multi-conto",
    "Analisi delle spese dettagliate",
    "Supporto per input vocale"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <div className="max-w-6xl mx-auto p-6 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex justify-center items-center space-x-2">
            <Zap className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Smart Sheets Assistant</h1>
          </div>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Trasforma le tue finanze con l'intelligenza artificiale. Classifica automaticamente le transazioni, 
            analizza le spese e prendi il controllo del tuo budget.
          </p>
          
          {hasActiveSubscription && (
            <div className="flex justify-center">
              <Badge variant="default" className="bg-green-100 text-green-800 px-4 py-2">
                <Crown className="w-4 h-4 mr-2" />
                Abbonamento Attivo
              </Badge>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 bg-white/80 backdrop-blur-sm">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">{feature}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Pricing */}
        {!hasActiveSubscription && user && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center text-gray-900">Scegli il tuo piano</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Lifetime Plan */}
              <Card className="p-8 bg-white shadow-lg border-2 border-blue-200">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <Crown className="w-12 h-12 text-yellow-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Lifetime</h3>
                  <div className="text-4xl font-bold text-blue-600">€50</div>
                  <p className="text-gray-600">Pagamento unico, accesso per sempre</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>✓ Tutte le funzionalità premium</li>
                    <li>✓ Aggiornamenti gratuiti</li>
                    <li>✓ Supporto prioritario</li>
                    <li>✓ Nessun costo ricorrente</li>
                  </ul>
                  <Button 
                    onClick={() => startCheckout(PRICE_LIFETIME)}
                    disabled={stripeCheckout.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {stripeCheckout.isPending ? 'Caricamento...' : 'Acquista Lifetime'}
                  </Button>
                </div>
              </Card>

              {/* Monthly Plan */}
              <Card className="p-8 bg-white shadow-lg">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <Zap className="w-12 h-12 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Mensile</h3>
                  <div className="text-4xl font-bold text-blue-600">€7<span className="text-lg text-gray-500">/mese</span></div>
                  <p className="text-gray-600">Flessibilità massima</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>✓ Tutte le funzionalità premium</li>
                    <li>✓ Cancellazione in qualsiasi momento</li>
                    <li>✓ Supporto completo</li>
                    <li>✓ Aggiornamenti inclusi</li>
                  </ul>
                  <Button 
                    onClick={() => startCheckout(PRICE_SUB)}
                    disabled={stripeCheckout.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    {stripeCheckout.isPending ? 'Caricamento...' : 'Inizia Abbonamento'}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* CTA for non-authenticated users */}
        {!user && (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Inizia subito gratuitamente</h2>
            <p className="text-gray-600">Accedi con Google per provare tutte le funzionalità</p>
          </div>
        )}

        {/* Current subscription info */}
        {hasActiveSubscription && subscription && (
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-green-800">Il tuo abbonamento è attivo!</h3>
              <p className="text-green-700">
                Status: <span className="font-medium">{subscription.status}</span>
              </p>
              {subscription.current_period_end && (
                <p className="text-green-700">
                  {subscription.stripe_subscription_id ? 'Rinnovo' : 'Valido fino al'}: {' '}
                  <span className="font-medium">
                    {new Date(subscription.current_period_end).toLocaleDateString('it-IT')}
                  </span>
                </p>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Landing;
