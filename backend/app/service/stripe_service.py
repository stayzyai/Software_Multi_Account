import stripe
from fastapi import HTTPException
import os, json
from dotenv import load_dotenv
from app.models.user import HostawayAccount, User, ChatAIStatus, Subscription
from app.common.hostaway_setup import hostaway_get_request
from sqlalchemy.orm import Session
import logging
from datetime import datetime

load_dotenv()
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
price_id = os.getenv("STRIPE_BASIC_PLAN_ID")

def create_checkout_session(email: str, chatId: int, quantity, customer_id=None):
    try:
        BASE_URL = os.getenv("BASE_URL")
        success_url = f"{BASE_URL}/payment-success"
        cancel_url = f"{BASE_URL}/payment-cancel"
        session_params = {
            "payment_method_types": ["card"],
            "line_items": [{"price": price_id, "quantity": quantity}],
            "mode": "subscription",
            "success_url": success_url,
            "cancel_url": cancel_url,
            "metadata": {"chatId": chatId},
            "saved_payment_method_options": {
                "payment_method_save": "enabled"
            }
        }
        if customer_id:
            session_params["customer"] = customer_id
        else:
            session_params["customer_email"] = email  # Use email if no customer_id
        # Create the checkout session
        session = stripe.checkout.Session.create(**session_params)
        return session
    except HTTPException as exc:
        raise exc
    except Exception as e:
        raise HTTPException(status_code=500, detail={"message": f"An error occurred at create checkout session: {str(e)}"})


def get_all_reservations(user_email: str, db:Session):
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
        # conversation_ids = [conv['id'] for conv in conversations if conv.get('listingMapId') == int(listing_id)]
        conversation_ids = [conv['id'] for conv in conversations]
        return conversation_ids

    except Exception as e:
        raise HTTPException(status_code=500, detail={"message": f"Error in get_all_reservations: {str(e)}"})


from sqlalchemy.orm import Session

def activate_ai_for_chats(db: Session, chat_ids: list[int], user_id: int):
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
                ai_enabled=True,
                is_active=True,
                user_id=user_id
            )
            db.add(chat_ai_status)
            logging.info(f"Created new ChatAIStatus for chat_id={chat_id}")
    db.commit()
    return chat_ids

def upadate_subscription(db: Session, customer_id):
    subscription = None
    try:
        subscription = db.query(Subscription).filter(Subscription.stripe_customer_id==customer_id).first()
        if subscription:
            # Mark subscription as expired
            subscription.is_active = False
            subscription.expire_at = datetime.utcnow()
            # Disable all ChatAIStatus entries for this user
            chat_statuses = db.query(ChatAIStatus).filter(ChatAIStatus.user_id == subscription.user_id).all()
            for chat_status in chat_statuses:
                chat_status.is_active = False
                chat_status.ai_enabled = False

            db.commit()
            return subscription
        else:
            logging.warning(f"No subscription found for customer_id: {customer_id}")
            return subscription
    except Exception as e:
        logging.error(f"Error at update subscription: {str(e)}")
        return subscription

def get_user_cards_list(customer_id):
    try:
        cards = []
        starting_after = None
        while True:
            response = stripe.PaymentMethod.list(
                customer=customer_id,
                type="card",
                starting_after=starting_after
            )
            if response and response.data:
                cards.extend(response.data)
            if not response.get("has_more"):
                break
            starting_after = response.data[-1].id

        return [{
            "id": pm.id,
            "brand": pm.card.brand,
            "last4": pm.card.last4,
            "exp_month": pm.card.exp_month,
            "exp_year": pm.card.exp_year
        } for pm in cards] if cards else []

    except Exception as e:
        logging.error(f"Unexpected error (cards): {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving card details.")

def get_user_payments_list(customer_id):
    try:
        charges = []
        starting_after = None
        while True:
            response = stripe.Charge.list(
                customer=customer_id,
                starting_after=starting_after
            )
            if response and response.data:
                charges.extend(response.data)
            if not response.get("has_more"):
                break
            starting_after = response.data[-1].id

        payments = []
        for charge in charges:
            if not hasattr(charge, 'payment_method_details') or not hasattr(charge.payment_method_details, 'card'):
                continue

            card_details = charge.payment_method_details.card
            amount = charge.amount / 100  # Convert cents to dollars
            payments.append({
                "id": charge.id,
                "amount": amount,
                "currency": charge.currency.upper(),
                "status": charge.status,
                "payment_method": f"{card_details.brand} ****{card_details.last4}",
                "created": datetime.fromtimestamp(charge.created).isoformat()
            })

        return payments if payments else []

    except Exception as e:
        logging.error(f"Unexpected error (payments): {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving payment history.")

def get_user_cards_and_payments(customer_id):
    cards = get_user_cards_list(customer_id)
    payments = get_user_payments_list(customer_id)
    return {
        "cards": cards,
        "payments": payments
    }
