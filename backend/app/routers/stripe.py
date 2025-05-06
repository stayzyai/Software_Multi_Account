

from fastapi import APIRouter, HTTPException, Depends, Request, Query
from app.service.stripe_service import create_checkout_session, get_all_reservations, activate_ai_for_chats
from app.database.db import get_db
from sqlalchemy.orm import Session
from app.common.auth import get_token, decode_access_token
from app.models.user import User
import os, stripe, logging
from dotenv import load_dotenv
import logging
from sqlalchemy import or_
from app.models.user import Subscription, ChatAIStatus, Listings 
from datetime import datetime, timedelta
from app.database.db import get_db
from app.common.user_query import get_user_id_by_email

load_dotenv()

router = APIRouter(prefix="/payment", tags=["payments"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

@router.get("/create-checkout-session")
def create_session(chatId: int = Query(..., description="Chat ID associated with the session"), listingId: int = Query(..., description="ListingId associated with the session"),  db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail={"message": "User not found"})
        user_email = db_user.email
        session = create_checkout_session(user_email, chatId, listingId)

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

        elif event['type'] == 'checkout.session.completed':
            payment_intent = event['data']['object']
            logging.info("Checkout session completed.")

            email = payment_intent.get('customer_email')
            stripe_subscription_id = payment_intent['id']
            stripe_customer_id = payment_intent['customer']
            logging.info(f"Customer email: {email}, Subscription ID: {stripe_subscription_id}, Customer ID: {stripe_customer_id}")

            user_id = get_user_id_by_email(email, db)
            if not user_id:
                raise HTTPException(status_code=404, detail="User not found for email")

            payment_at = datetime.fromtimestamp(payment_intent['created'])
            expire_at = payment_at + timedelta(days=30)

            metadata = payment_intent.get("metadata", {})
            chat_id = int(metadata["chatId"]) if "chatId" in metadata else None
            listing_id = metadata.get("listingId")
            logging.info(f"Metadata parsed - chat_id: {chat_id}, listing_id: {listing_id}")

            if not chat_id or not listing_id:
                raise HTTPException(status_code=400, detail="Missing chat_id or listing_id in metadata")

            listing = db.query(Listings).filter(Listings.listing_id == listing_id).first()
            if not listing:
                logging.info(f"Listing ID {listing_id} not found. Creating new listing.")
                listing = Listings(listing_id=listing_id, user_id=user_id)
                db.add(listing)
                db.flush()

            existing_subscription = (
                db.query(Subscription)
                .filter(Subscription.chat_id == chat_id, Subscription.listing_id == listing.listing_id)
                .first()
            )

            if existing_subscription:
                existing_subscription.is_active = True
                existing_subscription.expire_at = expire_at
                existing_subscription.payment_at = payment_at
                logging.info(f"Updated existing subscription for chat_id={chat_id} and listing_id={listing_id}")
            else:
                logging.info("No existing subscription found for this chat_id and listing_id. Creating new one.")
                new_subscription = Subscription(
                stripe_subscription_id=stripe_subscription_id,
                stripe_customer_id=stripe_customer_id,
                is_active=True,
                user_id=user_id,
                chat_id=chat_id,
                listing_id=listing.listing_id,
                payment_at=payment_at,
                expire_at=expire_at
                )
                db.add(new_subscription)

            listing.is_active = True
            logging.info(f"Listing ID {listing.listing_id} set to active due to new subscription.")

            # Only create ChatAIStatus if it doesn't already exist for this chat_id
            # existing_chat_status = db.query(ChatAIStatus).filter(ChatAIStatus.chat_id == chat_id).first()
            chat_ids = get_all_reservations(email, listing_id, db)
            saved_chat = activate_ai_for_chats(db, chat_ids, listing_id, user_id)
            logging.info(f"AI enable for this chat: {saved_chat}")
            # if not existing_chat_status:
            #     logging.info("Creating new ChatAIStatus.")
            #     chat_ai_status = ChatAIStatus(
            #         chat_id=chat_id,
            #         listing_id=listing.listing_id,
            #         ai_enabled=True,
            #         user_id=user_id,
            #         is_active=True
            #     )
            #     db.add(chat_ai_status)
            # else:
            #     existing_chat_status.is_active = True
            #     existing_chat_status.ai_enabled = True

            db.commit()
            logging.info("Stripe webhook processed successfully.")
            return {"status": "success", "message": "New subscription created successfully."}

        else:
            logging.info(f"Ignored event type: {event['type']}")
            return {"status": "ignored", "message": "Unhandled event type."}

    except ValueError:
        logging.error("Invalid Stripe payload.")
        raise HTTPException(status_code=400, detail="Invalid payload")

    except Exception as e:
        logging.exception("Error processing Stripe webhook")
        raise HTTPException(status_code=500, detail={"message": f"An error occurred: {str(e)}"})