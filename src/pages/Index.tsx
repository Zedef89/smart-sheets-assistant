
import React from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Dashboard from '@/components/Dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useSmartSubscriptionSync } from '@/hooks/useSubscription';

const Index = () => {
  const { user, loading, signInWithGoogle } = useAuth();
  
  // Inizializza la sincronizzazione intelligente dell'abbonamento
  useSmartSubscriptionSync();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  const handleGetStarted = async () => {
    if (!user) {
      try {
        await signInWithGoogle();
      } catch (error) {
        console.error('Failed to sign in:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {user ? (
        <Dashboard />
      ) : (
        <Hero onGetStarted={handleGetStarted} />
      )}
    </div>
  );
};

export default Index;
