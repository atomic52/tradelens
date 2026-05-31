# Plan: Pro Subscription Integration (Stripe)

## Overview

Add a paid Pro tier to TradeLens using Stripe Billing. Free users are limited to 5 total imports; Pro users get unlimited imports and access to additional features. Payment is handled entirely by Stripe-hosted pages — TradeLens never touches card data.

---

## Pricing

| | Free | Pro |
|---|---|---|
| Imports | 5 total | Unlimited |
| Accounts | 1 | Unlimited |
| Analytics period | All-time | All-time |
| Trade history | Unlimited | Unlimited |
| Notes & tags | Yes | Yes |
| CSV export | — | Yes *(future)* |
| Price | $0 | $X / month *(TBD)* |

---

## Architecture

```
User clicks "Upgrade"
  → POST /billing/create-checkout
  → Backend creates Stripe Checkout Session
  → Redirect to Stripe-hosted payment page
  → User pays
  → Stripe fires checkout.session.completed webhook
  → Backend marks user as Pro (plan = "pro", stripe_customer_id = ...)
  → User redirected back to /dashboard?upgraded=true
```

Cancellations and plan changes go through the Stripe Customer Portal (also hosted by Stripe).

---

## 1. Stripe setup (manual, before coding)

1. Sign up at https://stripe.com
2. In the Stripe Dashboard → **Products** → Create a product:
   - Name: `TradeLens Pro`
   - Pricing: recurring, monthly, set your price
   - Copy the **Price ID** (looks like `price_1ABC...`)
3. In **Developers → Webhooks** → Add endpoint:
   - URL: `https://tradelens-api.fly.dev/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the **Webhook Signing Secret** (`whsec_...`)
4. Copy your **Secret Key** (`sk_live_...` or `sk_test_...` for testing)

---

## 2. Backend changes

### 2a. New columns on `user` table

Add to `User` model:

```python
plan: str = "free"                    # "free" | "pro"
stripe_customer_id: str | None = None
stripe_subscription_id: str | None = None
subscription_status: str | None = None  # "active" | "canceled" | "past_due" etc.
```

Migration: `alembic revision --autogenerate -m "add stripe fields to user"`

### 2b. New environment variables

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from webhook endpoint |
| `STRIPE_PRICE_ID` | `price_1ABC...` — the monthly Pro price |
| `FRONTEND_URL` | `https://tradelens-brown.vercel.app` — for Checkout success/cancel redirects |

### 2c. New router: `backend/app/api/v1/endpoints/billing.py`

```
POST /billing/create-checkout
  - Creates or retrieves Stripe Customer for the user
  - Creates a Checkout Session (mode=subscription, price=STRIPE_PRICE_ID)
  - success_url = FRONTEND_URL/dashboard?upgraded=true
  - cancel_url  = FRONTEND_URL/dashboard
  - Returns { checkout_url: str }

GET /billing/portal
  - Creates a Stripe Customer Portal session for self-serve management
  - Returns { portal_url: str }

GET /billing/status
  - Returns { plan, subscription_status } for the current user
```

### 2d. New router: `backend/app/api/v1/endpoints/webhooks.py`

```
POST /webhooks/stripe
  - Verifies Stripe signature (stripe.Webhook.construct_event)
  - Handles events:

    checkout.session.completed
      → set user.plan = "pro"
      → set user.stripe_customer_id
      → set user.stripe_subscription_id
      → set user.subscription_status = "active"

    customer.subscription.updated
      → update user.subscription_status
      → if status == "active": plan = "pro"
      → if status in ("canceled", "unpaid", "past_due"): plan = "free"

    customer.subscription.deleted
      → set user.plan = "free"
      → set user.subscription_status = "canceled"
```

> **Important:** The webhook is the source of truth — never trust the Checkout redirect alone to activate Pro.

### 2e. Update import limit check

In `imports.py`, update `_check_import_limit`:

```python
async def _check_import_limit(user: User, session: AsyncSession) -> None:
    if user.plan == "pro":
        return   # unlimited
    # existing 5-import check...
```

### 2f. Install dependency

```bash
pip install stripe
```

Add to `requirements.txt`:
```
stripe>=9.0.0
```

### 2g. Register new routers

In `backend/app/api/v1/router.py`:

```python
from .endpoints import billing, webhooks

router.include_router(billing.router, tags=["billing"])
# Webhooks must NOT use auth middleware (Stripe calls it, not the user)
router.include_router(webhooks.router, tags=["webhooks"])
```

---

## 3. Frontend changes

### 3a. New API calls in `api.ts`

```typescript
export const billing = {
  createCheckout: () =>
    api.post<{ checkout_url: string }>("/billing/create-checkout").then(r => r.data),
  portal: () =>
    api.post<{ portal_url: string }>("/billing/portal").then(r => r.data),
  status: () =>
    api.get<{ plan: string; subscription_status: string | null }>("/billing/status").then(r => r.data),
};
```

### 3b. Update `User` type

```typescript
interface User {
  id: string;
  email: string;
  is_active: boolean;
  plan: "free" | "pro";
  subscription_status: string | null;
}
```

### 3c. New `UpgradeButton` component

`src/components/ui/UpgradeButton.tsx`

- Calls `billing.createCheckout()` on click
- Shows a spinner while waiting
- Redirects to `checkout_url` on success
- Shown whenever `user.plan === "free"`

### 3d. Upgrade prompt placements

- **Import page** — replace the static "Upgrade to Pro" text in the 402 banner with `<UpgradeButton />`
- **Nav** — show a subtle `Upgrade` pill next to the user email when on free plan
- **New `/pricing` page** — simple public page showing Free vs Pro comparison table with an upgrade CTA (accessible without login)

### 3e. Post-upgrade success

In `Dashboard.tsx`, detect `?upgraded=true` query param and show a one-time green "Welcome to Pro!" toast/banner.

### 3f. Settings page billing section

Add a "Billing" section to `SettingsPage.tsx`:

- If `plan === "free"`: show `<UpgradeButton />`
- If `plan === "pro"`: show subscription status + "Manage billing" button → calls `billing.portal()` → redirect

---

## 4. Testing plan

### Local testing with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Log in
stripe login

# Forward webhooks to local backend
stripe listen --forward-to localhost:8000/api/v1/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
```

Use `sk_test_...` key and Stripe's test card `4242 4242 4242 4242` during development.

### Checklist

- [ ] Free user hits 5 imports → sees upgrade prompt
- [ ] Clicking upgrade → redirects to Stripe Checkout
- [ ] Completing payment → `checkout.session.completed` webhook fires → user.plan = "pro"
- [ ] Pro user can import beyond 5 with no 402
- [ ] Cancelling via Customer Portal → `customer.subscription.deleted` fires → user.plan = "free"
- [ ] Webhook signature verification rejects tampered payloads
- [ ] `/billing/status` returns correct plan in all states

---

## 5. Deployment steps

Once built and tested locally:

```bash
# Add Stripe secrets to Fly
fly secrets set \
  STRIPE_SECRET_KEY="sk_live_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..." \
  STRIPE_PRICE_ID="price_1ABC..." \
  FRONTEND_URL="https://tradelens-brown.vercel.app"

fly deploy

# Update webhook URL in Stripe Dashboard to production endpoint
# https://tradelens-api.fly.dev/api/v1/webhooks/stripe
```

---

## 6. Implementation order

1. Stripe account setup + create product/price (manual)
2. Backend: user model migration (plan + stripe fields)
3. Backend: `billing.py` endpoints
4. Backend: `webhooks.py` handler
5. Backend: update import limit check to respect `plan`
6. Local testing with Stripe CLI
7. Frontend: `api.ts` billing calls + `User` type update
8. Frontend: `UpgradeButton` component
9. Frontend: upgrade prompts (import page, nav, settings)
10. Frontend: `/pricing` public page
11. Frontend: post-upgrade success banner
12. End-to-end test with Stripe test cards
13. Deploy backend secrets + `fly deploy`
14. Update Stripe webhook URL to production
