# app/db/database.py
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "ecothonn_db")

# Create a global database client
client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]


# Dependency to use the database in our routes
def get_db():
    return db
