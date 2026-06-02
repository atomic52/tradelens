"""
Stripe billing endpoints.

POST /billing/checkout  → create a Checkout Session, return {url}
POST /billing/portal    → create a Customer Portal session, return {url}
POST /billing/webhook   → Stripe webhook (raw body, no auth)
"""

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import current_active_user
from app.core.config import settings
from app.db.base import get_async_session
from app.models.user import User

router = APIRouter(prefix="/billing", tags=["billing"])


def _stripe_client() -> stripe.StripeClient:
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Billing not configured")
    return stripe.StripeClient(settings.stripe_secret_key)


# ── Checkout ──────────────────────────────────────────────────────────────────

@router.post("/checkout")
async def create_checkout_session(
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """Create a Stripe Checkout Session for TradeLens Pro."""
    if user.subscription_status == "pro":
        raise HTTPException(status_code=400, detail="Already subscribed to Pro")

    client = _stripe_client()

    # Reuse or create a Stripe customer so the portal works later
    customer_id = user.stripe_customer_id
    if not customer_id:
        customer = client.customers.create(email=user.email, metadata={"user_id": str(user.id)})
        customer_id = customer.id
        user.stripe_customer_id = customer_id
        await session.commit()

    checkout = client.checkout.sessions.create(
        customer=customer_id,
        line_items=[{"price": settings.stripe_price_id, "quantity": 1}],
        mode="subscription",
        success_url=f"{settings.frontend_url}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.frontend_url}/billing/cancel",
        allow_promotion_codes=True,
    )
    return {"url": checkout.url}


# ── Customer Portal ───────────────────────────────────────────────────────────

@router.post("/portal")
async def create_portal_session(
    user: User = Depends(current_active_user),
):
    """Create a Stripe Customer Portal session (manage/cancel subscription)."""
    if not user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No billing account found")

    client = _stripe_client()
    portal = client.billing_portal.sessions.create(
        customer=user.stripe_customer_id,
        return_url=f"{settings.frontend_url}/settings",
    )
    return {"url": portal.url}


# ── Webhook ───────────────────────────────────────────────────────────────────

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    session: AsyncSession = Depends(get_async_session),
):
    """
    Stripe webhook handler. Must be excluded from CSRF / auth middleware.
    Listens for:
      - checkout.session.completed  → activate Pro
      - customer.subscription.updated → sync status
      - customer.subscription.deleted → downgrade to free
    """
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=503, detail="Webhook secret not configured")

    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig, settings.stripe_webhook_secret
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    await _handle_event(event, session)
    return {"status": "ok"}


async def _handle_event(event: dict, session: AsyncSession) -> None:
    from sqlalchemy import select

    etype = event["type"]
    data = event["data"]["object"]

    if etype == "checkout.session.completed":
        customer_id = data.get("customer")
        if customer_id:
            await _set_status(customer_id, "pro", session)

    elif etype == "customer.subscription.updated":
        customer_id = data.get("customer")
        stripe_status = data.get("status", "")
        # active / trialing → pro; anything else → free
        new_status = "pro" if stripe_status in ("active", "trialing") else "free"
        if customer_id:
            await _set_status(customer_id, new_status, session)

    elif etype == "customer.subscription.deleted":
        customer_id = data.get("customer")
        if customer_id:
            await _set_status(customer_id, "canceled", session)


async def _set_status(stripe_customer_id: str, status: str, session: AsyncSession) -> None:
    from sqlalchemy import select, update
    from app.models.user import User

    await session.execute(
        update(User)
        .where(User.stripe_customer_id == stripe_customer_id)
        .values(subscription_status=status)
    )
    await session.commit()
