from fastapi import APIRouter, Depends, HTTPException
import logging
from app.database.db import get_db
from app.common.auth import get_token, decode_access_token
from app.models.user import User, ChatAIStatus
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/subscription", tags=["subscription"])

@router.get("/listing-status")
def get_ai_response(db:Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decoded_token = decode_access_token(token)
        user_id = decoded_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        listings = (db.query(ChatAIStatus.ai_enabled).filter(ChatAIStatus.user_id == user_id).all())

        if not listings:
            return JSONResponse(content={"data": [], "message": "No listings found for this user"}, status_code=404)

        response = [{"listing_id": listing.listing_id, "ai_enabled": listing.ai_enabled} for listing in listings]

        return JSONResponse(
            content={"data": response, "message": "listings status retrieved successfully"},
            status_code=200
        )

    except Exception as e:
        logging.error(f"Error at issue detection {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
