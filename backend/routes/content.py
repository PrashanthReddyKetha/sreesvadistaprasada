from fastapi import APIRouter
from database import db

router = APIRouter(prefix="/content", tags=["content"])


@router.get("/gallery")
async def get_gallery():
    items = await db.gallery_images.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    return items


@router.get("/faq")
async def get_faq():
    items = await db.faq_data.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return items
