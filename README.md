# Smart Sheets Assistant

A smart financial assistant that helps you categorize and analyze your transactions using AI, with integrated Stripe payments for premium features.

## Features

- AI-powered transaction categorization
- Custom categories with colors
- Multi-account support
- Dashboard with charts and statistics
- Voice input support
- Real-time data synchronization
- **Stripe Integration** for premium subscriptions
- Lifetime and monthly subscription plans
- Subscription management

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Database + Auth + Edge Functions)
- **Payments**: Stripe
- **Charts**: Recharts
- **State Management**: TanStack Query
- **Voice**: Web Speech API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (for payments)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd smart-sheets-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your credentials in `.env`:
```
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe (Frontend)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_STRIPE_PRICE_LIFETIME=your_lifetime_price_id
VITE_STRIPE_PRICE_SUBSCRIPTION=your_subscription_price_id

# Stripe (Backend - for Edge Functions)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

4. Set up the database:
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push the database schema
supabase db push
```

5. Deploy Supabase Edge Functions:
```bash
# Deploy the Stripe checkout function
supabase functions deploy stripe-checkout

# Deploy the Stripe webhook function
supabase functions deploy stripe-webhook
```

6. Configure Stripe Webhooks:
   - Go to your Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
   - Copy the webhook secret to your environment variables

7. Start the development server:
```bash
npm run dev
```

## Stripe Integration

### Setup

1. **Create Products in Stripe Dashboard:**
   - Lifetime Plan: One-time payment product
   - Monthly Plan: Recurring subscription product

2. **Configure Price IDs:**
   Update the price IDs in your environment variables and in the code:
   - `src/pages/Landing.tsx`
   - `src/pages/Settings.tsx`

3. **Webhook Configuration:**
   The webhook handles the following events:
   - `checkout.session.completed` - Creates/updates subscription records
   - `customer.subscription.updated` - Updates subscription status
   - `customer.subscription.deleted` - Marks subscription as cancelled
   - `invoice.payment_succeeded` - Updates payment status
   - `invoice.payment_failed` - Handles failed payments

### Testing

1. Use Stripe test mode with test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

2. Test webhooks using Stripe CLI:
```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

## Database Schema

The application uses the following main tables:

- `accounts` - User bank accounts
- `categories` - Transaction categories (default + custom)
- `transactions` - Financial transactions
- `user_settings` - User preferences
- `subscriptions` - User subscription data (Stripe integration)

### Subscriptions Table

```sql
CREATE TABLE public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  status text NOT NULL,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## API Endpoints

### Supabase Edge Functions

- `POST /functions/v1/stripe-checkout` - Create Stripe checkout session
- `POST /functions/v1/stripe-webhook` - Handle Stripe webhook events

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the Stripe integration thoroughly
5. Submit a pull request

## Security Notes

- Never commit real Stripe keys to the repository
- Use environment variables for all sensitive data
- Test webhook signatures in production
- Implement proper error handling for payment failures

## License

MIT License
