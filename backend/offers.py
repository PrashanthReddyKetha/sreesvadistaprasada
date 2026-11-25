"""The biryani multi-buy: any two biryanis for one price (owner, 25 Nov 2026).

The owner's rules:
  - every biryani except the vegetarian one is in it (menu category nonVeg, subcategory Biryani), so a new
    non-veg biryani joins by itself; any two may be mixed, and an odd one out is the menu price;
  - the 10% collection discount still applies on top;
  - a coupon discounts the rest of the basket only, never the dishes bought in the offer;
  - a free loyalty dish can sit in the same order (it never counts towards a pair).

The owner switches it on and off and sets when it starts and ends in Admin › Coupons (settings._id
"multibuy_offer"). It is off until switched on. Pricing calls offer_for() from routes/orders.py.
"""
from typing import Optional

from database import db
from restock import london_now

SETTINGS_ID = "multibuy_offer"
QTY = 2
DEFAULTS = {"enabled": False, "starts_at": None, "ends_at": None, "price": 19.99}


def applies_to(item: dict) -> bool:
    """Is this dish in the offer? Decided from the menu, never from the client."""
    return item.get("category") == "nonVeg" and (item.get("subcategory") or "").strip().lower() == "biryani"


async def get_offer() -> dict:
    doc = await db.settings.find_one({"_id": SETTINGS_ID}) or {}
    return {**DEFAULTS, **{k: doc[k] for k in DEFAULTS if doc.get(k) is not None}}


def status_of(offer: dict, now: Optional[str] = None) -> str:
    """off | scheduled | live | ended. Times are London "YYYY-MM-DDTHH:MM", so they compare as text."""
    now = now or london_now()
    if not offer.get("enabled"):
        return "off"
    if offer.get("starts_at") and offer["starts_at"] > now:
        return "scheduled"
    if offer.get("ends_at") and offer["ends_at"] <= now:
        return "ended"
    return "live"


def label(offer: dict) -> str:
    return f"{QTY} for £{float(offer['price']):.2f}"


def public_view(offer: dict) -> dict:
    """What the site needs to show the offer (served with /kitchen-status)."""
    return {"live": status_of(offer) == "live", "label": label(offer), "qty": QTY,
            "price": float(offer["price"]), "ends_at": offer.get("ends_at")}


def price_sets(unit_prices: list, offer_price: float) -> tuple[float, float]:
    """(discount, paid_in_offer) for the offer dishes in a basket, one price per dish.

    The dearest are paired first, so the odd one out is the cheapest. A pair that already costs no more than the
    offer price is left alone — the offer never puts a price up. paid_in_offer is what the paired dishes cost
    after the offer; a coupon is worked out on the basket without it."""
    pence = sorted((round(float(p) * 100) for p in unit_prices), reverse=True)
    set_pence = round(float(offer_price) * 100)
    discount = paid = 0
    for k in range(0, len(pence) - QTY + 1, QTY):
        full = sum(pence[k:k + QTY])
        if full > set_pence:
            discount += full - set_pence
            paid += set_pence
    return discount / 100, paid / 100


async def offer_for(unit_prices: list) -> Optional[dict]:
    """The offer as it applies to this basket right now: {discount, paid, label}, or None when it is not running
    or the basket has no pair."""
    if len(unit_prices) < QTY:
        return None
    offer = await get_offer()
    if status_of(offer) != "live":
        return None
    discount, paid = price_sets(unit_prices, offer["price"])
    if discount <= 0:
        return None
    return {"discount": discount, "paid": paid, "label": label(offer)}
