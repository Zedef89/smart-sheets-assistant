#!/bin/bash

# Script per testare le Edge Functions di Supabase
# Legge le variabili d'ambiente dal file .env

set -e

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Test delle Edge Functions${NC}"
echo "=============================="

# Carica le variabili d'ambiente
if [ -f "supabase/functions/.env" ]; then
    echo -e "${GREEN}✓ Caricamento variabili d'ambiente...${NC}"
    export $(grep -v '^#' supabase/functions/.env | xargs)
else
    echo -e "${RED}❌ File .env non trovato in supabase/functions/.env${NC}"
    exit 1
fi

# Verifica che le variabili necessarie siano impostate
if [ -z "$SUPABASE_URL" ] || [ -z "$STRIPE_SECRET_KEY" ] || [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo -e "${RED}❌ Variabili d'ambiente mancanti${NC}"
    echo "Assicurati che SUPABASE_URL, STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET siano impostati"
    exit 1
fi

# Ottieni la chiave anonima di Supabase (dovrai inserirla manualmente)
echo -e "${YELLOW}⚠️  Inserisci la tua SUPABASE_ANON_KEY:${NC}"
read -p "SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_ANON_KEY è richiesta${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔄 Test 1: sync-subscription${NC}"
echo "----------------------------"

response=$(curl -s -w "\n%{http_code}" -X POST \
  "$SUPABASE_URL/functions/v1/sync-subscription" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "HTTP Status: $http_code"
echo "Response: $body"

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ sync-subscription: SUCCESS${NC}"
else
    echo -e "${RED}❌ sync-subscription: FAILED${NC}"
fi

echo ""
echo -e "${YELLOW}🔄 Test 2: stripe-webhook${NC}"
echo "---------------------------"

# Payload di test per checkout.session.completed
test_payload='{
  "id": "evt_test_webhook",
  "object": "event",
  "api_version": "2020-08-27",
  "created": 1234567890,
  "data": {
    "object": {
      "id": "cs_test_123456789",
      "object": "checkout.session",
      "customer": "cus_test_123",
      "subscription": "sub_test_123",
      "mode": "subscription",
      "status": "complete"
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_test_123",
    "idempotency_key": null
  },
  "type": "checkout.session.completed"
}'

# Genera una firma di test (nota: questa non sarà valida per la verifica reale)
test_signature="t=$(date +%s),v1=test_signature_for_testing"

response=$(curl -s -w "\n%{http_code}" -X POST \
  "$SUPABASE_URL/functions/v1/stripe-webhook" \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: $test_signature" \
  -d "$test_payload")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "HTTP Status: $http_code"
echo "Response: $body"

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ stripe-webhook: SUCCESS${NC}"
else
    echo -e "${RED}❌ stripe-webhook: FAILED (normale se la firma non è valida)${NC}"
fi

echo ""
echo -e "${YELLOW}📋 Riepilogo Test${NC}"
echo "================="
echo "• sync-subscription: $([ "$http_code" = "200" ] && echo -e "${GREEN}✓ OK${NC}" || echo -e "${RED}❌ FAILED${NC}")"
echo "• stripe-webhook: Test completato (verifica manuale necessaria per firma Stripe)"
echo ""
echo -e "${YELLOW}💡 Note:${NC}"
echo "• Per testare completamente stripe-webhook, usa il Webhook Tester di Stripe"
echo "• I log dettagliati sono disponibili nel dashboard Supabase > Functions > Logs"
echo "• URL webhook per Stripe: $SUPABASE_URL/functions/v1/stripe-webhook"