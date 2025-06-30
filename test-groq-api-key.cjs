// Script per testare la validità della chiave API Groq
const fs = require('fs');
const path = require('path');

async function testGroqApiKey() {
  console.log('🔑 Test validità chiave API Groq');
  console.log('=' .repeat(40));
  
  // Leggi la chiave API dal file .env
  const envPath = path.join(__dirname, 'supabase', 'functions', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ File .env non trovato');
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('📄 Contenuto .env:');
  console.log(envContent);
  
  const groqApiKey = envContent.match(/GROQ_API_KEY="?([^"\n]+)"?/)?.[1]?.trim();
  
  if (!groqApiKey) {
    console.error('❌ GROQ_API_KEY non trovata nel file .env');
    return;
  }
  
  console.log('🔍 Chiave API trovata:', groqApiKey.substring(0, 10) + '...');
  console.log('📏 Lunghezza chiave:', groqApiKey.length);
  
  try {
    // Test con una chiamata semplice all'API Groq (lista modelli)
    const fetch = require('node-fetch');
    
    console.log('🚀 Test connessione API Groq...');
    
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Risposta ricevuta, status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Errore API:', response.status, response.statusText);
      console.error('📄 Dettagli:', errorText);
      
      if (response.status === 401) {
        console.log('💡 La chiave API non è valida o è scaduta');
        console.log('💡 Verifica su https://console.groq.com/keys');
      }
      return;
    }
    
    const result = await response.json();
    console.log('✅ API Groq funziona correttamente!');
    console.log('📋 Modelli disponibili:');
    
    if (result.data && Array.isArray(result.data)) {
      result.data.forEach(model => {
        console.log('  -', model.id);
      });
      
      // Cerca modelli Whisper
      const whisperModels = result.data.filter(m => m.id.includes('whisper'));
      if (whisperModels.length > 0) {
        console.log('🎤 Modelli Whisper trovati:');
        whisperModels.forEach(model => {
          console.log('  ✅', model.id);
        });
      } else {
        console.log('⚠️  Nessun modello Whisper trovato');
      }
    }
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('🌐 Problema di connessione di rete');
    }
  }
}

// Esegui il test
if (require.main === module) {
  testGroqApiKey();
}

module.exports = { testGroqApiKey };