from fastapi import APIRouter
from app.routers.user import router as user_router
from app.routers.admin import router as admin_router

main_router = APIRouter()

main_router.include_router(user_router)
main_router.include_router(admin_router)
