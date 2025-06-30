import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Send, Loader2, Download } from 'lucide-react';
import { useAIService } from '@/hooks/useAIService';
import { useToast } from '@/hooks/use-toast';
import { useCanUseAITranscription, useIncrementAITranscription, useCanUseAINaturalInput, useIncrementAINaturalInput } from '@/hooks/useAIUsage';
import { useHasActiveSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onAutoAnalysis?: (analysisResult: any) => void;
}

const VoiceRecorder = ({ onTranscriptionComplete, onAutoAnalysis }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
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
      console.log('🎤 Avvio registrazione...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      console.log('📱 MediaRecorder creato con tipo:', recorder.mimeType);
      
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setRecordingStartTime(Date.now());

      recorder.ondataavailable = (event) => {
        console.log('📦 Dati audio ricevuti, dimensione:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const recordingDuration = recordingStartTime ? (Date.now() - recordingStartTime) / 1000 : 0;
        console.log('⏱️ Durata registrazione:', recordingDuration, 'secondi');
        
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log('🔴 Registrazione fermata, blob creato:', audioBlob.size, 'bytes, tipo:', audioBlob.type);
        
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      console.log('✅ Registrazione avviata alle:', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('❌ Errore avvio registrazione:', error);
      toast({
        title: "Errore Microfono",
        description: "Impossibile accedere al microfono. Verifica i permessi del browser.",
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
    console.log('🎯 === INIZIO ELABORAZIONE AUDIO ===');
    
    if (!audioBlob) {
      console.log('❌ Nessun blob audio disponibile');
      return;
    }

    console.log('🚀 Inizio elaborazione audio...');
    console.log('📊 Dimensioni blob:', audioBlob.size, 'bytes');
    console.log('📊 Tipo blob:', audioBlob.type);

    // Validazione durata minima
    const recordingDuration = recordingStartTime ? (Date.now() - recordingStartTime) / 1000 : 0;
    console.log('⏱️ Durata calcolata:', recordingDuration, 'secondi');
    
    if (recordingDuration < 0.1) {
      console.log('⚠️ Registrazione troppo breve:', recordingDuration, 'secondi');
      toast({
        title: "Registrazione troppo breve",
        description: "La registrazione deve durare almeno 0.1 secondi. Riprova con una registrazione più lunga.",
        variant: "destructive"
      });
      return;
    }

    // Validazione dimensioni blob
    if (audioBlob.size < 1000) {
      console.log('⚠️ File audio troppo piccolo:', audioBlob.size, 'bytes');
      toast({
        title: "Audio insufficiente",
        description: "Il file audio è troppo piccolo. Assicurati di parlare durante la registrazione.",
        variant: "destructive"
      });
      return;
    }

    // Controlla stato autenticazione
    console.log('🔐 Controllo autenticazione...');
    console.log('👤 hasActiveSubscription:', hasActiveSubscription);
    console.log('🎯 canUseAITranscription:', canUseAITranscription);
    
    // Verifica sessione Supabase
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('📋 Sessione Supabase:', {
        hasSession: !!session,
        userId: session?.user?.id,
        accessToken: session?.access_token ? 'PRESENTE' : 'MANCANTE',
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A',
        error: sessionError
      });
      
      if (!session) {
        console.log('❌ ERRORE: Nessuna sessione attiva!');
        toast({
          title: "Errore Autenticazione",
          description: "Sessione scaduta. Effettua nuovamente il login.",
          variant: "destructive"
        });
        return;
      }
      
      if (!session.access_token) {
        console.log('❌ ERRORE: Token di accesso mancante!');
        toast({
          title: "Errore Token",
          description: "Token di accesso mancante. Riprova il login.",
          variant: "destructive"
        });
        return;
      }
      
    } catch (authError) {
      console.log('❌ ERRORE durante controllo autenticazione:', authError);
      toast({
        title: "Errore Autenticazione",
        description: "Impossibile verificare l'autenticazione.",
        variant: "destructive"
      });
      return;
    }

    // Controlla i limiti per la trascrizione AI solo per utenti non premium
    if (!hasActiveSubscription && !canUseAITranscription) {
      console.log('⚠️ Limite trascrizioni raggiunto per utente non premium');
      toast({
        title: "Limite raggiunto",
        description: "Hai raggiunto il limite giornaliero di 2 trascrizioni AI. Passa a Premium per utilizzo illimitato!",
        variant: "destructive"
      });
      return;
    }

    // Convert blob to base64
    console.log('🔄 Conversione blob in base64...');
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      const audioData = base64Audio.split(',')[1]; // Remove data:audio/webm;base64, prefix
      
      console.log('📝 Dati base64 preparati, lunghezza:', audioData.length, 'caratteri');
      console.log('🔗 === CHIAMATA API TRASCRIZIONE ===');
      console.log('🌐 URL destinazione: https://agdskvhbmbpowwqyfanr.supabase.co/functions/v1/whisper-transcription');
      
      // Verifica nuovamente la sessione prima della chiamata
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔑 Token per chiamata API:', session?.access_token ? 'PRESENTE' : 'MANCANTE');

      try {
        console.log('⏳ Invio richiesta trascrizione...');
        const startTime = Date.now();
        
        const transcribedText = await transcribeAudio(audioData);
        
        const endTime = Date.now();
        console.log('⏱️ Tempo risposta API:', endTime - startTime, 'ms');
        console.log('📋 Risultato trascrizione:', transcribedText || 'Nessun testo');
      
        if (transcribedText) {
          console.log('✅ === TRASCRIZIONE COMPLETATA CON SUCCESSO ===');
          console.log('📝 Testo trascritto:', transcribedText);
          
          // Incrementa il contatore solo per utenti non premium
          // Gli utenti premium hanno utilizzo illimitato
          if (!hasActiveSubscription) {
            console.log('📊 Incremento contatore trascrizioni per utente non premium...');
            try {
              await incrementAITranscription.mutateAsync();
              console.log('✅ Contatore incrementato con successo');
            } catch (incrementError) {
              console.log('❌ Errore incremento contatore:', incrementError);
            }
          } else {
            console.log('👑 Utente premium - nessun incremento contatore necessario');
          }
        } else {
          console.log('⚠️ Trascrizione vuota o fallita');
          toast({
            title: "Trascrizione fallita",
            description: "Non è stato possibile trascrivere l'audio. Riprova con una registrazione più chiara.",
            variant: "destructive"
          });
          return;
        }

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
        console.log('🎉 Processo completato con successo');
        
      } catch (transcriptionError: any) {
        console.log('❌ === ERRORE TRASCRIZIONE ===');
        console.log('🔍 Tipo errore:', typeof transcriptionError);
        console.log('📋 Dettagli errore:', transcriptionError);
        console.log('📋 Messaggio errore:', transcriptionError?.message || 'Nessun messaggio');
        console.log('📋 Stack trace:', transcriptionError?.stack || 'Nessuno stack trace');
        
        // Se è un errore di rete, logga dettagli specifici
        if (transcriptionError?.name === 'TypeError' && transcriptionError?.message?.includes('fetch')) {
          console.log('🌐 Errore di rete rilevato');
        }
        
        // Se è un errore 401, logga dettagli autenticazione
        if (transcriptionError?.message?.includes('401') || transcriptionError?.status === 401) {
          console.log('🔐 Errore 401 - Problema autenticazione rilevato');
          const { data: { session } } = await supabase.auth.getSession();
          console.log('🔍 Stato sessione al momento dell\'errore:', {
            hasSession: !!session,
            tokenPresent: !!session?.access_token,
            expired: session?.expires_at ? Date.now() > session.expires_at * 1000 : 'unknown'
          });
        }
        
        // Gestione errori specifici basata sui test
        let errorMessage = "Errore durante la trascrizione audio.";
        
        if (transcriptionError?.message?.includes('too short')) {
          errorMessage = "L'audio è troppo breve. L'API richiede almeno 0.01 secondi di audio.";
        } else if (transcriptionError?.message?.includes('Invalid API Key')) {
          errorMessage = "Problema di autenticazione con il servizio AI. Contatta il supporto.";
        } else if (transcriptionError?.message?.includes('audio file')) {
          errorMessage = "Formato audio non supportato. Riprova la registrazione.";
        } else if (transcriptionError?.status === 401) {
          errorMessage = "Errore di autenticazione. Verifica di essere loggato.";
        } else if (transcriptionError?.status === 400) {
          errorMessage = "Problema con il file audio. Riprova con una registrazione più lunga e chiara.";
        }
        
        toast({
          title: "Errore Trascrizione",
          description: errorMessage,
          variant: "destructive"
        });
      }
    };
    
    console.log('📖 Avvio lettura file audio...');
    reader.readAsDataURL(audioBlob);
    console.log('🎯 === FINE SETUP ELABORAZIONE AUDIO ===');
  };

  const downloadAudio = () => {
    if (!audioBlob) {
      toast({
        title: "Nessun audio",
        description: "Non c'è nessun file audio da scaricare. Registra prima un audio.",
        variant: "destructive"
      });
      return;
    }

    console.log('💾 Download file audio...');
    console.log('📊 Dimensioni file:', audioBlob.size, 'bytes');
    console.log('📊 Tipo file:', audioBlob.type);
    
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrazione_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download completato",
      description: "Il file audio è stato scaricato con successo.",
    });
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
              <>
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
                
                <Button 
                  onClick={downloadAudio}
                  variant="outline"
                  disabled={loading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Scarica Audio
                </Button>
              </>
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