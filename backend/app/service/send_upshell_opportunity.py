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
                    #     arrival = res['arrivalDate'].date()
                    #     departure = res['departureDate'].date()
                    #     if arrival <= today < departure:
                    #         print(f"✅ Current staying guest-------: {guest_name} | Check-in: {arrival} | Check-out: {departure}")

                    # # Sort by arrivalDate
                    # listing_reservations.sort(key=lambda r: r['arrivalDate'])
                    # print("Booking lead time (reservation date to check-in):")
                    # for res in listing_reservations:
                    #     gap = (res['arrivalDate'] - res['reservationDate']).days
                    #     print(f"Guest========: {res['guestName']} - Booked {gap} days before check-in========")
                    
                    # listing_reservations.sort(key=lambda x: x['arrivalDate'])
                    # print("\nGap Analysis Per Reservation:")
                    # for i, res in enumerate(listing_reservations):
                    #     guest_name = res['guestName']
                    #     arrival = res['arrivalDate']
                    #     departure = res['departureDate']
                    #     gap_before = None
                    #     gap_after = None
                    #     if i > 0:
                    #         prev_departure = listing_reservations[i - 1]['departureDate']
                    #         gap_before = (arrival - prev_departure).days
                    #         if gap_before > 0:
                    #             print(f"Gap before=== {guest_name}'s check-in---: {gap_before} day(s) (from-- {listing_reservations[i-1]['guestName']}  stay)")
                    #     if i < len(listing_reservations) - 1:
                    #         next_arrival = listing_reservations[i + 1]['arrivalDate']
                    #         gap_after = (next_arrival - departure).days
                    #         if gap_after > 0:
                    #             print(f"Gap after-- {guest_name}'s checkout==: {gap_after} day(s) (before {listing_reservations[i+1]['guestName']}'s stay)")
            except Exception as e:
                logging.error(f"Error processing account {account.user_id}: {str(e)}")
                continue  # Continue with next user

    except Exception as e:
        # logging.error(f"Error in check_and_send_upsells: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing upsells: {str(e)}")
