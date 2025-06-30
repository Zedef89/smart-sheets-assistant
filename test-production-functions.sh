#!/bin/bash

# Script per testare le Edge Functions in modalità produzione
# Richiede un token JWT valido di un utente autenticato

set -e

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Test delle Edge Functions - Modalità Produzione${NC}"
echo "======================================================"

# Carica le variabili d'ambiente
if [ -f "supabase/functions/.env" ]; then
    echo -e "${GREEN}✓ Caricamento variabili d'ambiente...${NC}"
    export $(grep -v '^#' supabase/functions/.env | xargs)
else
    echo -e "${RED}❌ File .env non trovato in supabase/functions/.env${NC}"
    exit 1
fi

# Verifica che le variabili necessarie siano impostate
if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}❌ SUPABASE_URL mancante${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  Per testare in modalità produzione, inserisci un token JWT valido:${NC}"
echo "   Puoi ottenerlo dal browser (DevTools > Application > Local Storage > sb-[project]-auth-token)"
echo "   Oppure tramite l'SDK Supabase con supabase.auth.getSession()"
echo ""
read -p "JWT Token: " JWT_TOKEN

if [ -z "$JWT_TOKEN" ]; then
    echo -e "${RED}❌ JWT Token è richiesto per i test di produzione${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔄 Test 1: sync-subscription (Produzione)${NC}"
echo "------------------------------------------"

response=$(curl -s -w "\n%{http_code}" -X POST \
  "$SUPABASE_URL/functions/v1/sync-subscription" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

# Separa la risposta dal codice HTTP
http_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | head -n -1)

echo "HTTP Status: $http_code"
echo "Response: $response_body"

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ sync-subscription: SUCCESS${NC}"
else
    echo -e "${RED}❌ sync-subscription: FAILED${NC}"
fi

echo ""
echo -e "${YELLOW}🔄 Test 2: stripe-webhook (Verifica Firma)${NC}"
echo "--------------------------------------------"
echo -e "${YELLOW}⚠️  Il webhook Stripe richiede una firma valida da Stripe.${NC}"
echo "   Per testarlo completamente, usa il Stripe CLI o il Webhook Tester."
echo "   Questo test verificherà solo che la funzione risponda correttamente a richieste non firmate."

webhook_response=$(curl -s -w "\n%{http_code}" -X POST \
  "$SUPABASE_URL/functions/v1/stripe-webhook" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}')

webhook_http_code=$(echo "$webhook_response" | tail -n1)
webhook_response_body=$(echo "$webhook_response" | head -n -1)

echo "HTTP Status: $webhook_http_code"
echo "Response: $webhook_response_body"

if [ "$webhook_http_code" = "400" ]; then
    echo -e "${GREEN}✓ stripe-webhook: Risposta corretta (firma mancante)${NC}"
else
    echo -e "${YELLOW}⚠️  stripe-webhook: Risposta inaspettata${NC}"
fi

echo ""
echo -e "${YELLOW}📋 Riepilogo Test Produzione${NC}"
echo "============================="

if [ "$http_code" = "200" ]; then
    echo -e "• sync-subscription: ${GREEN}✓ FUNZIONANTE${NC}"
else
    echo -e "• sync-subscription: ${RED}❌ ERRORE${NC}"
fi

if [ "$webhook_http_code" = "400" ]; then
    echo -e "• stripe-webhook: ${GREEN}✓ CONFIGURATO CORRETTAMENTE${NC}"
else
    echo -e "• stripe-webhook: ${YELLOW}⚠️  DA VERIFICARE${NC}"
fi

echo ""
echo -e "${YELLOW}💡 Note per la Produzione:${NC}"
echo "• Le funzioni sono ora configurate per l'ambiente di produzione"
echo "• sync-subscription richiede token JWT validi di utenti autenticati"
echo "• stripe-webhook verifica automaticamente le firme Stripe"
echo "• URL webhook per Stripe: $SUPABASE_URL/functions/v1/stripe-webhook"
echo "• Configura questo URL nel dashboard Stripe per ricevere eventi reali"