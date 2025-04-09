from fastapi import APIRouter, Depends, HTTPException
from app.common.chat_query import get_average_response_quality, get_message_stats, count_task, get_conversation_time_stats
import logging, json
from app.database.db import get_db
from app.common.auth import get_token, decode_access_token
from app.models.user import User, HostawayAccount
from sqlalchemy.orm import Session
from app.common.hostaway_setup import hostaway_get_request
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/response-quality")
async def get_response_quality(days: int = 30, db: Session = Depends(get_db), token: str = Depends(get_token)):
    """Get the average response quality stats"""
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return get_average_response_quality(days)

    except Exception as e:
        logging.error(f"Error at issue detection {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/message-count")
async def get_message_count(days: int = 30, db: Session = Depends(get_db), token: str = Depends(get_token)):
    """Get the total number of automated messages"""
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return get_message_stats(days)

    except Exception as e:
        logging.error(f"Error at issue detection {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/task-count")
def get_task_count(days: int = 30, db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        account = db.query(HostawayAccount).filter(HostawayAccount.user_id == user_id).first()
        if not account:
            raise HTTPException(status_code = 404, detail="Hostaway account not found")
        response = hostaway_get_request(account.hostaway_token, "tasks")
        data = json.loads(response)
        if data['status'] == 'success':
            task_stats = count_task(days, data)
            return {"data":  task_stats}
        return {"detail": {"message": "Some error occured... ", "data": data}}

    except Exception as e:
        logging.error(f"Error at issue detection {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/conversation-time")
async def get_conversation_time(days: int = 30, db: Session = Depends(get_db), token: str = Depends(get_token)):
    """Get average time between message received and response sent"""
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return get_conversation_time_stats(days)
    except Exception as e:
        logging.error(f"Error at conversation-time {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
