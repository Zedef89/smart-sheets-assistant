
import React, { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Dashboard from '@/components/Dashboard';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  const handleLogin = () => {
    // Simulazione login Google
    setIsAuthenticated(true);
    toast({
      title: "Accesso effettuato!",
      description: "Benvenuto nella tua dashboard finanziaria.",
    });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    toast({
      title: "Logout effettuato",
      description: "A presto!",
    });
  };

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        isAuthenticated={isAuthenticated} 
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      
      {isAuthenticated ? (
        <Dashboard />
      ) : (
        <Hero onGetStarted={handleGetStarted} />
      )}
    </div>
  );
};

export default Index;
