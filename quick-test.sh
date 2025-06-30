#!/bin/bash

# Test rapido delle Edge Functions
# Usa le variabili d'ambiente dal file .env

set -e

# Carica le variabili d'ambiente
if [ -f "supabase/functions/.env" ]; then
    export $(grep -v '^#' supabase/functions/.env | xargs)
else
    echo "❌ File .env non trovato"
    exit 1
fi

# Inserisci qui la tua SUPABASE_ANON_KEY
# Puoi trovarla nel dashboard Supabase > Settings > API
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZHNrdmhibWJwb3d3cXlmYW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTQ1NjEsImV4cCI6MjA2NjEzMDU2MX0.YOUR_ANON_KEY_HERE"

echo "🧪 Test rapido sync-subscription"
echo "================================"

curl -X POST \
  "$SUPABASE_URL/functions/v1/sync-subscription" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "💡 Per testare stripe-webhook:"
echo "curl -X POST $SUPABASE_URL/functions/v1/stripe-webhook -H 'Content-Type: application/json' -d '{}'"
echo ""
echo "📋 Controlla i log nel dashboard Supabase per dettagli degli errori"