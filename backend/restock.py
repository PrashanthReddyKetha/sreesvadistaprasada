"""Restock alerts — "notify me when it's back" for sold-out dishes.

db.restock_subs: { id, item_id, item_name, user_id, name, email, phone, created_at }
Signed-in users subscribe via POST /menu/{id}/notify-restock; when the item
becomes purchasable again (admin re-lives it, or its sold-out day passes),
everyone subscribed gets a crafted email + SMS and the subscription clears.
"""
import uuid
from datetime import datetime, date
from zoneinfo import ZoneInfo

from database import db
from notifications import send_email, send_sms, SITE_URL

LONDON = ZoneInfo("Europe/London")


def london_today() -> str:
    return datetime.now(LONDON).date().isoformat()


def london_now() -> str:
    return datetime.now(LONDON).strftime("%Y-%m-%dT%H:%M")


def is_sold_out_today(item: dict) -> bool:
    """Off sale for now: "coming soon" (not on sale yet), or sold_out_until — a London date (sold out all that day)
    or "YYYY-MM-DDTHH:MM" (on sale again from that minute). The website shows the notify-me bell for all three."""
    if item.get("coming_soon"):
        return True
    s = item.get("sold_out_until")
    if not s:
        return False
    return s > london_now() if "T" in s else s >= london_today()


def restock_email(item: dict, name: str, arrived: bool = False) -> tuple[str, str]:
    """arrived: the dish was "coming soon" and is on sale for the first time, so the words say so."""
    first = (name or "Friend").split(" ")[0]
    item_name = item.get("name", "Your dish")
    img = item.get("image") or ""
    img_html = (
        f'<img src="{img}" alt="{item_name}" width="100%" '
        f'style="border-radius:14px;max-height:260px;object-fit:cover;margin:14px 0" />'
        if img else ""
    )
    html = f"""
    <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;background:#FDFBF7;
                border:1px solid #EAE2D5;border-radius:18px;overflow:hidden">
      <div style="background:#800020;padding:22px 26px">
        <p style="color:#F4C430;font-size:11px;letter-spacing:3px;margin:0">SREE SVADISTA PRASADA</p>
        <h1 style="color:#fff;font-size:24px;margin:8px 0 0">{"It&rsquo;s here" if arrived else "It&rsquo;s back"}, {first}. 🪷</h1>
      </div>
      <div style="padding:24px 26px;color:#2D2422;font-size:15px;line-height:1.6">
        <p style="margin:0 0 6px">You asked us to tell you the moment
          <b style="color:#800020">{item_name}</b> {"went on sale" if arrived else "returned to the kitchen"} &mdash; it&rsquo;s
          simmering right now.</p>
        {img_html}
        <p style="margin:0 0 18px;color:#5C4B47">{"Be among the first to try it." if arrived else "Dishes like this have a way of selling out again. Don&rsquo;t let it slip past you twice."}</p>
        <a href="{SITE_URL}/order"
           style="display:block;text-align:center;background:#800020;color:#fff;
                  text-decoration:none;padding:14px;border-radius:12px;font-weight:bold">
          Order it now &rarr;</a>
        <p style="margin:16px 0 0;font-size:12px;color:#8B6914;font-style:italic">
          Taste for your heart &middot; memories on a plate</p>
      </div>
    </div>"""
    return (f"{item_name} is here — you asked us to tell you first 🪷" if arrived else f"{item_name} is back — don't miss it twice 🪷"), html


def restock_sms(item: dict, arrived: bool = False) -> str:
    if arrived:
        return f"Sree Svadista Prasada: {item.get('name','Your dish')} is now on the menu — you asked us to tell you first. Order: {SITE_URL}/order"
    return (
        f"Sree Svadista Prasada: {item.get('name','Your dish')} is BACK on the menu! "
        f"It sold out once — don't let it happen to you twice. Order: {SITE_URL}/order"
    )


async def notify_restock(item: dict, arrived: bool = False):
    """Email + SMS every subscriber for this item, then clear the subs. Held (requests kept) while all messages are paused.
    arrived: the dish was "coming soon" and is on sale for the first time."""
    from automations import all_paused
    if await all_paused():
        return
    for _ in range(500):
        # Taking each request out of the list as it is claimed means a second sweep
        # running at the same moment cannot send the same alert again.
        sub = await db.restock_subs.find_one_and_delete({"item_id": item["id"]})
        if not sub:
            break
        subj, html = restock_email(item, sub.get("name", ""), arrived)
        if sub.get("email"):
            send_email(sub["email"], subj, html, kind="marketing")
        if sub.get("phone"):
            send_sms(sub["phone"], restock_sms(item, arrived), kind="marketing")


async def sweep_expired_sold_outs():
    """Items whose sold-out day has passed are live again — fire pending alerts.

    Called opportunistically from GET /menu, so no cron is needed.
    """
    candidates = await db.menu_items.find(
        {"sold_out_until": {"$ne": None, "$lte": london_now()}}, {"_id": 0}
    ).to_list(length=200)
    for item in candidates:
        if is_sold_out_today(item):     # today's date sorts before "now" but still holds until midnight
            continue
        await db.menu_items.update_one({"id": item["id"]}, {"$set": {"sold_out_until": None}})
        if item.get("available", True):
            await notify_restock(item)


async def add_restock_sub(item: dict, user: dict):
    await db.restock_subs.update_one(
        {"item_id": item["id"], "user_id": user["id"]},
        {"$set": {
            "id": str(uuid.uuid4()),
            "item_id": item["id"],
            "item_name": item.get("name", ""),
            "user_id": user["id"],
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "phone": user.get("phone", ""),
            "created_at": datetime.utcnow().isoformat(),
        }},
        upsert=True,
    )
