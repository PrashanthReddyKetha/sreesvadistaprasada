from fastapi import APIRouter, HTTPException, Depends
from typing import List
from database import db
from models import (
    ContactMessage, ContactMessageCreate,
    CateringEnquiry, CateringEnquiryCreate,
    NewsletterSubscription, NewsletterCreate,
)
from auth import require_admin

router = APIRouter(prefix="/enquiries", tags=["enquiries"])


# --- Contact ---

@router.post("/contact", response_model=ContactMessage)
async def submit_contact(payload: ContactMessageCreate):
    msg = ContactMessage(**payload.model_dump())
    await db.contact_messages.insert_one(msg.model_dump())
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


# --- Catering ---

@router.post("/catering", response_model=CateringEnquiry)
async def submit_catering(payload: CateringEnquiryCreate):
    enquiry = CateringEnquiry(**payload.model_dump())
    await db.catering_enquiries.insert_one(enquiry.model_dump())
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


# --- Newsletter ---

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
    docs = await db.newsletter.find({"active": True}, {"_id": 0}).to_list(1000)
    return docs
