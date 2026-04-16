"""
Unified email (Resend) + SMS (Twilio) dispatch.

All senders are fire-and-forget: requests never block on a third-party call,
and a missing / failing provider is logged but does not surface to the user.
Set env vars on Render:
    RESEND_API_KEY                — Resend API key
    RESEND_FROM  (optional)       — default "Sree Svadista Prasada <info@sreesvadistaprasada.com>"
    ADMIN_ALERT_EMAIL (optional)  — admin recipient for internal alerts (falls back to ADMIN_EMAIL_2, then ADMIN_EMAIL)
    TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER
    SITE_URL (optional)           — used in email links, default https://sreesvadistaprasada.com
"""
from __future__ import annotations
import os
import asyncio
import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
RESEND_FROM = os.environ.get(
    "RESEND_FROM", "Sree Svadista Prasada <info@sreesvadistaprasada.com>"
)
ADMIN_ALERT_EMAIL = (
    os.environ.get("ADMIN_ALERT_EMAIL")
    or os.environ.get("ADMIN_EMAIL_2")
    or os.environ.get("ADMIN_EMAIL")
    or "info@sreesvadistaprasada.com"
)
SITE_URL = os.environ.get("SITE_URL", "https://sreesvadistaprasada.com").rstrip("/")

TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.environ.get("TWILIO_FROM_NUMBER")


# ── Shared HTML shell ────────────────────────────────────────────────────────

def _wrap(title: str, body_html: str, cta_text: str = "", cta_url: str = "") -> str:
    cta = ""
    if cta_text and cta_url:
        cta = (
            f'<p style="text-align:center;margin:28px 0"><a href="{cta_url}" '
            'style="background:#800020;color:#fff;text-decoration:none;'
            'padding:12px 26px;border-radius:999px;font-weight:600;font-family:Georgia,serif">'
            f'{cta_text}</a></p>'
        )
    return f"""<!doctype html>
<html><body style="margin:0;padding:0;background:#FDFBF7;font-family:Georgia,serif;color:#3b2a24">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="text-align:center;padding:10px 0 6px">
      <span style="font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#800020;font-weight:700">Sree Svadista Prasada</span>
    </div>
    <div style="background:#fff;border:1px solid rgba(244,196,48,0.35);border-radius:14px;padding:28px">
      <h2 style="margin:0 0 14px;color:#800020;font-family:'Playfair Display',Georgia,serif">{title}</h2>
      <div style="font-size:15px;line-height:1.55;color:#3b2a24">{body_html}</div>
      {cta}
    </div>
    <p style="text-align:center;font-size:12px;color:#9C7B6B;margin:16px 0 0">
      Milton Keynes · Edinburgh · Glasgow — <a href="{SITE_URL}" style="color:#9C7B6B">sreesvadistaprasada.com</a>
    </p>
  </div>
</body></html>"""


# ── Low-level senders ────────────────────────────────────────────────────────

async def _send_email_now(to: str, subject: str, html: str) -> None:
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set — skipping email to %s (%s)", to, subject)
        return
    if not to:
        return
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={"from": RESEND_FROM, "to": [to], "subject": subject, "html": html},
            )
            if r.status_code >= 300:
                logger.error("Resend error %s → %s: %s", r.status_code, to, r.text[:400])
            else:
                logger.info("Email sent to=%s subject=%r", to, subject)
    except Exception as e:
        logger.exception("Email send failed to=%s: %s", to, e)


async def _send_sms_now(to: str, body: str) -> None:
    if not (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER):
        logger.warning("Twilio not configured — skipping SMS to %s", to)
        return
    if not to:
        return
    # Ensure E.164-ish
    to_clean = to.strip().replace(" ", "")
    if not to_clean.startswith("+"):
        logger.warning("SMS 'to' is not E.164 (%s) — skipping", to_clean)
        return
    try:
        async with httpx.AsyncClient(
            timeout=15, auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        ) as client:
            r = await client.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json",
                data={"From": TWILIO_FROM_NUMBER, "To": to_clean, "Body": body[:480]},
            )
            if r.status_code >= 300:
                logger.error("Twilio error %s → %s: %s", r.status_code, to_clean, r.text[:400])
            else:
                logger.info("SMS sent to=%s", to_clean)
    except Exception as e:
        logger.exception("SMS send failed to=%s: %s", to_clean, e)


# ── Public fire-and-forget API ───────────────────────────────────────────────

def send_email(to: str, subject: str, html: str) -> None:
    if not to:
        return
    try:
        asyncio.create_task(_send_email_now(to, subject, html))
    except RuntimeError:
        # No running loop — best effort synchronous run
        asyncio.run(_send_email_now(to, subject, html))


def send_sms(to: str, body: str) -> None:
    if not to:
        return
    try:
        asyncio.create_task(_send_sms_now(to, body))
    except RuntimeError:
        asyncio.run(_send_sms_now(to, body))


def notify_admin(subject: str, html: str) -> None:
    send_email(ADMIN_ALERT_EMAIL, subject, html)


# ── Templated helpers (keep route files tidy) ────────────────────────────────

def email_welcome(name: str) -> tuple[str, str]:
    html = _wrap(
        f"Welcome, {name}!",
        "<p>Thank you for joining <b>Sree Svadista Prasada</b>. Your account is ready — "
        "browse today's menu, subscribe to our Dabba Wala weekly plan, or order a takeaway whenever you crave home-style South Indian cooking.</p>"
        "<p>We serve <b>Milton Keynes, Edinburgh, and Glasgow</b>.</p>",
        "Open My Dashboard", f"{SITE_URL}/dashboard",
    )
    return "Welcome to Sree Svadista Prasada", html


def email_order_confirmation(order: dict, name: str) -> tuple[str, str]:
    items_rows = "".join(
        f'<tr><td style="padding:4px 0">{i.get("quantity",1)} × {i.get("name","Item")}</td>'
        f'<td style="padding:4px 0;text-align:right">£{(i.get("price",0)*i.get("quantity",1)):.2f}</td></tr>'
        for i in (order.get("items") or [])
    )
    addr = order.get("delivery_address") or {}
    addr_line = ", ".join(filter(None, [
        addr.get("line1"), addr.get("line2"), addr.get("city"), addr.get("postcode")
    ]))
    html = _wrap(
        "Order received",
        f"<p>Hi {name}, we've received your order <b>#{order.get('id','')[:8].upper()}</b>. "
        "We'll text you as soon as it's confirmed and on the way.</p>"
        f'<table style="width:100%;font-size:14px;border-top:1px solid rgba(0,0,0,0.1);margin-top:10px">{items_rows}</table>'
        f'<p style="margin-top:12px"><b>Subtotal:</b> £{order.get("subtotal",0):.2f}<br>'
        f'<b>Delivery:</b> £{order.get("delivery_fee",0):.2f}<br>'
        f'<b>Total:</b> £{order.get("total",0):.2f}</p>'
        f'<p style="color:#5C4B47;font-size:13px"><b>Deliver to:</b> {addr_line}</p>',
        "Track My Order", f"{SITE_URL}/dashboard",
    )
    return f"Order confirmed · #{order.get('id','')[:8].upper()}", html


def email_order_status(order: dict, name: str, status: str) -> tuple[str, str]:
    pretty = {
        "confirmed": "Your order is confirmed",
        "preparing": "We're preparing your order",
        "out_for_delivery": "Your order is on the way",
        "delivered": "Your order was delivered",
        "cancelled": "Your order was cancelled",
    }.get(status, "Order update")
    extra = {
        "out_for_delivery": "<p>Our delivery partner is heading to you now. Please keep your phone handy.</p>",
        "delivered": "<p>We hope you enjoyed it! Please take a moment to leave a rating — your feedback shapes our menu.</p>",
        "cancelled": "<p>If this was unexpected, please reply to this email and we'll look into it.</p>",
    }.get(status, "")
    html = _wrap(
        pretty,
        f"<p>Hi {name},</p><p>Order <b>#{order.get('id','')[:8].upper()}</b> is now <b>{status.replace('_',' ')}</b>.</p>{extra}",
        "Open Dashboard", f"{SITE_URL}/dashboard",
    )
    return f"{pretty} · #{order.get('id','')[:8].upper()}", html


def email_subscription_confirmation(sub: dict, name: str) -> tuple[str, str]:
    html = _wrap(
        "Dabba Wala subscription confirmed",
        f"<p>Welcome to the weekly meal family, {name}!</p>"
        f"<p><b>Plan:</b> {sub.get('plan','').title()}<br>"
        f"<b>Box:</b> {sub.get('box_type','prasada').title()}<br>"
        f"<b>Starts:</b> {sub.get('start_date','—')}<br>"
        f"<b>Ends:</b> {sub.get('end_date','—')}<br>"
        f"<b>Price:</b> £{sub.get('price',0):.2f}</p>"
        "<p>You can pause or skip any day from your dashboard up to 12 hours before delivery.</p>",
        "Manage My Subscription", f"{SITE_URL}/dashboard",
    )
    return "Your Dabba Wala subscription is live", html


def email_enquiry_receipt(kind: str, name: str) -> tuple[str, str]:
    label = "catering enquiry" if kind == "catering" else "message"
    html = _wrap(
        "We've got your message",
        f"<p>Hi {name}, thanks for your {label}. Our team usually replies within a few hours during business hours.</p>"
        "<p>You'll see any reply in your dashboard under <b>Enquiries</b> — we'll email you too.</p>",
        "Open Dashboard", f"{SITE_URL}/dashboard",
    )
    return "We've received your enquiry", html


def email_enquiry_reply(name: str, admin_text: str) -> tuple[str, str]:
    safe = (admin_text or "").replace("<", "&lt;").replace(">", "&gt;")
    html = _wrap(
        "New reply to your enquiry",
        f"<p>Hi {name}, our team just replied:</p>"
        f'<blockquote style="margin:12px 0;padding:12px 14px;background:#FAF8F4;border-left:3px solid #800020">{safe}</blockquote>'
        "<p>You can reply from your dashboard.</p>",
        "View Conversation", f"{SITE_URL}/dashboard",
    )
    return "New reply from Sree Svadista Prasada", html


def email_delivery_skipped(name: str, date: str, short_notice: bool) -> tuple[str, str]:
    extra = (
        "<p style=\"color:#800020\"><b>Heads-up:</b> this is within 12 hours of delivery — "
        "we'll do our best but the box may already be prepped.</p>"
        if short_notice else ""
    )
    html = _wrap(
        "Delivery skipped",
        f"<p>Hi {name}, we've noted that you're skipping your Dabba Wala delivery on <b>{date}</b>.</p>"
        f"{extra}<p>Your plan continues as normal after that day.</p>",
        "Manage My Subscription", f"{SITE_URL}/dashboard",
    )
    return f"Delivery skipped · {date}", html


def email_subscription_cancelled(name: str, sub: dict) -> tuple[str, str]:
    html = _wrap(
        "Your Dabba Wala subscription is cancelled",
        f"<p>Hi {name}, your <b>{sub.get('plan','').title()}</b> plan has been cancelled. "
        "You won't be charged again and no further boxes will be delivered.</p>"
        "<p>We'd love to know what we could do better — just reply to this email.</p>",
        "Start a New Plan", f"{SITE_URL}/dabbawala",
    )
    return "Subscription cancelled", html


def email_subscription_expired(name: str, sub: dict) -> tuple[str, str]:
    html = _wrap(
        "Your Dabba Wala has ended — renew in one tap",
        f"<p>Hi {name}, your <b>{sub.get('plan','').title()}</b> Dabba Wala plan wrapped up on "
        f"<b>{sub.get('end_date','—')}</b>. We hope the week tasted like home.</p>"
        "<p>Renew now and we'll keep the same box type, address, and preferences.</p>",
        "Renew My Plan", f"{SITE_URL}/dabbawala",
    )
    return "Your Dabba Wala ended — renew?", html


def email_renewal_reminder(name: str, sub: dict) -> tuple[str, str]:
    html = _wrap(
        "Your Dabba Wala ends soon",
        f"<p>Hi {name}, a quick reminder that your <b>{sub.get('plan','').title()}</b> plan "
        f"ends on <b>{sub.get('end_date','—')}</b>. Renew now to avoid a break in your weekly meals.</p>",
        "Renew My Plan", f"{SITE_URL}/dabbawala",
    )
    return "Renew your Dabba Wala", html


def email_delivery_issue(name: str, date: str, description: str) -> tuple[str, str]:
    safe = (description or "").replace("<", "&lt;").replace(">", "&gt;") or "We hit a snag with today's delivery."
    html = _wrap(
        "About today's delivery",
        f"<p>Hi {name}, we wanted to flag an issue with your delivery on <b>{date}</b>:</p>"
        f'<blockquote style="margin:12px 0;padding:12px 14px;background:#FAF8F4;border-left:3px solid #800020">{safe}</blockquote>'
        "<p>Our team is on it — reply to this email if you need anything straight away.</p>",
        "Open Dashboard", f"{SITE_URL}/dashboard",
    )
    return f"Delivery update · {date}", html


def email_review_prompt(name: str, when_label: str) -> tuple[str, str]:
    html = _wrap(
        "How was it?",
        f"<p>Hi {name}, we hope you enjoyed {when_label}. Could you take 10 seconds to rate it? "
        "Your feedback directly shapes next week's menu.</p>",
        "Leave a Rating", f"{SITE_URL}/dashboard",
    )
    return "How was your meal?", html
