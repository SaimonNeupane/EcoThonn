# app/api/v1/endpoints/users.py
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.database import get_db

router = APIRouter()


@router.get("/test-connection")
async def test_db_connection(db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        # A simple ping command to check if the database is responding
        await db.command("ping")
        return {
            "status": "success",
            "message": "Successfully connected to MongoDB Cluster!",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database connection failed: {str(e)}"
        )
