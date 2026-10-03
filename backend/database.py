from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import certifi
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ['MONGO_URL']
# backend/.env used to be committed and supplied DB_NAME="test_database" whenever the
# host did not set one. The file is no longer tracked, so keep that exact fallback:
# the database in use must not change just because the file left the repository.
DB_NAME = os.environ.get('DB_NAME') or 'test_database'

client = AsyncIOMotorClient(
    MONGO_URL,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=30000,
)
db = client[DB_NAME]
