import React from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { createCheckoutSession } from '@/hooks/useStripeCheckout';

const PRICE_LIFETIME = 'prod_SXwDwY2785qv8l';
const PRICE_SUB = 'prod_SXwFFkgaad0mAf';

const Landing = () => {
  const startCheckout = async (price: string) => {
    const { url } = await createCheckoutSession(
      price,
      window.location.href,
      window.location.href
    );
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Smart Sheets Assistant</h1>
        <p className="text-gray-700">
          Lo sviluppatore Nicola Mele ora sa con certezza che questo mese ha speso
          80 euro per le sigarette. Le normali classificazioni delle banche non
          offrivano una categoria così specifica. In futuro potranno essere
          implementati followup e analisi dell'AI basati su obiettivi.
        </p>
        <p className="text-gray-700">
          Puoi iniziare gratuitamente e avere il
          pieno controllo delle tue finanze.
        </p>
        <div className="space-x-4">
          <Button onClick={() => startCheckout(PRICE_LIFETIME)}>Acquista Lifetime (50€)</Button>
          <Button variant="outline" onClick={() => startCheckout(PRICE_SUB)}>Abbonati (7€ al mese)</Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
