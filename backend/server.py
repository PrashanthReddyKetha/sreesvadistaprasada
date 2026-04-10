from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import logging

from database import client
from seed import seed_menu, create_indexes, create_admin_user
from routes import auth, menu, orders, subscriptions, enquiries, delivery

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    await create_indexes()
    await seed_menu()
    await create_admin_user()
    yield
    logger.info("Shutting down...")
    client.close()


app = FastAPI(title="Sree Svadista Prasada API", version="1.0.0", lifespan=lifespan)

_origins_env = os.environ.get("CORS_ORIGINS", "")
_default_origins = [
    "https://sreesvadistaprasada.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
]
allow_origins = [o.strip() for o in _origins_env.split(",") if o.strip()] or _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(menu.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(subscriptions.router, prefix="/api")
app.include_router(enquiries.router, prefix="/api")
app.include_router(delivery.router, prefix="/api")


@app.get("/api")
async def root():
    return {"message": "Sree Svadista Prasada API", "version": "1.0.0"}


@app.get("/api/health")
async def health():
    return {"status": "ok"}
