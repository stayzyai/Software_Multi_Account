from fastapi import APIRouter, Depends, HTTPException
import logging
from app.database.db import get_db
from app.common.auth import get_token, decode_access_token
from app.models.user import User
from sqlalchemy.orm import Session
from app.service.sentiment_analysis import get_sentiment_prompt
from fastapi import Request
from app.common.open_ai import sentiment_analysis_gpt_response

router = APIRouter(prefix="/sentiment", tags=["sentiment"])

@router.post("/get-sentiment")
async def get_guest_sentiment(chatData: Request, db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        chat_data = await chatData.json()
        if len(chat_data.get("chatData")) == 0:
            raise HTTPException(status_code=400, detail="Chat data is required")

        # Get the sentiment analysis prompt
        prompt = get_sentiment_prompt(chat_data)
        sentiment_result = sentiment_analysis_gpt_response(prompt)

        return sentiment_result
    except Exception as e:
        logging.error(f"Error at issue detection {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
