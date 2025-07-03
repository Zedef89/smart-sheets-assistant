# Smart Sheets Assistant 🤖💰

**Il tuo assistente finanziario intelligente powered by AI**

Smart Sheets Assistant è un'applicazione web moderna per la gestione delle finanze personali che utilizza l'intelligenza artificiale per semplificare il tracciamento delle spese e delle entrate. Inserisci le tue transazioni in linguaggio naturale e lascia che l'AI faccia il resto!

## ✨ Caratteristiche Principali

### 🧠 Intelligenza Artificiale Avanzata
- **Input in Linguaggio Naturale**: Scrivi "Ho speso 15€ per pizza" e l'AI capisce automaticamente importo, categoria e tipo di transazione
- **Trascrizione Vocale**: Registra le tue spese parlando, l'AI trascrive e analizza automaticamente
- **Categorizzazione Automatica**: L'AI suggerisce la categoria più appropriata per ogni transazione
- **Analisi Smart**: Ricevi insights personalizzati sui tuoi pattern di spesa

### 📊 Dashboard Interattiva
- **Grafici in Tempo Reale**: Visualizza le tue finanze con grafici a torta e a barre dinamici
- **Statistiche Rapide**: Panoramica immediata di entrate, uscite e bilancio
- **Aggiornamenti Automatici**: I grafici si aggiornano automaticamente quando aggiungi, modifichi o elimini transazioni
- **Filtri Temporali**: Analizza i dati per periodi specifici

### 💳 Gestione Transazioni
- **CRUD Completo**: Crea, leggi, aggiorna ed elimina transazioni
- **Validazione Intelligente**: Controlli automatici per prevenire errori (es. importi troppo elevati)
- **Categorie Personalizzabili**: Sistema di categorie flessibile con colori distintivi
- **Supporto Multi-Valuta**: Gestione di importi in diverse valute

### 🔐 Sicurezza e Autenticazione
- **Autenticazione Google**: Login sicuro tramite Google OAuth
- **Row Level Security**: I dati sono protetti a livello di database
- **Dati Crittografati**: Tutte le informazioni sono memorizzate in modo sicuro

### 🎙️ Funzionalità Vocali
- **Registrazione Audio**: Registra le tue spese direttamente dall'app
- **Trascrizione AI**: Conversione automatica da audio a testo usando Whisper
- **Supporto Multilingua**: Ottimizzato per l'italiano ma supporta altre lingue

## 🛠️ Tecnologie Utilizzate

### Frontend
- **React 18** con TypeScript
- **Vite** per il build system
- **React Router DOM** per la navigazione
- **React Query (TanStack Query)** per la gestione dello stato e cache
- **Recharts** per i grafici interattivi
- **Radix UI** + **Shadcn/ui** per i componenti UI
- **Tailwind CSS** per lo styling
- **Lucide React** per le icone

### Backend
- **Supabase** come Backend-as-a-Service
- **PostgreSQL** per il database
- **Supabase Edge Functions** (Deno) per le API
- **Row Level Security (RLS)** per la sicurezza dei dati

### AI e Machine Learning
- **Groq API** con modello Llama per l'analisi del linguaggio naturale
- **OpenAI Whisper** (via Groq) per la trascrizione vocale
- **Prompt Engineering** ottimizzato per transazioni finanziarie

### Autenticazione e Pagamenti
- **Supabase Auth** con Google OAuth
- **Stripe** per la gestione dei pagamenti e abbonamenti

## 🚀 Installazione e Setup

### Prerequisiti
- Node.js 18+
- npm o yarn
- Account Supabase
- API Key Groq
- Account Stripe (per i pagamenti)

### 1. Clona il Repository
```bash
git clone https://github.com/your-username/smart-sheets-assistant.git
cd smart-sheets-assistant
```

### 2. Installa le Dipendenze
```bash
npm install
```

### 3. Configura le Variabili d'Ambiente
Crea un file `.env.local` nella root del progetto:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Setup Supabase
1. Crea un nuovo progetto su [Supabase](https://supabase.com)
2. Esegui le migrazioni del database:
```bash
supabase db push
```
3. Configura le Edge Functions:
```bash
supabase functions deploy groq-ai
supabase functions deploy whisper-transcription
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook
```

### 5. Configura le API Keys
Nelle impostazioni di Supabase, aggiungi le seguenti variabili d'ambiente:
- `GROQ_API_KEY`: La tua API key di Groq
- `STRIPE_SECRET_KEY`: La tua chiave segreta Stripe
- `STRIPE_WEBHOOK_SECRET`: Il secret del webhook Stripe

### 6. Avvia l'Applicazione
```bash
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:5173`

## 📱 Come Usare l'App

### 1. Primo Accesso
1. Visita l'applicazione
2. Clicca su "Inizia Gratis"
3. Accedi con il tuo account Google

### 2. Aggiungere Transazioni

#### Metodo 1: Input Naturale
1. Clicca su "Nuova Transazione"
2. Scrivi in linguaggio naturale, ad esempio:
   - "Ho speso 25€ per la spesa al supermercato"
   - "Ricevuto stipendio di 1500€"
   - "Pagato 80€ di bolletta della luce"
3. L'AI analizzerà automaticamente e compilerà i campi

#### Metodo 2: Registrazione Vocale
1. Clicca sull'icona del microfono
2. Parla chiaramente la tua transazione
3. L'AI trascriverà e analizzerà automaticamente

#### Metodo 3: Input Manuale
1. Compila manualmente i campi:
   - Tipo (Entrata/Uscita)
   - Descrizione
   - Importo
   - Categoria
   - Data

### 3. Visualizzare i Dati
- **Dashboard**: Panoramica generale con grafici e statistiche
- **Grafici Interattivi**: Hover sui grafici per dettagli specifici
- **Lista Transazioni**: Visualizza, modifica o elimina transazioni esistenti

## 🏗️ Architettura del Database

### Tabelle Principali

#### `profiles`
- Profili utente collegati all'autenticazione
- Informazioni base (email, nome, avatar)

#### `transactions`
- Transazioni finanziarie degli utenti
- Campi: id, user_id, description, amount, category, type, date
- Validazione: amount DECIMAL(10,2) per prevenire overflow

#### `categories`
- Categorie predefinite per le transazioni
- Supporto per colori e icone personalizzate

#### `ai_usage_tracking`
- Tracciamento dell'utilizzo delle funzionalità AI
- Limiti giornalieri per trascrizioni e analisi

## 🔧 Funzionalità Avanzate

### Sistema di Abbonamenti
- **Piano Gratuito**: Funzionalità base con limiti
- **Piano Premium**: Accesso illimitato alle funzionalità AI
- Integrazione completa con Stripe

### Gestione degli Errori
- Validazione lato client e server
- Messaggi di errore user-friendly
- Fallback per funzionalità AI non disponibili

### Performance
- Caching intelligente con React Query
- Invalidazione automatica delle query
- Lazy loading dei componenti

## 🤝 Contribuire

1. Fork del repository
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push del branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

## 🆘 Supporto

Per supporto o domande:
- Apri una issue su GitHub
- Contatta il team di sviluppo

## 🔮 Roadmap

- [ ] App mobile (React Native)
- [ ] Esportazione dati (CSV, PDF)
- [ ] Budgeting e obiettivi di risparmio
- [ ] Integrazione con banche (Open Banking)
- [ ] Analisi predittive avanzate
- [ ] Supporto per criptovalute

---

**Smart Sheets Assistant** - Semplifica la gestione delle tue finanze con l'intelligenza artificiale! 🚀
