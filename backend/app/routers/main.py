from fastapi import APIRouter
from app.routers.user import router as user_router
from app.routers.admin import router as admin_router
from app.routers.hostway_data import router as hostaway_router
from app.routers.user_auth import router as user_auth_router
from app.routers.hostaway import router as auth_hostaway_router
from app.routers.stripe import router as stripe_router
from app.routers.stats import router as stats_router
from app.routers.listing_subscription import router as listing_subscription_router
from app.routers.sentiment import router as sentiment_router

main_router = APIRouter()

main_router.include_router(user_router)
main_router.include_router(admin_router)
main_router.include_router(hostaway_router)
main_router.include_router(user_auth_router)
main_router.include_router(auth_hostaway_router)
main_router.include_router(stripe_router)
main_router.include_router(stats_router)
main_router.include_router(listing_subscription_router)
main_router.include_router(sentiment_router)
