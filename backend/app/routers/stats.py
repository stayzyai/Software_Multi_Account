from fastapi import APIRouter, Depends
from app.common.chat_query import get_average_response_quality, get_message_stats, get_conversation_time_stats

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/response-quality")
async def get_response_quality(days: int = 30):
    """Get the average response quality stats"""
    return get_average_response_quality(days)

@router.get("/message-count")
async def get_message_count(days: int = 30):
    """Get the total number of automated messages"""
    return get_message_stats(days)

@router.get("/conversation-time")
async def get_conversation_time(days: int = 30):
    """Get average time between message received and response sent"""
    return get_conversation_time_stats(days) 