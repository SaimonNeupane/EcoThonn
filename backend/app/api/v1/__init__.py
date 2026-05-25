# app/api/v1/__init__.py
from fastapi import APIRouter
from app.api.v1.endpoints import users, soil_scans

api_router = APIRouter(prefix="/api/v1")

# Include routers
api_router.include_router(users.router)
api_router.include_router(soil_scans.router)
