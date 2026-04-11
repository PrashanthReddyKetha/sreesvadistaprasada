from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import logging

from database import client
from seed import seed_menu, create_indexes, create_admin_user
from routes import auth, menu, orders, subscriptions, enquiries, delivery, admin_dabba_wala

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

ALLOWED_ORIGINS = [
    "https://sreesvadistaprasada.vercel.app",
    "https://sreesvadistaprasada-git-main-prasanthreddykethas-projects.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
app.include_router(admin_dabba_wala.router, prefix="/api")


@app.get("/api")
async def root():
    return {"message": "Sree Svadista Prasada API", "version": "1.0.0"}


@app.get("/api/health")
async def health():
    return {"status": "ok"}
