import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Send, Loader2 } from 'lucide-react';
import { useAIService } from '@/hooks/useAIService';
import { useToast } from '@/hooks/use-toast';
import { useCanUseAITranscription, useIncrementAITranscription, useCanUseAINaturalInput, useIncrementAINaturalInput } from '@/hooks/useAIUsage';
import { useHasActiveSubscription } from '@/hooks/useSubscription';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onAutoAnalysis?: (analysisResult: any) => void;
}

const VoiceRecorder = ({ onTranscriptionComplete, onAutoAnalysis }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const { transcribeAudio, processWithAI, loading } = useAIService();
  const { toast } = useToast();
  const canUseAITranscription = useCanUseAITranscription();
  const incrementAITranscription = useIncrementAITranscription();
  const canUseAINaturalInput = useCanUseAINaturalInput();
  const incrementAINaturalInput = useIncrementAINaturalInput();
  const hasActiveSubscription = useHasActiveSubscription();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Errore Registrazione",
        description: "Impossibile accedere al microfono. Controlla i permessi.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async () => {
    if (!audioBlob) return;

    // Controlla i limiti per la trascrizione AI solo per utenti non premium
    if (!hasActiveSubscription && !canUseAITranscription) {
      toast({
        title: "Limite raggiunto",
        description: "Hai raggiunto il limite giornaliero di 2 trascrizioni AI. Passa a Premium per utilizzo illimitato!",
        variant: "destructive"
      });
      return;
    }

    // Convert blob to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      const audioData = base64Audio.split(',')[1]; // Remove data:audio/wav;base64, prefix

      const transcribedText = await transcribeAudio(audioData);
      
      if (transcribedText) {
        // Incrementa il contatore solo per utenti non premium
        // Gli utenti premium hanno utilizzo illimitato
        if (!hasActiveSubscription) {
          await incrementAITranscription.mutateAsync();
        }
      }

      if (transcribedText) {
        onTranscriptionComplete(transcribedText);
        
        // Auto-analyze with AI if callback is provided
        if (onAutoAnalysis) {
          
          try {
            const analysisResult = await processWithAI({
               messages: [{
                 role: 'user',
                 content: `Analyze this transaction and return a JSON with the fields: amount (number), description (string), category (string), type ("income" or "expense"). 
                 
                 IMPORTANT: Detect the language of the input text and respond with categories in the SAME language as the input.
                 NEVER use "Altro" or "Other" as category. Always choose the most specific category available.
                 
                 If the input is in Italian, use Italian categories like: "Cibo", "Trasporti", "Shopping", "Stipendio", "Casa", "Salute", "Intrattenimento", "Vizi", "Benzina", "Bollette", "Abbonamenti", "Regali", "Farmacia", "Ristorante", "Supermercato", "Vestiti", "Tecnologia", "Sport", "Viaggi", "Educazione", "Assicurazioni", "Tasse".
                 If the input is in English, use English categories like: "Food", "Transportation", "Shopping", "Salary", "Home", "Health", "Entertainment", "Vices", "Gas", "Bills", "Subscriptions", "Gifts", "Pharmacy", "Restaurant", "Grocery", "Clothing", "Technology", "Sports", "Travel", "Education", "Insurance", "Taxes".
                 
                 For cigarettes, tobacco, alcohol, gambling use "Vizi" (Italian) or "Vices" (English).
                 
                 Text to analyze: "${transcribedText}"`
               }],
               type: 'text',
               action: 'analyze'
             });
            
            if (analysisResult) {
              // Incrementa il contatore solo per utenti non premium
              // Gli utenti premium hanno utilizzo illimitato
              if (!hasActiveSubscription && canUseAINaturalInput) {
                try {
                  await incrementAINaturalInput.mutateAsync();
                } catch (incrementError) {
                  console.error('Failed to increment AI usage:', incrementError);
                  throw new Error('Limite giornaliero raggiunto per gli input naturali AI');
                }
              }
              onAutoAnalysis(analysisResult);
            }
          } catch (error) {
            console.error('Auto-analysis error:', error);
            toast({
              title: "Errore AI",
              description: "Errore nell'analisi automatica. La trascrizione è comunque disponibile.",
              variant: "destructive"
            });
          }
        }
        
        setAudioBlob(null);
      }
    };
    
    reader.readAsDataURL(audioBlob);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Registra la tua transazione vocalmente
        </label>
        <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg bg-gray-50">
          <div className="flex space-x-4">
            {!isRecording ? (
              <Button 
                onClick={startRecording}
                className="bg-red-500 hover:bg-red-600"
                disabled={loading}
              >
                <Mic className="w-4 h-4 mr-2" />
                Inizia Registrazione
              </Button>
            ) : (
              <Button 
                onClick={stopRecording}
                variant="outline"
              >
                <Square className="w-4 h-4 mr-2" />
                Ferma Registrazione
              </Button>
            )}
            
            {audioBlob && (
              <Button 
                onClick={processAudio}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Elabora Audio
              </Button>
            )}
          </div>
          
          {isRecording && (
             <div className="flex items-center space-x-2 text-red-500">
               <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
               <span>Registrazione in corso...</span>
             </div>
           )}
         </div>
       </div>
       
       <div>
         <h4 className="text-sm font-medium text-gray-700 mb-3">Esempi di registrazioni vocali:</h4>
         <div className="grid grid-cols-1 gap-2">
           <div className="text-left p-3 rounded-lg text-sm bg-gray-50 text-gray-700">
             "Ho speso venticinque euro per la spesa al supermercato"
           </div>
           <div className="text-left p-3 rounded-lg text-sm bg-gray-50 text-gray-700">
             "Cena fuori quarantacinque euro"
           </div>
           <div className="text-left p-3 rounded-lg text-sm bg-gray-50 text-gray-700">
             "Benzina sessanta euro"
           </div>
           <div className="text-left p-3 rounded-lg text-sm bg-gray-50 text-gray-700">
             "Ho ricevuto lo stipendio di duemiladuecento euro"
           </div>
         </div>
       </div>
     </div>
  );
};

export default VoiceRecorder;