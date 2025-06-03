from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from app.models.user import User, Subscription, ChatAIStatus
from app.common.auth import decode_access_token

def get_current_user(db: Session, token: str) -> User:
    decode_token = decode_access_token(token)
    user_id = decode_token['sub']
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail={"message": "User not found"})
    return db_user

def get_user_subscription(db: Session, user_id: int) -> Optional[Subscription]:
    return db.query(Subscription).filter(Subscription.user_id == user_id,).first()

def update_ai_status(db: Session, user_id: int, chat_id: int, subscription: Optional[Subscription]) -> bool:
    status = db.query(ChatAIStatus).filter(ChatAIStatus.chat_id == chat_id).first()
    is_premium = False

    if subscription and subscription.is_active and subscription.expire_at > datetime.utcnow():
        is_premium = True
        if status:
            status.ai_enabled = not status.ai_enabled
        else:
            status = ChatAIStatus(
                chat_id=chat_id,
                ai_enabled=True,
                user_id=user_id,
                is_active=True
            )
            db.add(status)
        db.commit()
        db.refresh(status)

    elif subscription:
        # Expired subscription
        subscription.is_active = False
        if status:
            status.ai_enabled = False
            status.is_active = False
            db.commit()
            db.refresh(status)
        db.commit()
        db.refresh(subscription)

    else:
        # No subscription
        if status:
            status.ai_enabled = False
            status.is_active = False
            db.commit()
            db.refresh(status)

    return is_premium

def get_active_ai_chats(db: Session, user_id: int):
    return db.query(ChatAIStatus).filter(ChatAIStatus.user_id == user_id).all()


def is_update_possible(reservations, reservation_id, new_arrival, new_departure):
    try:
        new_arrival = datetime.strptime(new_arrival, "%Y-%m-%d").date()
        new_departure = datetime.strptime(new_departure, "%Y-%m-%d").date()
        
        for res in reservations:
            if res['id'] == reservation_id:
                continue
            arrival = datetime.strptime(res['arrivalDate'], "%Y-%m-%d").date()
            departure = datetime.strptime(res['departureDate'], "%Y-%m-%d").date()

            # Check for overlap
            if not (new_departure <= arrival or new_arrival >= departure):
                # Allow extension until the day before the next arrival
                max_departure = arrival - timedelta(days=1)
                return {
                    "success": False,
                    "message": (
                        f"Sorry! Those dates overlap with an existing reservation from "
                        f"{arrival} to {departure}. You can extend your stay up until {max_departure}."
                    )
                }

        # No conflicts found
        return {
            "success": True,
            "message": f" Update allowed. You can change the dates to {new_arrival} → {new_departure}."
        }
    except Exception as e:
        return {
            "success": False,
            "message": f" An error occurred while checking availability: {str(e)}"
        }