
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, TrendingUp, Brain, Sheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeroProps {
  onGetStarted: () => void;
}

const Hero = ({ onGetStarted }: HeroProps) => {
  const navigate = useNavigate();

  const handleTitleClick = () => {
    navigate('/');
  };

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 px-6">
      <div className="max-w-6xl mx-auto pt-20 pb-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-emerald-200">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Powered by AI</span>
          </div>
          
          <h1 
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight cursor-pointer hover:opacity-80 transition-opacity duration-200"
            onClick={handleTitleClick}
          >
            Il tuo <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">assistente finanziario</span> intelligente
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Registra le tue spese in linguaggio naturale, lascia che l'AI le categorizzi automaticamente 
            e visualizza i tuoi dati finanziari in tempo reale.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-lg px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Inizia Gratis
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-lg px-8 py-3 rounded-xl border-2 hover:bg-white/50"
            >
              Guarda Demo
            </Button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Intelligente</h3>
            <p className="text-gray-600">
              Inserisci "Ho speso 15€ per pizza" e l'AI capisce automaticamente importo e categoria.
            </p>
          </Card>
          
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
              <Sheet className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Database Sicuro</h3>
            <p className="text-gray-600">
              I tuoi dati vengono salvati in modo sicuro nel nostro database cloud.
            </p>
          </Card>
          
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Analisi Smart</h3>
            <p className="text-gray-600">
              Ricevi insights personalizzati e suggerimenti per ottimizzare le tue finanze.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Hero;
