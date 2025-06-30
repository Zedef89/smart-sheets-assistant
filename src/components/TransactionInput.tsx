import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Send, Sparkles, Loader2, Mic, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAddTransaction } from '@/hooks/useTransactions';
import { useUpdateTransaction } from '@/hooks/useUpdateTransaction';
import { useCategories } from '@/hooks/useCategories';
import { useAddCategory } from '@/hooks/useAddCategory';
import { useAIService } from '@/hooks/useAIService';

import VoiceRecorder from './VoiceRecorder';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
}

interface TransactionInputProps {
  onClose: () => void;
  editingTransaction?: Transaction | null;
}

const TransactionInput = ({ onClose, editingTransaction }: TransactionInputProps) => {
  const [input, setInput] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  
  const { toast } = useToast();
  const addTransaction = useAddTransaction();
  const updateTransaction = useUpdateTransaction();
  const { data: categories } = useCategories();
  const addCategory = useAddCategory();

  // Pre-popola i campi quando si modifica una transazione
  useEffect(() => {
    if (editingTransaction) {
      setDescription(editingTransaction.description);
      setAmount(Math.abs(editingTransaction.amount).toString());
      setCategory(editingTransaction.category);
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      setManualMode(true); // Passa automaticamente alla modalità manuale per la modifica
    }
  }, [editingTransaction]);
  const { processWithAI, loading: aiLoading } = useAIService();

  const processWithAI_Natural = async (text: string) => {
    try {
      const result = await processWithAI({
        messages: [{
          role: 'user',
          content: `Analyze this transaction and return a JSON with the fields: amount (number), description (string), category (string), type ("income" or "expense"). 
          
          IMPORTANT: Detect the language of the input text and respond with categories in the SAME language as the input.
          
          If the input is in Italian, use Italian categories like: "Cibo", "Trasporti", "Shopping", "Stipendio", "Casa", "Salute", "Intrattenimento", "Altro".
          If the input is in English, use English categories like: "Food", "Transportation", "Shopping", "Salary", "Home", "Health", "Entertainment", "Other".
          
          Text to analyze: "${text}"`
        }],
        type: 'text',
        action: 'analyze'
      });

      if (result && result.amount && result.description) {
        return {
          description: result.description,
          amount: parseFloat(result.amount.toString()),
          category: result.category || 'Altro',
          type: (result.type === 'income' ? 'income' : 'expense') as 'income' | 'expense'
        };
      }
    } catch (error) {
      console.error('AI processing failed:', error);
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
      if (!description || !amount || (!category && !newCategory)) {
        toast({
          title: "Errore",
          description: "Compila tutti i campi obbligatori.",
          variant: "destructive"
        });
        return;
      }
      
      let finalCategory = category;
      
      // Se è stata inserita una nuova categoria, creala prima
      if (newCategory && !category) {
        try {
          await addCategory.mutateAsync({
            name: newCategory,
            type: type === 'income' ? 'income' : 'expense',
            color: type === 'income' ? '#10b981' : '#ef4444'
          });
          finalCategory = newCategory;
        } catch (error) {
          toast({
            title: "Errore",
            description: "Impossibile creare la nuova categoria.",
            variant: "destructive"
          });
          return;
        }
      }
      
      transactionData = {
        description,
        amount: parseFloat(amount),
        category: finalCategory,
        type,
        date
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
      if (editingTransaction) {
        // Modalità modifica
        await updateTransaction.mutateAsync({
          id: editingTransaction.id,
          description: transactionData.description,
          amount: transactionData.amount,
          category: transactionData.category,
          type: transactionData.type,
          date: transactionData.date,
        });
      } else {
        // Modalità creazione
        await addTransaction.mutateAsync(transactionData);
      }
      
      toast({
        title: editingTransaction ? "Transazione aggiornata!" : "Transazione aggiunta!",
        description: `€${transactionData.amount.toFixed(2)} - ${transactionData.description}`,
      });
      onClose();
    } catch (error) {
      console.error('Error processing transaction:', error);
      toast({
        title: "Errore",
        description: editingTransaction ? "Impossibile aggiornare la transazione. Riprova." : "Impossibile aggiungere la transazione. Riprova.",
        variant: "destructive"
      });
    }
  };

  const handleVoiceTranscription = (text: string) => {
    setInput(text);
    toast({
      title: "Trascrizione completata",
      description: "Il testo è stato trascritto dalla registrazione vocale.",
    });
  };

  const handleAutoAnalysis = async (analysisResult: any) => {
    if (analysisResult && analysisResult.amount && analysisResult.description) {
      const transactionData = {
        description: analysisResult.description,
        amount: parseFloat(analysisResult.amount.toString()),
        category: analysisResult.category || 'Altro',
        type: (analysisResult.type === 'income' ? 'income' : 'expense') as 'income' | 'expense',
        date: new Date().toISOString().split('T')[0]
      };

      try {
        await addTransaction.mutateAsync(transactionData);
        toast({
          title: "Transazione aggiunta automaticamente!",
          description: `€${transactionData.amount.toFixed(2)} - ${transactionData.description}`,
        });
        setShowVoiceRecorder(false);
        onClose();
      } catch (error) {
        console.error('Error adding transaction:', error);
        toast({
          title: "Errore",
          description: "Impossibile aggiungere la transazione. Riprova.",
          variant: "destructive"
        });
      }
    }
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
            <h3 className="text-xl font-semibold">
              {editingTransaction ? 'Modifica Transazione' : 'Nuova Transazione'}
            </h3>
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
            <VoiceRecorder 
              onTranscriptionComplete={handleVoiceTranscription} 
              onAutoAnalysis={handleAutoAnalysis}
            />
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
                  Data *
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                {!showNewCategoryInput ? (
                  <div className="space-y-2">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowNewCategoryInput(true);
                        setCategory('');
                      }}
                      className="w-full"
                    >
                      + Aggiungi nuova categoria
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Nome nuova categoria"
                      required
                    />
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowNewCategoryInput(false);
                          setNewCategory('');
                        }}
                        className="flex-1"
                      >
                        Annulla
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                disabled={addTransaction.isPending || updateTransaction.isPending}
                className="w-full"
              >
                {(addTransaction.isPending || updateTransaction.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  editingTransaction ? 'Aggiorna Transazione' : 'Aggiungi Transazione'
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
