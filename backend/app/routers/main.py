from fastapi import APIRouter
from app.routers.user import router as user_router
from app.routers.admin import router as admin_router
from app.routers.hostway_data import router as hostaway_router
from app.routers.user_auth import router as user_auth_router

main_router = APIRouter()

main_router.include_router(user_router)
main_router.include_router(admin_router)
main_router.include_router(hostaway_router)
main_router.include_router(user_auth_router)
