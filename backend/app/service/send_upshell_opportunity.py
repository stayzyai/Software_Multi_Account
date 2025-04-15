import json
import logging
from datetime import datetime, timedelta
import re
from fastapi import HTTPException
from app.models.user import HostawayAccount, Upsell
from app.database.db import get_db
from app.common.hostaway_setup import hostaway_get_request
from app.common.send_email import send_email

def check_and_send_upsells(debug: bool = False):
    try:
        debug = str(debug).lower() == 'true'
        db = next(get_db())

        # Get all Hostaway accounts
        accounts = db.query(HostawayAccount).all()
        if not accounts:
            return {"message": "No Hostaway accounts found"}

        all_upsell_opportunities = []
        total_messages_sent = 0

        for account in accounts:
            try:
                user_id = account.user_id

                # Get all active upsells for this user
                upsells = db.query(Upsell).filter(
                    Upsell.user_id == user_id,
                    Upsell.enabled == True
                ).all()

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

                upsell_opportunities = []

                # Find listing ID field in reservation data
                reservation_listing_field = next(
                    (field for field in ['listingId', 'listing_id', 'listingMapId', 'propertyId', 'property_id'] 
                     if reservations_data['result'] and field in reservations_data['result'][0]), 
                    None
                )

                if not reservation_listing_field:
                    continue  # Skip if listing ID field is unknown

                # Debug data collection
                all_gaps = []

                # Define date fields
                check_in_field = "arrivalDate"
                check_out_field = "departureDate"

                valid_statuses = ['confirmed', 'modified', 'new']
                
                for listing in listings_data['result']:
                    listing_id = listing['id']

                    # Filter reservations for this listing with valid statuses
                    listing_reservations = [
                        r for r in reservations_data['result']
                        if r.get(reservation_listing_field) and str(r[reservation_listing_field]) == str(listing_id)
                        and r.get('status', '').lower() in valid_statuses
                    ]

                    if listing_reservations:
                        try:
                            listing_reservations.sort(key=lambda x: x[check_in_field])
                        except Exception:
                            continue
                    else:
                        continue

                    if len(listing_reservations) < 2:
                        continue

                    # Find gap nights between reservations
                    for i in range(len(listing_reservations) - 1):
                        try:
                            current_checkout = listing_reservations[i][check_out_field]
                            next_checkin = listing_reservations[i+1][check_in_field]
                            
                            current_checkout_date = datetime.strptime(current_checkout, "%Y-%m-%d")
                            next_checkin_date = datetime.strptime(next_checkin, "%Y-%m-%d")
                            gap_days = (next_checkin_date - current_checkout_date).days
                        except Exception:
                            continue

                        all_gaps.append({
                            "listing_id": listing_id,
                            "current_checkout": current_checkout,
                            "next_checkin": next_checkin,
                            "gap_days": gap_days,
                            "current_guest": listing_reservations[i].get('guestName', 'Guest'),
                            "status": listing_reservations[i].get('status', 'unknown')
                        })
                        logging.info(f"Detected all gap:  {all_gaps}")
                        if gap_days > 0:
                            current_guest = listing_reservations[i]

                            # Check applicable upsells
                            for upsell in upsells:
                                try:
                                    upsell_days = str(upsell.detect_upsell_days)
                                    num_match = re.search(r'\d+', upsell_days)
                                    detect_days = int(num_match.group()) if num_match else 0

                                    trigger_date = next_checkin_date - timedelta(days=detect_days)
                                    today = datetime.now().date()

                                    if debug or today == trigger_date.date():
                                        upsell_opportunities.append({
                                            "user_id": user_id,
                                            "listing_id": listing_id,
                                            "reservation_id": current_guest['id'],
                                            "guest_email": current_guest.get('guestEmail', 'Guest'),
                                            "guest_name": current_guest.get('guestName', 'Guest'),
                                            "gap_days": gap_days,
                                            "discount": upsell.discount,
                                            "message": upsell.upsell_message,
                                            "checkout_date": current_checkout,
                                            "possible_extend_nights": gap_days,
                                            "trigger_date": trigger_date.strftime("%Y-%m-%d"),
                                            "upsell_days_before": detect_days
                                        })
                                except (ValueError, TypeError):
                                    continue

                # Send messages
                messages_sent = 0
                for opportunity in upsell_opportunities:
                    try:
                        personalized_message = opportunity["message"].format(
                            guest_name=opportunity["guest_name"],
                            discount=str(opportunity["discount"]) + " %",
                            possible_extend_nights=opportunity["possible_extend_nights"]
                        )

                        guest_email = opportunity["guest_email"]
                        subject = f"Special Offer: Extend Your Stay with {opportunity['discount']}% Discount"

                        if guest_email and '@' in guest_email:
                            email_result = send_email(guest_email, subject, personalized_message)

                            if email_result.get("success", False):
                                messages_sent += 1
                    except Exception as e:
                        print(f"Error sending message: {str(e)}")
                        continue

                total_messages_sent += messages_sent
                all_upsell_opportunities.extend(upsell_opportunities)
                logging.info(f"all upsell opportunities {upsell_opportunities}")
            except Exception as e:
                logging.error(f"Error processing account {account.user_id}: {str(e)}")
                continue  # Continue with next user

        # Return debug info if enabled
        if debug:
            return {
                "message": f"Debug mode: Checked all users. {'No ' if not all_upsell_opportunities else ''}upsell opportunities found",
                "opportunities": all_upsell_opportunities,
                "total_messages_sent": total_messages_sent,
                "today": datetime.now().date().strftime("%Y-%m-%d")
            }
        logging.info(f"Checked for upsell opportunities across all users. Found: {len(all_upsell_opportunities)}, Messages sent: {total_messages_sent}")
        return {
            "message": f"Checked for upsell opportunities across all users. Found: {len(all_upsell_opportunities)}, Messages sent: {total_messages_sent}"
        }

    except Exception as e:
        logging.error(f"Error in check_and_send_upsells: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing upsells: {str(e)}")
