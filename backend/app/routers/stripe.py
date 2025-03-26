

from fastapi import APIRouter, HTTPException, Depends, Request, Query
from app.service.stripe_service import create_checkout_session
from app.database.db import get_db
from sqlalchemy.orm import Session
from app.common.auth import get_token, decode_access_token
from app.models.user import User
import os, stripe, logging
from dotenv import load_dotenv
from app.models.user import Subscription, ChatAIStatus
from datetime import datetime, timedelta
from app.database.db import get_db
from app.common.user_query import get_user_id_by_email

load_dotenv()

router = APIRouter(prefix="/payment", tags=["payments"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

@router.get("/create-checkout-session")
def create_session(chatId: int = Query(..., description="Chat ID associated with the session"), db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail={"message": "User not found"})
        user_email = db_user.email
        session = create_checkout_session(user_email, chatId)

        return {"detail": {"message":"checkout session created", "checkout_url": session.url,
                "customer_email": session.customer_email, "success_url": session.success_url,"cancel_url": session.cancel_url}}

    except HTTPException as exc:
        logging.error(f"Error: {exc}")
        raise exc
    except Exception as e:
        logging.error(f"Error:", {str(e)})
        raise HTTPException(status_code=500, detail={"message": f"An error occurred at create checkout session: {str(e)}"})

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        if event['type'] == 'payment_intent.succeeded':
            session = event['data']['object']
            print(f"Payment successful for session ID: {session['id']}")
        elif event['type'] == 'customer.subscription.created':
            subscription = event['data']['object']
            print(f"Subscription created for customer: {subscription['customer']}")
        elif event['type'] == 'invoice.payment_failed':
            invoice = event['data']['object']
            print(f"Invoice payment failed for {invoice['id']}")
        elif event['type'] == 'checkout.session.completed':
            payment_intent = event['data']['object']
            email = payment_intent.get('customer_email')
            stripe_subscription_id = payment_intent['id']
            stripe_customer_id = payment_intent['customer']
            user_id = get_user_id_by_email(email, db)
            payment_at = datetime.fromtimestamp(payment_intent['created'])
            expire_at = payment_at + timedelta(days=30)

            existing_subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()
            if existing_subscription:
                existing_subscription.is_active = True
                existing_subscription.expire_at = expire_at
                existing_subscription.payment_at = payment_at
            else:
                new_subscription = Subscription(email=email, stripe_subscription_id=stripe_subscription_id,
                    stripe_customer_id=stripe_customer_id, is_active=True, user_id=user_id, payment_at=payment_at,
                    expire_at=expire_at)
                db.add(new_subscription)
            chat_id = payment_intent["metadata"].get("chatId") if "metadata" in payment_intent else None
            existing_chat_status = db.query(ChatAIStatus).filter(ChatAIStatus.chat_id == chat_id).first() if chat_id else None
            if existing_chat_status:
                existing_chat_status.ai_enabled = True
            else:
                chat_ai_status = ChatAIStatus(chat_id=chat_id, ai_enabled=True, user_id=user_id)
                db.add(chat_ai_status)
            db.commit()

            print(f"Subscription created: {new_subscription}")
            return {"status": "success", "message": "Payment completed successfully."}
        else:
            print(f"Unhandled event type: {event['type']}")
            return {"status": "failed", "message": "Payment not completed."}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except Exception as e:
        logging.error(f"Error at stripe webhook: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"An error occurred at stripe webhook: {str(e)}"})
