import stripe
from fastapi import HTTPException
import os
from dotenv import load_dotenv

load_dotenv()
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
price_id = os.getenv("STRIPE_BASIC_PLAN_ID")

def create_checkout_session(email: str):
    try:
        BASE_URL = os.getenv("BASE_URL")
        success_url = f"{BASE_URL}/payment-success"
        cancel_url = f"{BASE_URL}/payment-cancel"
        session = stripe.checkout.Session.create(
            success_url=success_url,
            cancel_url=cancel_url,
           line_items=[{"price": price_id , "quantity": 1}],
            mode='subscription',
            customer_email=email
        )
        return session
    except HTTPException as exc:
        raise exc
    except Exception as e:
        raise HTTPException(status_code=500, detail={"message": f"An error occurred at create checkout session: {str(e)}"})
