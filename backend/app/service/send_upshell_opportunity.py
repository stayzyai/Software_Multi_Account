import json
import logging
from datetime import datetime
from fastapi import HTTPException
from app.models.user import HostawayAccount, Upsell
from app.database.db import get_db
from app.common.hostaway_setup import hostaway_get_request
from app.common.send_email import send_email
from app.service.find_upsell import process_upsell_opportunities

def check_and_send_upsells():
    db = None
    try:
        today = datetime.now().date()
        db = next(get_db())

        # Get all Hostaway accounts
        accounts = db.query(HostawayAccount).all()
        if not accounts:
            return {"message": "No Hostaway accounts found"}

        for account in accounts:
            try:
                user_id = account.user_id
                upsells = db.query(Upsell).filter(Upsell.user_id == user_id, Upsell.enabled == True).all()

                if not upsells:
                    continue  # Skip if no active upsells
                # Get all listings for this user
                listings_response = hostaway_get_request(account.hostaway_token, "listings")
                listings_data = json.loads(listings_response)
                if listings_data.get('status') != 'success':
                    continue

                # Get reservations
                reservations_response = hostaway_get_request(account.hostaway_token, "reservations")
                reservations_data = json.loads(reservations_response)
                if reservations_data.get('status') != 'success':
                    continue

                for listing in listings_data['result']:
                    listing_id = listing['id']

                    # Filter reservations for this listing with valid statuses
                    listing_reservations = [r for r in reservations_data['result'] if r.get("listingMapId") == listing_id]

                    for res in listing_reservations:
                        res['reservationDate'] = datetime.strptime(res['reservationDate'], "%Y-%m-%d %H:%M:%S")
                        res['arrivalDate'] = datetime.strptime(res['arrivalDate'], "%Y-%m-%d")
                        res['departureDate'] = datetime.strptime(res['departureDate'], "%Y-%m-%d")
                    process_upsell_opportunities(listing_reservations, upsells, today, account.hostaway_token)
            except Exception as e:
                logging.error(f"Error processing account {account.user_id}: {str(e)}")
                continue  # Continue with next user

    except Exception as e:
        logging.error(f"Error in check_and_send_upsells: {str(e)}")
        # Don't raise HTTPException in background task, just log
    finally:
        if db:
            db.close()  # Ensure database connection is properly closed
