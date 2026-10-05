"""Claude as the investigator of last resort — and the log of every AI call and what it cost.

Claude is called only when a figure has moved sharply for the worse and no written rule
explains or handles it. It is given summary figures only: no names, emails, phone numbers,
addresses or order contents. It can read; it cannot change anything. Its finding goes into
the System log as a recommendation for a person.

Limits: at most one investigation a day, MONTHLY_CALL_CAP calls and MONTHLY_COST_CAP_USD a
month across every AI use in the application. When a cap is reached the call is skipped and
that fact is logged — monitoring itself carries on, because it does not depend on AI.
"""
import json
import logging
import os
from datetime import datetime
from typing import Optional

import anthropic

from database import db

logger = logging.getLogger(__name__)

MODEL = "claude-opus-5-5"
PRICE_PER_MTOK = {"input": 4.00, "output": 20.00}      # USD, list price for MODEL
MONTHLY_CALL_CAP = 40
MONTHLY_COST_CAP_USD = 5.00

FINDING_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {"type": "string", "description": "Two sentences, plain English, for a kitchen owner."},
        "likely_causes": {"type": "array", "items": {"type": "string"}},
        "what_to_check": {"type": "array", "items": {"type": "string"}},
        "recommendation": {"type": "string"},
        "confidence": {"type": "string", "enum": ["low", "medium", "high"]},
    },
    "required": ["summary", "likely_causes", "what_to_check", "recommendation", "confidence"],
    "additionalProperties": False,
}

SYSTEM = (
    "You help the owner of a small home kitchen in Milton Keynes that sells South Indian food for collection "
    "through its own website. Each night the site compares yesterday's figures with a normal day. You are shown "
    "only summary figures. A figure has moved sharply and no rule explains it. Say what most likely happened and "
    "what the owner should look at first. Be concrete and brief. Do not invent facts that are not in the figures; "
    "if the data cannot tell causes apart, say so and set confidence to low. Never suggest changing prices or terms "
    "as a first step. Write for someone who is not technical."
)


def estimate_cost(input_tokens: int, output_tokens: int, model: str = MODEL) -> float:
    price = PRICE_PER_MTOK if model == MODEL else {"input": 1.00, "output": 5.00}     # the dish auto-fill uses Haiku
    return round(input_tokens / 1e6 * price["input"] + output_tokens / 1e6 * price["output"], 5)


async def record_usage(purpose: str, model: str, input_tokens: int, output_tokens: int, outcome: str) -> None:
    """Every AI call in the application is written here, whoever made it."""
    try:
        await db.ai_usage.insert_one({
            "at": datetime.utcnow(), "purpose": purpose, "model": model, "input_tokens": int(input_tokens or 0),
            "output_tokens": int(output_tokens or 0), "cost_usd": estimate_cost(input_tokens or 0, output_tokens or 0, model),
            "outcome": outcome,
        })
    except Exception as e:
        logger.error("ai_usage insert failed: %s", e)


async def month_to_date(now: Optional[datetime] = None) -> dict:
    now = now or datetime.utcnow()
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    rows = await db.ai_usage.find({"at": {"$gte": start}}, {"_id": 0}).to_list(None)
    return {"calls": len(rows), "cost_usd": round(sum(r.get("cost_usd") or 0 for r in rows), 4),
            "call_cap": MONTHLY_CALL_CAP, "cost_cap_usd": MONTHLY_COST_CAP_USD}


async def allowed() -> tuple:
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return False, "AI is not set up on the server (no API key)"
    used = await month_to_date()
    if used["calls"] >= MONTHLY_CALL_CAP:
        return False, f"this month's limit of {MONTHLY_CALL_CAP} AI calls has been reached"
    if used["cost_usd"] >= MONTHLY_COST_CAP_USD:
        return False, f"this month's AI spending limit of ${MONTHLY_COST_CAP_USD:.2f} has been reached"
    return True, ""


async def investigate(figures: dict) -> dict:
    """Ask Claude what a sharp change most likely means. Returns {"ok": bool, "finding" | "why"}."""
    ok, why = await allowed()
    if not ok:
        return {"ok": False, "why": why}
    client = anthropic.AsyncAnthropic(timeout=60.0, max_retries=1)
    try:
        response = await client.beta.messages.create(
            model=MODEL,
            max_tokens=1500,
            system=SYSTEM,
            output_config={"effort": "low", "format": {"type": "json_schema", "schema": FINDING_SCHEMA}},
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            messages=[{"role": "user", "content": "Yesterday against a normal day, and the last two weeks:\n" + json.dumps(figures, default=str)}],
        )
    except anthropic.RateLimitError:
        await record_usage("investigation", MODEL, 0, 0, "rate limited")
        return {"ok": False, "why": "the AI service was busy"}
    except anthropic.APIStatusError as e:
        await record_usage("investigation", MODEL, 0, 0, f"error {e.status_code}")
        return {"ok": False, "why": f"the AI service returned an error ({e.status_code}); check the account's credit"}
    except anthropic.APIConnectionError:
        await record_usage("investigation", MODEL, 0, 0, "could not connect")
        return {"ok": False, "why": "the AI service could not be reached"}

    usage = response.usage
    if response.stop_reason == "refusal":
        await record_usage("investigation", response.model, usage.input_tokens, usage.output_tokens, "declined")
        return {"ok": False, "why": "the AI declined to answer"}
    text = next((b.text for b in response.content if b.type == "text"), "")
    try:
        finding = json.loads(text)
    except json.JSONDecodeError:
        await record_usage("investigation", response.model, usage.input_tokens, usage.output_tokens, "unreadable answer")
        return {"ok": False, "why": "the AI's answer could not be read"}
    await record_usage("investigation", response.model, usage.input_tokens, usage.output_tokens, "answered")
    return {"ok": True, "finding": finding, "cost_usd": estimate_cost(usage.input_tokens, usage.output_tokens)}
