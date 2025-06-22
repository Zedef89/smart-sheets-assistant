
import React from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Dashboard from '@/components/Dashboard';
import Onboarding from '@/components/Onboarding';
import { useAuth } from '@/contexts/AuthContext';
import { useAccounts } from '@/hooks/useAccounts';
import { useUserSettings } from '@/hooks/useUserSettings';

const Index = () => {
  const { user, loading, signInWithGoogle } = useAuth();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: settings, isLoading: settingsLoading } = useUserSettings();

  if (loading || accountsLoading || settingsLoading) {
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
        !settings?.google_sheet_id || (accounts && accounts.length === 0) ? (
          <Onboarding onComplete={() => window.location.reload()} />
        ) : (
          <Dashboard />
        )
      ) : (
        <Hero onGetStarted={handleGetStarted} />
      )}
    </div>
  );
};

export default Index;
