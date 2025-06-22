import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Send, Sparkles, Loader2, Mic, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAddTransaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useAIService } from '@/hooks/useAIService';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useAuth } from '@/contexts/AuthContext';
import VoiceRecorder from './VoiceRecorder';

interface TransactionInputProps {
  onClose: () => void;
}

const TransactionInput = ({ onClose }: TransactionInputProps) => {
  const [input, setInput] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  
  const { toast } = useToast();
  const addTransaction = useAddTransaction();
  const { data: categories } = useCategories();
  const { processWithAI, loading: aiLoading } = useAIService();
  const { data: settings } = useUserSettings();
  const { session } = useAuth();

  const processWithAI_Natural = async (text: string) => {
    const result = await processWithAI({
      text,
      type: 'text',
      action: 'analyze'
    });

    if (result) {
      // Parse AI response and extract transaction details
      // This would depend on your n8n workflow response format
      return {
        description: result.result || text,
        amount: parseFloat(result.result.match(/(\d+(?:[.,]\d{2})?)/)?.[1]?.replace(',', '.') || '0'),
        category: result.categories?.[0] || 'Altro',
        type: result.result.toLowerCase().includes('income') ? 'income' : 'expense'
      };
    }
    
    return null;
  };

  const parseNaturalLanguage = (text: string) => {
    // Simple parsing logic - in a real app, this would be an AI service
    const lowerText = text.toLowerCase();
    
    // Extract amount
    const amountMatch = text.match(/(\d+(?:[.,]\d{2})?)\s*(?:euro|€|eur)/i);
    const extractedAmount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0;
    
    // Determine type
    const isIncome = lowerText.includes('stipendio') || lowerText.includes('guadagno') || lowerText.includes('entrata') || lowerText.includes('ricevo');
    const transactionType: 'income' | 'expense' = isIncome ? 'income' : 'expense';
    
    // Extract category
    let extractedCategory = 'Altro';
    if (categories) {
      for (const cat of categories) {
        if (lowerText.includes(cat.name.toLowerCase()) || 
            (cat.name === 'Cibo' && (lowerText.includes('pizza') || lowerText.includes('cena') || lowerText.includes('pranzo') || lowerText.includes('ristorante') || lowerText.includes('sushi'))) ||
            (cat.name === 'Trasporti' && (lowerText.includes('benzina') || lowerText.includes('metro') || lowerText.includes('taxi'))) ||
            (cat.name === 'Shopping' && (lowerText.includes('vestiti') || lowerText.includes('scarpe'))) ||
            (cat.name === 'Stipendio' && lowerText.includes('stipendio'))) {
          extractedCategory = cat.name;
          break;
        }
      }
    }
    
    return {
      description: text,
      amount: extractedAmount,
      category: extractedCategory,
      type: transactionType
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let transactionData;
    
    if (manualMode) {
      if (!description || !amount || !category) {
        toast({
          title: "Errore",
          description: "Compila tutti i campi obbligatori.",
          variant: "destructive"
        });
        return;
      }
      
      transactionData = {
        description,
        amount: parseFloat(amount),
        category,
        type,
        date: new Date().toISOString().split('T')[0]
      };
    } else {
      if (!input.trim()) return;
      
      // Try AI processing first, fallback to local parsing
      const aiParsed = await processWithAI_Natural(input);
      const parsed = aiParsed || parseNaturalLanguage(input);
      
      if (parsed.amount === 0) {
        toast({
          title: "Errore",
          description: "Non riesco a identificare l'importo. Prova con un formato come '15 euro'.",
          variant: "destructive"
        });
        return;
      }
      
      transactionData = {
        ...parsed,
        date: new Date().toISOString().split('T')[0]
      };
    }

    try {
      await addTransaction.mutateAsync(transactionData);
      if (settings?.google_sheet_id && session?.provider_token) {
        try {
          await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${settings.google_sheet_id}/values/A1:append?valueInputOption=USER_ENTERED`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${session.provider_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                values: [[
                  transactionData.description,
                  transactionData.amount,
                  transactionData.category,
                  transactionData.date,
                ]],
              }),
            }
          );
        } catch (err) {
          toast({
            title: 'Sync error',
            description: 'Impossibile sincronizzare con Google Sheet.',
            variant: 'destructive',
          });
        }
      }
      toast({
        title: "Transazione aggiunta!",
        description: `€${transactionData.amount.toFixed(2)} - ${transactionData.description}`,
      });
      onClose();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiungere la transazione. Riprova.",
        variant: "destructive"
      });
    }
  };

  const handleVoiceTranscription = (text: string) => {
    setInput(text);
    setShowVoiceRecorder(false);
    toast({
      title: "Trascrizione completata",
      description: "Il testo è stato trascritto dalla registrazione vocale.",
    });
  };

  const suggestions = [
    "Ho speso 25€ per la spesa al supermercato",
    "Cena fuori 45 euro",
    "Benzina 60€",
    "Stipendio 2200 euro",
    "Bolletta elettricità 80€"
  ];

  const expenseCategories = categories?.filter(c => c.type === 'expense' || c.type === 'both') || [];
  const incomeCategories = categories?.filter(c => c.type === 'income' || c.type === 'both') || [];
  const availableCategories = type === 'expense' ? expenseCategories : incomeCategories;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl p-6 bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h3 className="text-xl font-semibold">Nuova Transazione</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="mb-4">
          <div className="flex space-x-2 flex-wrap gap-2">
            <Button
              type="button"
              variant={!manualMode && !showVoiceRecorder ? "default" : "outline"}
              onClick={() => {
                setManualMode(false);
                setShowVoiceRecorder(false);
              }}
              size="sm"
            >
              <Brain className="w-4 h-4 mr-1" />
              AI Naturale
            </Button>
            <Button
              type="button"
              variant={showVoiceRecorder ? "default" : "outline"}
              onClick={() => {
                setShowVoiceRecorder(true);
                setManualMode(false);
              }}
              size="sm"
            >
              <Mic className="w-4 h-4 mr-1" />
              Vocale
            </Button>
            <Button
              type="button"
              variant={manualMode ? "default" : "outline"}
              onClick={() => {
                setManualMode(true);
                setShowVoiceRecorder(false);
              }}
              size="sm"
            >
              Manuale
            </Button>
          </div>
        </div>

        {showVoiceRecorder && (
          <div className="mb-6">
            <VoiceRecorder onTranscriptionComplete={handleVoiceTranscription} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!manualMode && !showVoiceRecorder ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrivi la tua transazione in linguaggio naturale
                </label>
                <div className="relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Es: Ho speso 15 euro per pizza..."
                    className="pr-12 min-h-[100px]"
                    disabled={addTransaction.isPending || aiLoading}
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={!input.trim() || addTransaction.isPending || aiLoading}
                    className="absolute right-2 bottom-2"
                  >
                    {addTransaction.isPending || aiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {aiLoading && (
                  <p className="text-sm text-blue-600 mt-2">Processing with AI...</p>
                )}
              </div>

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
            </>
          ) : manualMode ? (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <Select value={type} onValueChange={(value: 'income' | 'expense') => setType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Spesa</SelectItem>
                    <SelectItem value="income">Entrata</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione *
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Es: Cena al ristorante"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Importo (€) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                disabled={addTransaction.isPending}
                className="w-full"
              >
                {addTransaction.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  'Aggiungi Transazione'
                )}
              </Button>
            </div>
          ) : null}
        </form>
      </Card>
    </div>
  );
};

export default TransactionInput;
