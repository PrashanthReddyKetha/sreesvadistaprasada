"""Public: the business's own Instagram posts and reels for the Catering page. Served from our cache, so visitors'
browsers never talk to Meta and the page works even when Instagram is slow or the token has lapsed."""
from fastapi import APIRouter

import instagram

router = APIRouter(prefix="/instagram", tags=["instagram"])


@router.get("/feed")
async def instagram_feed():
    return await instagram.feed()
