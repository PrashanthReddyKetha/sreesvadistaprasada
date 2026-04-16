from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from database import db
from models import (
    ContactMessage, ContactMessageCreate,
    CateringEnquiry, CateringEnquiryCreate,
    NewsletterSubscription, NewsletterCreate,
    EnquiryMessage, EnquiryMessageCreate,
    Notification,
)
from auth import require_admin, get_current_user, get_optional_user
from notifications import send_email, notify_admin, email_enquiry_receipt, email_enquiry_reply

router = APIRouter(prefix="/enquiries", tags=["enquiries"])


# ── Contact ───────────────────────────────────────────────────────────────────

@router.post("/contact", response_model=ContactMessage)
async def submit_contact(payload: ContactMessageCreate):
    msg = ContactMessage(**payload.model_dump())
    await db.contact_messages.insert_one(msg.model_dump())
    name = getattr(payload, "name", None) or "there"
    if getattr(payload, "email", None):
        subj, html = email_enquiry_receipt("contact", name)
        send_email(payload.email, subj, html)
    notify_admin(
        f"New contact enquiry · {name}",
        f"<p><b>From:</b> {name} ({getattr(payload,'email','—')} · {getattr(payload,'phone','—')})</p>"
        f"<p><b>Subject:</b> {getattr(payload,'subject','—')}</p>"
        f"<p>{getattr(payload,'message','')}</p>",
    )
    return msg


@router.get("/contact", response_model=List[ContactMessage])
async def get_contact_messages(_: dict = Depends(require_admin)):
    docs = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@router.put("/contact/{msg_id}/status")
async def update_contact_status(msg_id: str, status: str, _: dict = Depends(require_admin)):
    valid = {"new", "contacted", "resolved"}
    if status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid}")
    result = await db.contact_messages.update_one({"id": msg_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": "Status updated"}


# ── Catering ──────────────────────────────────────────────────────────────────

@router.post("/catering", response_model=CateringEnquiry)
async def submit_catering(payload: CateringEnquiryCreate):
    enquiry = CateringEnquiry(**payload.model_dump())
    await db.catering_enquiries.insert_one(enquiry.model_dump())
    name = getattr(payload, "name", None) or "there"
    if getattr(payload, "email", None):
        subj, html = email_enquiry_receipt("catering", name)
        send_email(payload.email, subj, html)
    notify_admin(
        f"Catering enquiry · {name}",
        f"<p><b>From:</b> {name} ({getattr(payload,'email','—')} · {getattr(payload,'phone','—')})</p>"
        f"<p><b>Event:</b> {getattr(payload,'event_type','—')} on {getattr(payload,'event_date','—')} · "
        f"{getattr(payload,'guest_count','—')} guests</p>"
        f"<p>{getattr(payload,'message','')}</p>",
    )
    return enquiry


@router.get("/catering", response_model=List[CateringEnquiry])
async def get_catering_enquiries(_: dict = Depends(require_admin)):
    docs = await db.catering_enquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@router.put("/catering/{enquiry_id}/status")
async def update_catering_status(enquiry_id: str, status: str, _: dict = Depends(require_admin)):
    valid = {"new", "contacted", "resolved"}
    if status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid}")
    result = await db.catering_enquiries.update_one({"id": enquiry_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    return {"message": "Status updated"}


# ── Newsletter ─────────────────────────────────────────────────────────────────

@router.post("/newsletter", response_model=NewsletterSubscription)
async def subscribe_newsletter(payload: NewsletterCreate):
    existing = await db.newsletter.find_one({"email": payload.email}, {"_id": 0})
    if existing:
        if existing.get("active"):
            raise HTTPException(status_code=400, detail="Already subscribed")
        await db.newsletter.update_one({"email": payload.email}, {"$set": {"active": True}})
        existing["active"] = True
        return existing

    sub = NewsletterSubscription(email=payload.email)
    await db.newsletter.insert_one(sub.model_dump())
    return sub


@router.get("/newsletter", response_model=List[NewsletterSubscription])
async def get_newsletter_subscribers(_: dict = Depends(require_admin)):
    docs = await db.newsletter.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@router.delete("/newsletter/{subscriber_id}")
async def delete_newsletter_subscriber(subscriber_id: str, _: dict = Depends(require_admin)):
    result = await db.newsletter.delete_one({"id": subscriber_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    return {"ok": True}


@router.patch("/newsletter/{subscriber_id}/toggle")
async def toggle_newsletter_subscriber(subscriber_id: str, _: dict = Depends(require_admin)):
    doc = await db.newsletter.find_one({"id": subscriber_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    new_active = not doc.get("active", True)
    await db.newsletter.update_one({"id": subscriber_id}, {"$set": {"active": new_active}})
    return {"active": new_active}


# ── My Enquiries (customer) ────────────────────────────────────────────────────

@router.get("/my")
async def get_my_enquiries(current_user: dict = Depends(get_current_user)):
    uid = current_user["sub"]
    user_doc = await db.users.find_one({"id": uid}, {"email": 1})
    email = user_doc["email"] if user_doc else None

    query = {"$or": [{"user_id": uid}, {"email": email}]} if email else {"user_id": uid}

    contact = await db.contact_messages.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    catering = await db.catering_enquiries.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)

    for enq in contact:
        enq["unread"] = await db.enquiry_messages.count_documents({
            "enquiry_id": enq["id"], "sender": "admin", "read_by_customer": False
        })
    for enq in catering:
        enq["unread"] = await db.enquiry_messages.count_documents({
            "enquiry_id": enq["id"], "sender": "admin", "read_by_customer": False
        })

    return {"contact": contact, "catering": catering}


# ── Notifications (customer) ───────────────────────────────────────────────────

@router.get("/notifications/unread-count")
async def get_notif_unread_count(current_user: dict = Depends(get_current_user)):
    count = await db.notifications.count_documents({"user_id": current_user["sub"], "read": False})
    return {"count": count}


@router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifs = await db.notifications.find(
        {"user_id": current_user["sub"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return notifs


@router.put("/notifications/read-all")
async def mark_all_notifs_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": current_user["sub"], "read": False}, {"$set": {"read": True}}
    )
    return {"ok": True}


@router.put("/notifications/{notif_id}/read")
async def mark_notif_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notif_id, "user_id": current_user["sub"]}, {"$set": {"read": True}}
    )
    return {"ok": True}


# ── Admin unread count ─────────────────────────────────────────────────────────

@router.get("/admin/unread-count")
async def admin_unread_count(_: dict = Depends(require_admin)):
    count = await db.enquiry_messages.count_documents({"sender": "customer", "read_by_admin": False})
    return {"count": count}


# ── Thread: get messages ───────────────────────────────────────────────────────

@router.get("/{enq_type}/{enq_id}/messages")
async def get_messages(
    enq_type: str,
    enq_id: str,
    current_user: Optional[dict] = Depends(get_optional_user),
):
    if enq_type not in ("contact", "catering"):
        raise HTTPException(status_code=400, detail="Invalid enquiry type")

    collection = db.contact_messages if enq_type == "contact" else db.catering_enquiries
    enquiry = await collection.find_one({"id": enq_id}, {"_id": 0})
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    is_admin = current_user and current_user.get("role") == "admin"

    if is_admin:
        # Mark all customer messages as read by admin
        await db.enquiry_messages.update_many(
            {"enquiry_id": enq_id, "sender": "customer", "read_by_admin": False},
            {"$set": {"read_by_admin": True}},
        )
    else:
        if not current_user:
            raise HTTPException(status_code=401, detail="Authentication required")
        uid = current_user["sub"]
        user_doc = await db.users.find_one({"id": uid}, {"email": 1})
        email = user_doc["email"] if user_doc else None
        if enquiry.get("user_id") != uid and enquiry.get("email") != email:
            raise HTTPException(status_code=403, detail="Access denied")
        # Mark admin messages as read by customer
        await db.enquiry_messages.update_many(
            {"enquiry_id": enq_id, "sender": "admin", "read_by_customer": False},
            {"$set": {"read_by_customer": True}},
        )
        # Mark notifications as read
        await db.notifications.update_many(
            {"user_id": uid, "enquiry_id": enq_id}, {"$set": {"read": True}}
        )

    messages = await db.enquiry_messages.find(
        {"enquiry_id": enq_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)

    return messages


# ── Thread: admin sends message ────────────────────────────────────────────────

@router.post("/{enq_type}/{enq_id}/messages")
async def admin_send_message(
    enq_type: str,
    enq_id: str,
    payload: EnquiryMessageCreate,
    _: dict = Depends(require_admin),
):
    if enq_type not in ("contact", "catering"):
        raise HTTPException(status_code=400, detail="Invalid enquiry type")

    collection = db.contact_messages if enq_type == "contact" else db.catering_enquiries
    enquiry = await collection.find_one({"id": enq_id}, {"_id": 0})
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    msg = EnquiryMessage(
        enquiry_id=enq_id,
        enquiry_type=enq_type,
        sender="admin",
        sender_name="Sree Svadista Prasada",
        text=payload.text,
    )
    await db.enquiry_messages.insert_one(msg.model_dump())

    # Auto-update status to contacted
    if enquiry.get("status") == "new":
        await collection.update_one({"id": enq_id}, {"$set": {"status": "contacted"}})

    # Find customer user_id
    customer_uid = enquiry.get("user_id")
    if not customer_uid:
        user_doc = await db.users.find_one({"email": enquiry.get("email")}, {"id": 1})
        if user_doc:
            customer_uid = user_doc["id"]

    # Create in-app notification for customer
    if customer_uid:
        preview = payload.text if len(payload.text) <= 80 else payload.text[:77] + "…"
        notif = Notification(
            user_id=customer_uid,
            title="Reply to your enquiry",
            body=preview,
            enquiry_id=enq_id,
            enquiry_type=enq_type,
        )
        await db.notifications.insert_one(notif.model_dump())

    # Email the customer about the reply
    customer_email = enquiry.get("email")
    customer_name = enquiry.get("name") or "there"
    if not customer_email and customer_uid:
        u = await db.users.find_one({"id": customer_uid}, {"email": 1, "name": 1})
        if u:
            customer_email = u.get("email")
            customer_name = u.get("name") or customer_name
    if customer_email:
        subj, html = email_enquiry_reply(customer_name, payload.text)
        send_email(customer_email, subj, html)

    return msg.model_dump()


# ── Thread: customer replies ───────────────────────────────────────────────────

@router.post("/{enq_type}/{enq_id}/reply")
async def customer_reply(
    enq_type: str,
    enq_id: str,
    payload: EnquiryMessageCreate,
    current_user: dict = Depends(get_current_user),
):
    if enq_type not in ("contact", "catering"):
        raise HTTPException(status_code=400, detail="Invalid enquiry type")

    collection = db.contact_messages if enq_type == "contact" else db.catering_enquiries
    enquiry = await collection.find_one({"id": enq_id}, {"_id": 0})
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    uid = current_user["sub"]
    user_doc = await db.users.find_one({"id": uid}, {"email": 1, "name": 1})
    email = user_doc["email"] if user_doc else None

    if enquiry.get("user_id") != uid and enquiry.get("email") != email:
        raise HTTPException(status_code=403, detail="Access denied")

    # Reopen if resolved
    if enquiry.get("status") == "resolved":
        await collection.update_one({"id": enq_id}, {"$set": {"status": "contacted"}})

    sender_name = user_doc["name"] if user_doc else enquiry.get("name", "Customer")
    msg = EnquiryMessage(
        enquiry_id=enq_id,
        enquiry_type=enq_type,
        sender="customer",
        sender_name=sender_name,
        text=payload.text,
    )
    await db.enquiry_messages.insert_one(msg.model_dump())

    return msg.model_dump()
