"""Each visit told in plain English: who came, what they did and saw, and the most likely reason they left without
ordering — plus a summary of a whole period. Written by rules from the visit record, on our own server: free, instant,
and nothing leaves the site (owner, 10 Nov 2026).

The reasons are the likeliest reading of what the record shows, not certainties, and say so ("likely", "may").
"""
from collections import Counter
from typing import Optional

MINIMUM_ORDER = 15.0

PAGES = {
    "/": "the home page", "/order": "the order page", "/menu": "the full menu", "/breakfast": "Breakfast",
    "/prasada": "Prasada (veg)", "/svadista": "Svadista (non-veg)", "/street-food": "Street food", "/drinks": "Drinks",
    "/ragi-specials": "Ragi specials", "/snacks": "Lucky's Pantry", "/subscriptions": "Dabba Wala", "/checkout": "checkout",
    "/story": "Our story", "/gallery": "the gallery", "/faq": "the FAQ", "/contact": "Contact", "/catering": "Catering",
    "/blog": "the blog", "/dashboard": "their account", "/delivery": "Delivery", "/milton-keynes": "the Milton Keynes page",
    "/edinburgh": "the Edinburgh page", "/glasgow": "the Glasgow page", "/privacy-policy": "the privacy policy", "/terms": "the terms",
}
MENU_SECTIONS = ("/breakfast", "/prasada", "/svadista", "/street-food", "/drinks", "/ragi-specials", "/snacks")
READING = ("/blog", "/story", "/faq", "/gallery", "/privacy-policy", "/terms")

# Outcome labels, also the summary's buckets
ORDERED, PLAN, PROBLEM, CLOSED, PAYING, CHECKOUT, BASKET, DABBA, DISHES, MENU, SEARCH, READ, ENQUIRY, BOUNCE, OTHER = (
    "Ordered", "Bought a Dabba Wala plan", "Hit a problem", "Kitchen was closed", "Left while paying", "Left at checkout",
    "Left with food in the basket", "Looked at Dabba Wala", "Opened dishes, added none", "Browsed the menu", "Searched, added nothing",
    "Came to read", "Got in touch", "Left straight away", "Looked around")
BOT = "Probably a bot"

# Events a page sends on its own, without anyone tapping, scrolling or typing
SENT_BY_ITSELF = {"page_view", "page_leave", "site_error", "kitchen_closed_seen", "subscription_step_view", "begin_subscription",
                  "menu_category_view", "slots_viewed", "story_video_play"}
BOT_SECONDS = 3


def probably_bot(evs: list) -> bool:
    """No tap, scroll, search or anything else a person does, not signed in, and under 3 seconds on screen in all. Known
    crawlers are refused when they arrive; this catches programs dressed as an ordinary browser, which load a page and
    are gone. Someone who glanced and left at once looks the same, so it is "probably" (owner, 10 Nov 2026)."""
    if any(e["name"] not in SENT_BY_ITSELF or e.get("signed_in") for e in evs):
        return False
    shown: dict = {}
    for e in evs:
        if e["name"] == "page_leave":
            p = e.get("props") or {}
            k = p.get("view") or e.get("path")
            shown[k] = max(shown.get(k, 0), float(p.get("seconds") or 0))
    return sum(shown.values()) < BOT_SECONDS


def bot_story() -> dict:
    return {"who": "Probably a program, not a person", "did": "Loaded the site without a single tap or scroll and was gone within seconds.",
            "outcome": BOT, "why": "No taps, no scrolling and under 3 seconds on screen — most likely a bot dressed as a browser, or "
            "someone who left at once. Left out of every figure.", "minutes": 0, "basket": 0, "order_value": 0}


def page_name(path: str) -> str:
    path = (path or "/").split("?")[0].rstrip("/") or "/"
    if path in PAGES:
        return PAGES[path]
    if path.startswith("/blog/"):
        return "a blog post"
    parts = path.strip("/").split("/")
    if len(parts) >= 3:
        return "a dish page"
    if len(parts) == 2 and parts[1] == "about":
        return f"the {PAGES.get('/' + parts[0], parts[0])} about page"
    if len(parts) == 2:
        return f"a {PAGES.get('/' + parts[0], parts[0])} section"
    return path


def _money(v) -> str:
    try:
        return f"£{float(v):.2f}"
    except (TypeError, ValueError):
        return ""


def _list(names: list, limit: int = 3) -> str:
    names = list(dict.fromkeys(n for n in names if n))
    if not names:
        return ""
    shown = names[:limit]
    more = len(names) - len(shown)
    if more:
        return ", ".join(shown) + f" and {more} more"
    return shown[0] if len(shown) == 1 else ", ".join(shown[:-1]) + " and " + shown[-1]


def _items(e: dict) -> list:
    return [i.get("name") for i in e.get("items") or [] if i.get("name")]


def story(evs: list, returning: Optional[bool], source: str, device: str, minimum_order: float = MINIMUM_ORDER) -> dict:
    """evs: one visit's events in the order they happened (each with "name", "path", "props", "items", "when")."""
    names = [e["name"] for e in evs]
    has = set(names)
    props = lambda e: e.get("props") or {}                                    # noqa: E731
    pages = [e["path"] for e in evs if e["name"] == "page_view"]
    route = [p for i, p in enumerate(pages) if i == 0 or pages[i - 1] != p]
    seconds = max((evs[-1]["when"] - evs[0]["when"]).total_seconds(), 0) if evs else 0
    for e in evs:
        if e["name"] == "page_leave" and props(e).get("seconds"):
            seconds = max(seconds, float(props(e)["seconds"]))
    landing = route[0] if route else (evs[0]["path"] if evs else "/")

    who = ("Returning visitor" if returning else "New visitor" if returning is False else "Visitor")
    who += f" on a {'phone' if device == 'phone' else 'computer' if device == 'desktop' else 'device'}"
    who += f", from {source}" if source and source != "Direct or unknown" else ", came direct (typed the address, a bookmark or an app)"

    did = [f"Landed on {page_name(landing)}"]
    if len(route) > 1:
        did.append(f"went through {len(route)} pages ({_list([page_name(p) for p in route[1:]], 4)})")
    sections = [page_name(p) for p in route if p.startswith(MENU_SECTIONS)]
    opened = [n for e in evs if e["name"] == "view_item" for n in _items(e)]
    if opened:
        did.append(f"opened {_list(opened)}")
    elif sections:
        did.append(f"browsed {_list(sections)}")
    terms = [str(props(e).get("term")) for e in evs if e["name"] == "search" and props(e).get("term")]
    if terms:
        did.append("searched for " + _list([f'"{t}"' for t in terms]))
    added = [n for e in evs if e["name"] == "add_to_cart" for n in _items(e)]
    added_value = sum(float(props(e).get("value") or 0) for e in evs if e["name"] == "add_to_cart")
    removed_value = sum(float(props(e).get("value") or 0) for e in evs if e["name"] == "remove_from_cart")
    basket = max(added_value - removed_value, 0)
    began = [float(props(e)["value"]) for e in evs if e["name"] == "begin_checkout" and isinstance(props(e).get("value"), (int, float))]
    if began:
        basket = began[-1]
    if added:
        did.append(f"added {_list(added)}" + (f" ({_money(added_value)})" if added_value else ""))
    taken_out = [n for e in evs if e["name"] == "remove_from_cart" for n in _items(e)]
    if taken_out:
        did.append(f"took {_list(taken_out)} back out")
    if "begin_checkout" in has:
        did.append("started checkout" + (f" with {_money(basket)}" if basket else ""))
    if "coupon_failed" in has:
        did.append("tried a coupon that was refused")
    if "payment_started" in has:
        did.append("started paying")
    if "subscription_step_view" in has or "/subscriptions" in pages:
        plan = next((props(e).get("plan") for e in evs if e["name"] == "select_subscription_plan"), None)
        did.append("looked at Dabba Wala" + (f" and picked the {plan} plan" if plan else ""))
    if "dabba_notify_signup" in has:
        did.append("asked to hear when Dabba Wala opens")
    if "sign_up" in has:
        did.append("created an account")
    elif "login" in has:
        did.append("signed in")
    if "enquiry_submit" in has:
        did.append("sent an enquiry")
    if "whatsapp_click" in has:
        did.append("tapped WhatsApp")
    if "newsletter_signup" in has:
        did.append("joined the newsletter")
    scroll = [props(e).get("percent") for e in evs if e["name"] == "page_leave" and props(e).get("percent") is not None]
    if len(route) == 1 and scroll:
        did.append(f"read about {round(max(scroll))}% of it")

    # The most likely reason the visit ended the way it did — first match wins
    problems = [e for e in evs if e["name"] == "site_error" or e["name"].endswith("_failed")]
    order_value = sum(float(props(e).get("value") or 0) for e in evs if e["name"] == "purchase")
    focused = [e for e in evs if e["name"] == "field_focus" and not str(props(e).get("label") or "").lower().startswith("search")]
    if "purchase" in has:
        outcome, why = ORDERED, f"Ordered {_money(order_value)}" + (f" after {round(seconds / 60)} minutes" if seconds >= 90 else "") + "."
    elif "subscription_purchase" in has:
        outcome, why = PLAN, "Bought a Dabba Wala plan."
    elif problems and ("begin_checkout" in has or "payment_started" in has or "add_to_cart" in has):
        p = problems[-1]
        detail = props(p).get("reason") or props(p).get("message") or ""
        outcome, why = PROBLEM, (f"Something went wrong ({p['name'].replace('_', ' ')}{': ' + str(detail) if detail else ''}) "
                                 "while they were trying to order — the likeliest reason there was no order.")
    elif "kitchen_closed_seen" in has and "purchase" not in has:
        outcome, why = CLOSED, "The kitchen was closed while they were here, so they couldn't order."
    elif "payment_started" in has:
        outcome, why = PAYING, ("Got as far as paying and stopped — card trouble, a second look at the total, or being "
                                "interrupted are the usual reasons.")
    elif "begin_checkout" in has:
        if "coupon_failed" in has:
            why = "A coupon was refused at checkout and they left — the discount was likely part of the reason to order."
        elif focused:
            field = props(focused[-1]).get("label") or "a field"
            why = (f"Stopped at checkout on \"{field}\" — they may not have wanted to give it, or a collection time, the "
                   "total or the form put them off.")
        else:
            why = ("Opened checkout and left before filling it in — the total, the collection times or being collection-only "
                   "may not have suited them.")
        outcome = CHECKOUT
    elif basket > 0 or (added and "remove_from_cart" not in has):
        if basket and basket < minimum_order:
            why = (f"Left with {_money(basket)} in the basket, under the {_money(minimum_order)} minimum — they likely "
                   "couldn't go on without adding more.")
        else:
            why = (f"Left with {_money(basket) or 'food'} in the basket without opening checkout — often comparing, deciding "
                   "later, or put off by the price." + (" As a returning visitor they may well come back." if returning else ""))
        outcome = BASKET
    elif added and taken_out:
        outcome, why = BASKET, "Added food and took it all back out — likely changed their mind on price or choice."
    elif "/subscriptions" in pages or "subscription_step_view" in has:
        outcome = DABBA
        why = ("Asked to be told when Dabba Wala opens — a warm lead for launch." if "dabba_notify_signup" in has
               else "Came for Dabba Wala, which is not open yet, so there was nothing to buy.")
    elif "enquiry_submit" in has or "whatsapp_click" in has:
        outcome, why = ENQUIRY, "Got in touch instead of ordering online — worth checking the reply went out."
    elif opened:
        outcome, why = DISHES, (f"Opened {len(set(opened))} dish{'es' if len(set(opened)) > 1 else ''} and added none — the "
                                "price, portion or photo may not have convinced them, or they were only looking.")
    elif terms:
        outcome, why = SEARCH, f"Searched for {_list([chr(34) + t + chr(34) for t in terms])} and added nothing — they may not have found what they wanted."
    elif len(route) <= 1 and seconds < 20:
        outcome, why = BOUNCE, (f"Left {page_name(landing)} within seconds — the page may not have matched what they were "
                                "looking for, or it was slow to appear.")
    elif sections or any(p.startswith(("/order", "/menu")) for p in pages):
        outcome, why = MENU, "Browsed the menu without opening a dish — likely just looking, or nothing caught their eye."
    elif pages and all(p.startswith(READING) for p in pages):
        outcome, why = READ, f"Came to read {page_name(landing)}, not to order."
    else:
        outcome, why = OTHER, "Looked around and left without going near the menu."

    minutes = round(seconds / 60, 1)
    return {
        "who": who,
        "did": (did[0] + (", " + ", ".join(did[1:]) if len(did) > 1 else "") + ".") if did else "",
        "outcome": outcome,
        "why": why,
        "minutes": minutes,
        "basket": round(basket, 2),
        "order_value": round(order_value, 2),
    }


def summary(stories: list, start: str, end: str) -> dict:
    """The period in a few sentences, built from every visit's story."""
    n = len(stories)
    if not n:
        return {"text": "No visits were recorded in this period.", "outcomes": []}
    kinds = Counter(s["kind"] for s in stories)
    outcomes = Counter(s["outcome"] for s in stories)
    ordered = outcomes[ORDERED]
    income = sum(s["order_value"] for s in stories)
    lost = [s for s in stories if s["outcome"] in (BASKET, CHECKOUT, PAYING, PROBLEM, CLOSED)]
    lost_value = sum(s["basket"] for s in lost)
    pct = lambda a: f"{round(a / n * 100)}%"                                   # noqa: E731
    parts = [f"{n} visit{'s' if n != 1 else ''} between {start} and {end}" if start != end else f"{n} visit{'s' if n != 1 else ''} on {start}"]
    known = kinds["New"] + kinds["Returning"]
    if known:
        parts[0] += f": {kinds['New']} new and {kinds['Returning']} returning" + (
            f" (the other {n - known} didn't accept cookies, so it can't be told)" if n - known else "")
    parts[0] += "."
    parts.append(f"{ordered} ordered ({pct(ordered)} of visits)" + (f", worth {_money(income)} as seen in the visits." if income else "."))
    if lost:
        parts.append(f"{len(lost)} got as far as a basket or checkout and didn't order — about {_money(lost_value)} of food left behind.")
    reasons = [(o, c) for o, c in outcomes.most_common() if o != ORDERED]
    if reasons:
        top = ", ".join(f"{o.lower()} ({c})" for o, c in reasons[:3])
        parts.append(f"Most visits that didn't order: {top}.")
    return {"text": " ".join(parts), "outcomes": [{"outcome": o, "visits": c} for o, c in outcomes.most_common()],
            "new": kinds["New"], "returning": kinds["Returning"], "unknown": kinds["Unknown"],
            "ordered": ordered, "lost_visits": len(lost), "lost_value": round(lost_value, 2)}
