// Script per testare Whisper con un file audio più realistico
const fs = require('fs');
const path = require('path');

// Funzione per creare un file WAV di test minimo ma valido
function createValidWavFile() {
  // Header WAV minimo (44 bytes) + alcuni dati audio
  const header = Buffer.alloc(44);
  
  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(36, 4); // File size - 8
  header.write('WAVE', 8);
  
  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20);  // Audio format (PCM)
  header.writeUInt16LE(1, 22);  // Number of channels
  header.writeUInt32LE(8000, 24); // Sample rate
  header.writeUInt32LE(16000, 28); // Byte rate
  header.writeUInt16LE(2, 32);  // Block align
  header.writeUInt16LE(16, 34); // Bits per sample
  
  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(0, 40); // Data size (0 for empty)
  
  return header;
}

// Funzione per testare Whisper con file WAV
async function testWhisperWithWav() {
  console.log('🎤 Test Groq Whisper con file WAV');
  console.log('=' .repeat(45));
  
  // Leggi la chiave API
  const envPath = path.join(__dirname, 'supabase', 'functions', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const groqApiKey = envContent.match(/GROQ_API_KEY="?([^"\n]+)"?/)?.[1]?.trim();
  
  if (!groqApiKey) {
    console.error('❌ GROQ_API_KEY non trovata');
    return;
  }
  
  console.log('✅ Chiave API caricata');
  
  try {
    // Crea un file WAV valido
    const wavBuffer = createValidWavFile();
    console.log('📁 File WAV creato:', wavBuffer.length, 'bytes');
    
    // Test 1: File WAV
    await testWithFormat(groqApiKey, wavBuffer, 'test-audio.wav', 'audio/wav');
    
    console.log('\n' + '='.repeat(45));
    
    // Test 2: Prova con un file audio molto piccolo ma con contenuto
    const smallAudioBuffer = Buffer.from([
      // Header WAV minimo con un po' di dati audio
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0x24, 0x00, 0x00, 0x00, // File size
      0x57, 0x41, 0x56, 0x45, // "WAVE"
      0x66, 0x6D, 0x74, 0x20, // "fmt "
      0x10, 0x00, 0x00, 0x00, // fmt chunk size
      0x01, 0x00, 0x01, 0x00, // PCM, mono
      0x40, 0x1F, 0x00, 0x00, // 8000 Hz
      0x80, 0x3E, 0x00, 0x00, // Byte rate
      0x02, 0x00, 0x10, 0x00, // Block align, 16 bit
      0x64, 0x61, 0x74, 0x61, // "data"
      0x00, 0x00, 0x00, 0x00  // Data size (empty)
    ]);
    
    console.log('📁 File WAV piccolo creato:', smallAudioBuffer.length, 'bytes');
    await testWithFormat(groqApiKey, smallAudioBuffer, 'small-audio.wav', 'audio/wav');
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
  }
}

// Funzione helper per testare con un formato specifico
async function testWithFormat(apiKey, audioBuffer, filename, contentType) {
  console.log(`\n🧪 Test con ${filename} (${contentType})`);
  
  try {
    const FormData = require('form-data');
    const fetch = require('node-fetch');
    
    const form = new FormData();
    form.append('file', audioBuffer, {
      filename: filename,
      contentType: contentType
    });
    form.append('model', 'whisper-large-v3');
    form.append('language', 'it');
    form.append('response_format', 'json');
    
    console.log('🚀 Invio richiesta...');
    
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    console.log('📡 Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Errore:', response.status, response.statusText);
      console.error('📄 Dettagli:', errorText);
      
      // Analizza errori comuni
      if (errorText.includes('audio file')) {
        console.log('💡 Problema con il formato del file audio');
      } else if (errorText.includes('duration')) {
        console.log('💡 File audio troppo corto o troppo lungo');
      }
      return;
    }
    
    const result = await response.json();
    console.log('✅ Successo!');
    console.log('📝 Risultato:', JSON.stringify(result, null, 2));
    
    if (result.text) {
      console.log('🎯 Testo:', result.text);
    } else {
      console.log('ℹ️  Nessun testo (normale per audio vuoto)');
    }
    
  } catch (error) {
    console.error('❌ Errore nella richiesta:', error.message);
  }
}

// Esegui il test
if (require.main === module) {
  testWhisperWithWav();
}

module.exports = { testWhisperWithWav, createValidWavFile };