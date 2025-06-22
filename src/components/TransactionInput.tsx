
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Mic, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TransactionInputProps {
  onClose: () => void;
}

const TransactionInput = ({ onClose }: TransactionInputProps) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsProcessing(true);
    
    // Simulazione chiamata AI
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Transazione elaborata!",
        description: "La tua spesa è stata categorizzata e salvata automaticamente.",
      });
      onClose();
    }, 2000);
  };

  const suggestions = [
    "Ho speso 25€ per la spesa al supermercato",
    "Cena fuori 45 euro",
    "Benzina 60€",
    "Stipendio 2200 euro",
    "Bolletta elettricità 80€"
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl p-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h3 className="text-xl font-semibold">Nuova Transazione</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrivi la tua transazione in linguaggio naturale
            </label>
            <div className="relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Es: Ho speso 15 euro per pizza..."
                className="pr-20 text-lg py-3"
                disabled={isProcessing}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                <Button type="button" size="sm" variant="ghost">
                  <Mic className="w-4 h-4" />
                </Button>
                <Button type="submit" size="sm" disabled={!input.trim() || isProcessing}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {isProcessing && (
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center space-x-3">
                <div className="animate-pulse w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-emerald-700 font-medium">L'AI sta elaborando la tua transazione...</span>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Esempi di transazioni:</h4>
            <div className="grid grid-cols-1 gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setInput(suggestion)}
                  className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Sparkles className="w-4 h-4" />
              <span>Powered by AI - Categorizzazione automatica</span>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TransactionInput;
