// Script per testare direttamente l'API Whisper di Groq
const fs = require('fs');
const path = require('path');

// Funzione per creare un file audio di test (simulato)
function createTestAudioFile() {
  // Crea un file audio WebM di test molto semplice (header minimo)
  const webmHeader = Buffer.from([
    0x1A, 0x45, 0xDF, 0xA3, // EBML header
    0x9F, 0x42, 0x86, 0x81, 0x01, // DocType: webm
    0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6D // "webm"
  ]);
  
  return webmHeader;
}

// Funzione per testare l'API Groq Whisper
async function testGroqWhisper() {
  console.log('🎤 Test API Groq Whisper');
  console.log('=' .repeat(40));
  
  // Leggi la chiave API dal file .env
  const envPath = path.join(__dirname, 'supabase', 'functions', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ File .env non trovato in supabase/functions/');
    console.log('💡 Assicurati che esista il file supabase/functions/.env con GROQ_API_KEY');
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const groqApiKey = envContent.match(/GROQ_API_KEY=(.+)/)?.[1]?.trim();
  
  if (!groqApiKey) {
    console.error('❌ GROQ_API_KEY non trovata nel file .env');
    return;
  }
  
  console.log('✅ Chiave API Groq trovata');
  
  try {
    // Crea un file audio di test
    const audioBuffer = createTestAudioFile();
    console.log('📁 File audio di test creato:', audioBuffer.length, 'bytes');
    
    // Prepara FormData per l'API Groq
    const FormData = require('form-data');
    const form = new FormData();
    
    // Aggiungi il file audio
    form.append('file', audioBuffer, {
      filename: 'test-audio.webm',
      contentType: 'audio/webm'
    });
    
    // Aggiungi parametri richiesti
    form.append('model', 'whisper-large-v3');
    form.append('language', 'it'); // Italiano
    form.append('response_format', 'json');
    
    console.log('🚀 Invio richiesta a Groq Whisper API...');
    
    // Effettua la chiamata all'API
    const fetch = require('node-fetch');
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    console.log('📡 Risposta ricevuta, status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Errore API:', response.status, response.statusText);
      console.error('📄 Dettagli errore:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Trascrizione completata!');
    console.log('📝 Risultato:', JSON.stringify(result, null, 2));
    
    // Analizza il risultato
    if (result.text) {
      console.log('🎯 Testo trascritto:', result.text);
    } else {
      console.log('⚠️  Nessun testo trascritto (normale per audio di test vuoto)');
    }
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('🌐 Problema di connessione di rete');
    } else if (error.message.includes('fetch')) {
      console.log('📦 Installa node-fetch: npm install node-fetch@2');
    } else if (error.message.includes('form-data')) {
      console.log('📦 Installa form-data: npm install form-data');
    }
  }
}

// Funzione per verificare le dipendenze
function checkDependencies() {
  const dependencies = ['node-fetch', 'form-data'];
  const missing = [];
  
  for (const dep of dependencies) {
    try {
      require.resolve(dep);
      console.log('✅', dep, 'installato');
    } catch (e) {
      missing.push(dep);
      console.log('❌', dep, 'mancante');
    }
  }
  
  if (missing.length > 0) {
    console.log('\n📦 Installa le dipendenze mancanti:');
    console.log('npm install', missing.join(' '));
    return false;
  }
  
  return true;
}

// Esegui il test
if (require.main === module) {
  console.log('🔍 Verifica dipendenze...');
  if (checkDependencies()) {
    console.log('\n');
    testGroqWhisper();
  }
}

module.exports = { testGroqWhisper, checkDependencies };