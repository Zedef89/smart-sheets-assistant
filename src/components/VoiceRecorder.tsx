
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Send, Loader2 } from 'lucide-react';
import { useAIService } from '@/hooks/useAIService';
import { useToast } from '@/hooks/use-toast';

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
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
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

    // Convert blob to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      const audioData = base64Audio.split(',')[1]; // Remove data:audio/wav;base64, prefix

      const transcribedText = await transcribeAudio(audioData);

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
                 
                 If the input is in Italian, use Italian categories like: "Cibo", "Trasporti", "Shopping", "Stipendio", "Casa", "Salute", "Intrattenimento", "Altro".
                 If the input is in English, use English categories like: "Food", "Transportation", "Shopping", "Salary", "Home", "Health", "Entertainment", "Other".
                 
                 Text to analyze: "${transcribedText}"`
               }],
               type: 'text',
               action: 'analyze'
             });
            
            if (analysisResult) {
              onAutoAnalysis(analysisResult);
            }
          } catch (error) {
            console.error('Auto-analysis error:', error);
          }
        }
        
        setAudioBlob(null);
      }
    };
    
    reader.readAsDataURL(audioBlob);
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col items-center space-y-4">
        <h3 className="text-lg font-semibold">Voice Recording</h3>
        
        <div className="flex space-x-4">
          {!isRecording ? (
            <Button 
              onClick={startRecording}
              className="bg-red-500 hover:bg-red-600"
              disabled={loading}
            >
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button 
              onClick={stopRecording}
              variant="outline"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Recording
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
              Process Audio
            </Button>
          )}
        </div>
        
        {isRecording && (
          <div className="flex items-center space-x-2 text-red-500">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span>Recording...</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default VoiceRecorder;
