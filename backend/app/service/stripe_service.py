import stripe
from fastapi import HTTPException
import os, json
from dotenv import load_dotenv
from app.models.user import HostawayAccount, User, ChatAIStatus
from app.common.hostaway_setup import hostaway_get_request
from sqlalchemy.orm import Session
import logging

load_dotenv()
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
price_id = os.getenv("STRIPE_BASIC_PLAN_ID")

def create_checkout_session(email: str, chatId: int, listingId: int):
    try:
        BASE_URL = os.getenv("BASE_URL")
        success_url = f"{BASE_URL}/payment-success"
        cancel_url = f"{BASE_URL}/payment-cancel"
        session = stripe.checkout.Session.create(
            success_url=success_url,
            cancel_url=cancel_url,
           line_items=[{"price": price_id , "quantity": 1}],
            mode='subscription',
            customer_email=email,
            metadata={"chatId": chatId, "listingId":listingId},
        )
        return session
    except HTTPException as exc:
        raise exc
    except Exception as e:
        raise HTTPException(status_code=500, detail={"message": f"An error occurred at create checkout session: {str(e)}"})


def get_all_reservations(user_email: str, listing_id, db:Session):
    try:
        user = db.query(User).filter(User.email == user_email).first()
        account = db.query(HostawayAccount).filter(HostawayAccount.user_id == user.id).first()
        if not account or not account.hostaway_token:
            raise HTTPException(status_code=404, detail="Hostaway account or token not found.")
        response = hostaway_get_request(account.hostaway_token, "conversations")
        data = json.loads(response)
        conversations = []
        if data['status'] == 'success':
            conversations = data.get("result", [])
        conversation_ids = [conv['id'] for conv in conversations if conv.get('listingMapId') == int(listing_id)]
        return conversation_ids

    except Exception as e:
        raise HTTPException(status_code=500, detail={"message": f"Error in get_all_reservations: {str(e)}"})


from sqlalchemy.orm import Session

def activate_ai_for_chats(db: Session, chat_ids: list[int], listing_id: int, user_id: int):
    # Fetch all existing chat_ids in one query for performance
    existing_statuses = db.query(ChatAIStatus).filter(ChatAIStatus.chat_id.in_(chat_ids)).all()
    existing_chat_ids = {status.chat_id for status in existing_statuses}

    for chat_id in chat_ids:
        if chat_id in existing_chat_ids:
            # Update existing
            status = next((s for s in existing_statuses if s.chat_id == chat_id), None)
            if status:
                status.is_active = True
                status.ai_enabled = True
                logging.info(f"Updated ChatAIStatus for chat_id={chat_id}")
        else:
            # Create new
            chat_ai_status = ChatAIStatus(
                chat_id=chat_id,
                listing_id=listing_id,
                ai_enabled=True,
                is_active=True,
                user_id=user_id
            )
            db.add(chat_ai_status)
            logging.info(f"Created new ChatAIStatus for chat_id={chat_id}")
    db.commit()
    return chat_ids
