

from fastapi import APIRouter, HTTPException, Depends, Request, Query
from app.service.stripe_service import create_checkout_session, get_all_reservations, activate_ai_for_chats, upadate_subscription, get_user_cards_and_payments
from app.database.db import get_db
from sqlalchemy.orm import Session
from app.common.auth import get_token, decode_access_token
from app.models.user import User
import os, stripe, logging
from dotenv import load_dotenv
import logging
from app.models.user import Subscription 
from datetime import datetime, timedelta
from app.database.db import get_db
from app.common.user_query import get_user_id_by_email

load_dotenv()

router = APIRouter(prefix="/payment", tags=["payments"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

@router.get("/create-checkout-session")
def create_session(chatId: int = Query(..., description="Chat ID associated with the session"), quantity: int = Query(..., description="Chat ID associated with the session"),  db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail={"message": "User not found"})
        user_email = db_user.email
        subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        if subscription:
            session = create_checkout_session(user_email, chatId, subscription.stripe_customer_id, quantity)
        else: 
            session = create_checkout_session(user_email, chatId, quantity)
        return {"detail": {"message":"checkout session created", "checkout_url": session.url,
                "customer_email": session.customer_email, "success_url": session.success_url,"cancel_url": session.cancel_url}}

    except HTTPException as exc:
        logging.error(f"Error: {exc}")
        raise exc
    except Exception as e:
        logging.error(f"Error:", {str(e)})
        raise HTTPException(status_code=500, detail={"message": f"An error occurred at create checkout session: {str(e)}"})

@router.get("/card-details")
def get_card_detials(db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail={"message": "User not found"})
        subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        if subscription:
            card_details = get_user_cards_and_payments(subscription.stripe_customer_id)
            return {"status":"success", "card_details": card_details}
        return  {"status":"success", "card_details": {"cards": [], "payments": []}}
    except Exception as e:
        logging.error(f"Error at get card details {str(e)}")
        raise HTTPException(f"Error at get card details {str(e)}")

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        logging.info(f"Stripe webhook received: {event['type']}")

        if event['type'] == 'payment_intent.succeeded':
            session = event['data']['object']
            logging.info(f"Payment successful for session ID: {session['id']}")

        elif event['type'] == 'customer.subscription.created':
            subscription = event['data']['object']
            logging.info(f"Subscription created for customer: {subscription['customer']}")

        elif event['type'] == 'invoice.payment_failed':
            invoice = event['data']['object']
            logging.warning(f"Invoice payment failed for {invoice['id']}")
        elif event["type"] == "customer.subscription.deleted":
            subscription = event["data"]["object"]
            customer_id = subscription["customer"]
            ended_at = subscription.get("ended_at")
            upadated_subscription = upadate_subscription(db, customer_id)
            logging.info(f"subscriptions end for this customer: {customer_id} on this date: {ended_at}")
            logging.info(f"Updated subscriptions: {upadated_subscription}")
            return {"status": "success", "message": "subscription updated successfully."}

        elif event['type'] == 'checkout.session.completed':
            payment_intent = event['data']['object']
            logging.info("Checkout session completed.")
            email = payment_intent['customer_details']['email']
            stripe_subscription_id = payment_intent['id']
            stripe_customer_id = payment_intent['customer']
            logging.info(f"Customer email: {email}, Subscription ID: {stripe_subscription_id}, Customer ID: {stripe_customer_id}")

            user_id = get_user_id_by_email(email, db)
            if not user_id:
                raise HTTPException(status_code=404, detail="User not found for email")

            payment_at = datetime.fromtimestamp(payment_intent['created'])
            expire_at = payment_at + timedelta(days=30)
            existing_subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()

            if existing_subscription:
                existing_subscription.is_active = True
                existing_subscription.expire_at = expire_at
                existing_subscription.payment_at = payment_at
                existing_subscription.stripe_subscription_id = stripe_subscription_id
                existing_subscription.stripe_customer_id = stripe_customer_id

            else:
                logging.info("No existing subscription found for this chat_id and listing_id. Creating new one.")
                new_subscription = Subscription(
                stripe_subscription_id=stripe_subscription_id,
                stripe_customer_id=stripe_customer_id,
                is_active=True,
                user_id=user_id,
                email=email,
                payment_at=payment_at,
                expire_at=expire_at
                )
                db.add(new_subscription)

            chat_ids = get_all_reservations(email, db)
            saved_chat = activate_ai_for_chats(db, chat_ids, user_id)
            logging.info(f"AI enable for this chat: {saved_chat}")

            db.commit()
            logging.info("Stripe webhook processed successfully.")
            return {"status": "success", "message": "New subscription created successfully."}

        else:
            logging.info(f"Ignored event type: {event['type']}")
            return {"status": "ignored", "message": "Unhandled event type."}

    except ValueError:
        logging.error("Invalid Stripe payload.")
        return {"status": "error", "message": "Invalid Stripe payload"}

    except Exception as e:
        logging.exception(f"Error processing Stripe webhook {str(e)}")
        return {"status": "error", "message": f"Error processing Stripe webhook: {str(e)}"}
