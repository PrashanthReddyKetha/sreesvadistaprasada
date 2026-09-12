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


def is_sold_out_today(item: dict) -> bool:
    s = item.get("sold_out_until")
    return bool(s) and s >= london_today()


def restock_email(item: dict, name: str) -> tuple[str, str]:
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
        <h1 style="color:#fff;font-size:24px;margin:8px 0 0">It&rsquo;s back, {first}. 🪷</h1>
      </div>
      <div style="padding:24px 26px;color:#2D2422;font-size:15px;line-height:1.6">
        <p style="margin:0 0 6px">You asked us to tell you the moment
          <b style="color:#800020">{item_name}</b> returned to the kitchen &mdash; it&rsquo;s
          simmering right now.</p>
        {img_html}
        <p style="margin:0 0 18px;color:#5C4B47">Dishes like this have a way of selling out
          again. Don&rsquo;t let it slip past you twice.</p>
        <a href="{SITE_URL}/order"
           style="display:block;text-align:center;background:#800020;color:#fff;
                  text-decoration:none;padding:14px;border-radius:12px;font-weight:bold">
          Order it now &rarr;</a>
        <p style="margin:16px 0 0;font-size:12px;color:#8B6914;font-style:italic">
          Taste for your heart &middot; memories on a plate</p>
      </div>
    </div>"""
    return f"{item_name} is back — don't miss it twice 🪷", html


def restock_sms(item: dict) -> str:
    return (
        f"Sree Svadista Prasada: {item.get('name','Your dish')} is BACK on the menu! "
        f"It sold out once — don't let it happen to you twice. Order: {SITE_URL}/order"
    )


async def notify_restock(item: dict):
    """Email + SMS every subscriber for this item, then clear the subs."""
    subs = await db.restock_subs.find({"item_id": item["id"]}, {"_id": 0}).to_list(length=500)
    if not subs:
        return
    for sub in subs:
        subj, html = restock_email(item, sub.get("name", ""))
        if sub.get("email"):
            send_email(sub["email"], subj, html)
        if sub.get("phone"):
            send_sms(sub["phone"], restock_sms(item))
    await db.restock_subs.delete_many({"item_id": item["id"]})


async def sweep_expired_sold_outs():
    """Items whose sold-out day has passed are live again — fire pending alerts.

    Called opportunistically from GET /menu, so no cron is needed.
    """
    today = london_today()
    expired = await db.menu_items.find(
        {"sold_out_until": {"$ne": None, "$lt": today}}, {"_id": 0}
    ).to_list(length=200)
    for item in expired:
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
