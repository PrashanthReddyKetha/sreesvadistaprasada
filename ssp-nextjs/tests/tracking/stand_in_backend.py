"""Stand-in for the live backend, for the tracking test only.

- POST /api/events and the analytics report: the real code from backend/routes/events.py against an in-memory
  database, so what the browser sends is judged by the very code that will judge it live.
- Every other GET under /api is fetched read-only from the live backend (the site needs the real menu).
- Every other write is refused, so nothing is ever changed on the live backend.

  python stand_in_backend.py            -> http://127.0.0.1:8765
"""
import asyncio
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import timedelta

os.environ.update(MONGO_URL="mongodb://localhost:27017", DB_NAME="ssp_tracking_test", JWT_SECRET="tracking-test-secret")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "..", "backend"))

from mongomock_motor import AsyncMongoMockClient  # noqa: E402
import database  # noqa: E402

database.db = AsyncMongoMockClient()["ssp_tracking_test"]

from fastapi import FastAPI, Request, Response  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from starlette.middleware.cors import CORSMiddleware  # noqa: E402
from routes import events  # noqa: E402

LIVE = os.environ.get("LIVE_BACKEND", "https://svadista-backend.onrender.com")
SITE = os.environ.get("SITE_URL", "http://localhost:3001")
app = FastAPI()
# Same settings as backend/server.py, so the browser's cross-site checks behave as they do live
app.add_middleware(CORSMiddleware, allow_origins=[SITE], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(events.router, prefix="/api")
db = database.db

# Every test visitor really comes from this machine, so each one names its own address in its browser name
_real_ip = events.client_ip


def _ip(request: Request) -> str:
    m = re.search(r"AuditIP/([\d.]+)", request.headers.get("user-agent", ""))
    return m.group(1) if m else _real_ip(request)


events.client_ip = _ip


@app.get("/__report")
async def report(days: int = 1):
    return await events.analytics(days, None)


@app.get("/__dump")
async def dump():
    docs = await db.events.find({}, {"_id": 0}).sort("at", 1).to_list(None)
    for d in docs:
        d["at"] = d["at"].isoformat()
        d.pop("day_code", None)
    return docs


@app.post("/__reset")
async def reset():
    await db.events.delete_many({})
    events._rate.store.clear()
    return {"ok": True}


@app.post("/__age")
async def age(minutes: int = 45):
    """Push every stored event back in time, to stand in for a pause."""
    n = 0
    async for d in db.events.find({}):
        await db.events.update_one({"_id": d["_id"]}, {"$set": {"at": d["at"] - timedelta(minutes=minutes)}})
        n += 1
    return {"aged": n}


@app.get("/api/kitchen-status")
async def kitchen():
    return {"open": True, "message": "", "delivery_enabled": False}


_cache: dict = {}


@app.get("/api/{path:path}")
async def read_from_live(path: str, request: Request):
    url = f"{LIVE}/api/{path}" + (f"?{request.url.query}" if request.url.query else "")
    if url not in _cache:
        def get():
            req = urllib.request.Request(url, headers={"User-Agent": "ssp-tracking-test/1.0", "Accept": "application/json"})
            try:
                with urllib.request.urlopen(req, timeout=120) as r:
                    return r.status, r.read(), r.headers.get("content-type", "application/json")
            except urllib.error.HTTPError as e:
                return e.code, e.read(), e.headers.get("content-type", "application/json")
            except Exception as e:  # noqa: BLE001
                return 502, str(e).encode(), "text/plain"
        got = await asyncio.to_thread(get)
        if got[0] != 200:
            return Response(content=got[1], status_code=got[0], media_type=got[2].split(";")[0])
        _cache[url] = got
    status, body, ctype = _cache[url]
    return Response(content=body, status_code=status, media_type=ctype.split(";")[0])


@app.api_route("/api/{path:path}", methods=["POST", "PUT", "DELETE", "PATCH"])
async def refuse_writes(path: str):
    return JSONResponse({"detail": "tracking test: not sent to the live backend"}, status_code=503)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="warning")
