from fastapi import HTTPException
from app.models.user import  HostawayAccount
from app.common.user_query import update_user_details
from app.common.chat_query import store_chat
import logging
from datetime import datetime
import threading
import json
import re
from app.common.hostaway_setup import hostaway_put_request, hostaway_get_request
import time
from app.common.chat_gpt_assistant import get_latest_model_id
from app.service.chat_service import is_update_possible

async def update_booking(messageBody, latest_incoming, listingMapId, reservationId, user_id, db):
    try:
        received_timestamp = datetime.now().isoformat()
        model_id = get_latest_model_id()
        gpt_response = messageBody
        if gpt_response is None:
            raise HTTPException(status_code=400, detail="Some error occurred. Please try again.")
        # Record response timestamp
        print("--gpt_response---------------type-=-",type(gpt_response))
        extension_request = False
        available_dates = []
        response_timestamp = datetime.now().isoformat()
        if isinstance(gpt_response, str):
            try:
                parsed = json.loads(gpt_response)
                if isinstance(parsed, dict) and "response" in parsed:
                    gpt_response = parsed["response"]
                    extension_request = parsed.get("extension_request", "No") == "Yes"
                    available_dates = parsed.get("available_dates")
            except json.JSONDecodeError:
                # It's just a plain string, no need to change gpt_response
                pass
        # Store interaction data
        print("--------gpt_response-----------", gpt_response)
        interaction_data = {
            "prompt": latest_incoming,
            "completion": gpt_response,
            "received_timestamp": received_timestamp,
            "response_timestamp": response_timestamp,
            "user_id": user_id if user_id else None,
        }
        # Store chat in background thread
        try:
            threading.Thread(target=store_chat, args=(interaction_data,), daemon=True).start()
        except Exception as thread_err:
            logging.error(f"Error starting thread to store chat: {str(thread_err)}")
            # Continue execution even if chat storage fails
        
        # Check if this is an extension request
        is_extension_request = False
        dates_specified = False
        
        # Check GPT response for extension flags
        try:
            is_extension_request = bool(re.search(r'(extension[_\s]request.*?yes|date[_\s]change.*?yes|change[_\s]date.*?yes|extend.*?stay|change.*?check[_\s]in|change.*?check[_\s]out)|checkout|checkin|check-in|check-out', gpt_response.lower(), re.IGNORECASE))
            dates_specified = bool(re.search(r'dates[_\s]specified.*?true', gpt_response.lower(), re.IGNORECASE))
        except Exception:
            pass
            
        # Check user message for date change keywords
        user_message_lower = latest_incoming.lower() if latest_incoming else ""
        if re.search(r'(extend|extension|stay\s+(longer|more|extra)|book\s+more|change\s+date|move\s+date|update\s+date|from\s+\d{1,2}\s+\w+|upto\s+\d{1,2}\s+\w+|check[_\s]in|check[_\s]out)|checkout|checkin|check-in|check-out|book', user_message_lower):
            is_extension_request = True

        # Extract specified listing information
        mentioned_listing_id = listingMapId
        print("--------------is_extension_request----------", is_extension_request)
        print("----------extension_request---------------", extension_request)
        if is_extension_request or extension_request and mentioned_listing_id:
            # Extract dates from user message
            requested_dates = []
            date_patterns = [
                r'\b(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,\s*|\s+)?(\d{4})?\b',             # April 7 2025 or April 7
                r'\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(\w+)(?:,\s*|\s+)?(\d{4})?\b',   # 7th of April, 2025 or 7 April
                r'\b(\d{1,2})/(\d{1,2})/(\d{4})\b',                                        # 07/04/2025
                r'\b(\d{4})-(\d{1,2})-(\d{1,2})\b'                                         # 2025-04-07
            ]

            # Extract dates from message
            for pattern in date_patterns:
                date_matches = re.findall(pattern, latest_incoming.lower())
                for match in date_matches:
                    try:
                        if len(match) == 3:
                            year = month = day = month_name = None
                            if re.match(r'\d{4}', match[0]):  # ISO format
                                year, month, day = match
                            elif match[0].isalpha():  # Month name first
                                month_name, day, year = match
                            else:
                                if match[1] and match[1].isalpha():  # Day MonthName Year
                                    day, month_name, year = match
                                else:  # MM/DD/YYYY
                                    month, day, year = match

                            # Convert month name to number if needed
                            if month_name:
                                import calendar
                                month_names = {m.lower(): i for i, m in enumerate(calendar.month_name) if m}
                                month_abbr = {m.lower(): i for i, m in enumerate(calendar.month_abbr) if m}
                                month_name_lower = month_name.lower()

                                month = (
                                    month_names.get(month_name_lower)
                                    or month_abbr.get(month_name_lower)
                                )
                                if not month:
                                    # Try partial matching
                                    for known_month, idx in month_names.items():
                                        if known_month.startswith(month_name_lower) or month_name_lower.startswith(known_month):
                                            month = idx
                                            break
                                    if not month:
                                        for known_abbr, idx in month_abbr.items():
                                            if known_abbr.startswith(month_name_lower) or month_name_lower.startswith(known_abbr):
                                                month = idx
                                                break
                            
                            # Skip if any required field is still None
                            # if not all([month, day, year]):
                            #     continue

                            # Handle missing year
                            if not year:
                                now = datetime.now()
                                year = now.year
                                if month and int(month) < now.month:
                                    year += 1

                            # Convert values
                            month_int = month and int(month)
                            day_int = day and int(day)
                            year_int = year and int(year)
                            # Validate month and day
                            if not (1 <= month_int <= 12):
                                continue

                            max_days = 31
                            if month_int in [4, 6, 9, 11]:
                                max_days = 30
                            elif month_int == 2:
                                max_days = 29 if (year_int % 4 == 0 and year_int % 100 != 0) or (year_int % 400 == 0) else 28

                            if not (1 <= day_int <= max_days):
                                continue

                            # Build date
                            date_obj = datetime(year_int, month_int, day_int)
                            date_str = date_obj.strftime("%Y-%m-%d")
                            print("-----------date_str--------------", date_str)
                            print("------date_obj--------------------", date_obj)
                            if date_str not in requested_dates:
                                requested_dates.append(date_str)
                                dates_specified = True

                    except Exception as e:
                        logging.error(f"Error parsing date: {str(e)}")
                        continue

            # Get the earliest and latest requested dates
            print("--------gpt_response---------------", gpt_response)
            earliest_requested_date = None
            latest_requested_date = None
            print("-------requested_dates------------", requested_dates)
            print("------available_dates--------------", available_dates)
            if requested_dates or available_dates:
                if not requested_dates and  available_dates:
                    requested_dates = available_dates
                requested_dates.sort()
                earliest_requested_date = requested_dates[0]
                latest_requested_date = requested_dates[-1]
            else:
                patterns = [
                r"extend your stay for an additional night.*your stay to start on \d{4}-\d{2}-\d{2} and end on \d{4}-\d{2}-\d{2}",
                r"yes.*updated.*check(?:in|out)",
                r"i’ve updated.*check(?:in|out)",
                r"i have updated.*check(?:in|out)"]
                if any(re.search(pattern, gpt_response, re.IGNORECASE) for pattern in patterns):
                    return "Could you please let me know the exact checkin or checkout date you'd like to update? That’ll make it easier for me to check availability."
                else:
                    return gpt_response

            new_requested_dates = requested_dates
            # If we have user_id, try to update the reservation
            if user_id:
                # Get the user's Hostaway account
                hostaway_account = db.query(HostawayAccount).filter(HostawayAccount.user_id == user_id).first()
                if hostaway_account and hostaway_account.hostaway_token:
                    # Get reservation for the specific listing
                    reservations_response = hostaway_get_request(hostaway_account.hostaway_token, "/reservations")
                    reservations_response = json.loads(reservations_response)
                    if reservations_response['status'] == 'success':
                        all_reservations = reservations_response
                        # Filter reservations to get only those for the mentioned listing
                        listing_reservations = [
                            res for res in all_reservations.get('result', [])
                            if str(res.get('listingMapId')) == str(mentioned_listing_id)
                        ]
                        # Get current date for comparison
                        current_date = datetime.now().strftime("%Y-%m-%d")
                        
                        # Find current/upcoming reservation
                        current_reservation = None
                        
                        # Filter for active or upcoming reservations
                        # active_reservations = [
                        #     res for res in listing_reservations
                        #     if (res.get('arrivalDate') <= current_date and res.get('departureDate') >= current_date)
                        # ]
                        active_reservations = [
                            res for res in listing_reservations
                            if (res.get('id') == reservationId)
                        ]
                        print("----------active_reservations------------", active_reservations)
                        upcoming_reservations = [
                            res for res in listing_reservations
                            if res.get('arrivalDate') > current_date
                        ]
                        print("----------upcoming_reservations--------------", upcoming_reservations)
                        # Use active reservation if available, otherwise use upcoming
                        if active_reservations:
                            current_reservation = active_reservations[0]
                            logging.info(f"Found active reservation: {current_reservation.get('id')}")
                        if upcoming_reservations:
                            # Sort by arrival date and use the earliest
                            upcoming_reservations.sort(key=lambda x: x.get('arrivalDate'))
                            current_reservation = upcoming_reservations[0]
                            logging.info(f"Found upcoming reservation: {current_reservation.get('id')}")
                        print("------current_reservation-----------------", current_reservation)
                        if current_reservation:
                            # We have a reservation to update
                            current_arrival_date = current_reservation.get('arrivalDate')
                            current_departure_date = current_reservation.get('departureDate')
                            reservation_id = reservationId
                            logging.info(f"Current dates: arrival={current_arrival_date}, departure={current_departure_date}, reservation ID: {reservation_id}")
                            
                            # Determine the new dates
                            new_arrival_date = current_arrival_date  # Keep current by default
                            new_departure_date = current_departure_date  # Keep current by default
                            # Check if we have new dates to apply
                            if earliest_requested_date:
                                is_checkin_change = bool(re.search(r'\b('r'check[_\s]?in.*?\b\d{1,2}(st|nd|rd|th)?\s+\w+|'r'from\s+\d{1,2}(st|nd|rd|th)?\s+\w+|'r'check[_\s]?in\s+(on\s+)?\w+\s+\d{1,2}(st|nd|rd|th)?|'r'check[_\s]?in\s+date|'r'arriving\s+on\s+\w+\s+\d{1,2}(st|nd|rd|th)?|'r'arrive\s+on|'r'want.*?(start|from|to\s+check[_\s]?in)|'r'planning\s+to\s+arrive|'r'starting\s+from|'r'stay\s+from|'r'begin\s+from|'r'coming\s+on|'r'checkin'r')\b|check-in',user_message_lower))
                                is_checkout_change = bool(re.search(r'\b('r'check[_\s]?out.*?\b\d{1,2}(st|nd|rd|th)?\s+\w+|'r'until\s+\d{1,2}(st|nd|rd|th)?\s+\w+|'r'upto\s+\d{1,2}(st|nd|rd|th)?\s+\w+|'r'check[_\s]?out\s+(on\s+)?\w+\s+\d{1,2}(st|nd|rd|th)?|'r'leaving\s+on\s+\w+\s+\d{1,2}(st|nd|rd|th)?|'r'leave\s+on|'r'checkout'r')\b|check-out',user_message_lower))
                                # Get current reservation details first
                                current_res_details_response = hostaway_get_request(
                                    hostaway_account.hostaway_token, 
                                    f"reservations/{reservation_id}"
                                )
                                
                                if current_res_details_response:
                                    current_res_details = json.loads(current_res_details_response).get('result', {})
                                    current_arrival_date = current_res_details.get('arrivalDate')
                                    current_departure_date = current_res_details.get('departureDate')
                                    logging.info(f"Current reservation dates - Arrival: {current_arrival_date}, Departure: {current_departure_date}")
                                
                                # Parse the requested date
                                try:
                                    requested_date = datetime.strptime(earliest_requested_date, "%Y-%m-%d")
                                    logging.info(f"Requested date: {earliest_requested_date}")
                                except Exception as e:
                                    logging.error(f"Error parsing requested date: {str(e)}")
                                    return "I'm sorry, I couldn't understand the date format. Please try again with a clear date format."
                                if earliest_requested_date == latest_requested_date:
                                    if earliest_requested_date < current_arrival_date or latest_requested_date < current_arrival_date:
                                        is_checkin_change = True
                                    if latest_requested_date > current_departure_date or earliest_requested_date > current_departure_date:
                                        is_checkout_change = True
                                print("----------earliest_requested_date----------", earliest_requested_date)
                                print("--------latest_requested_date---------", latest_requested_date)
                                print("------is_checkin_change--------------", is_checkin_change)
                                print("-----------------is_checkout_change--------", is_checkout_change)
                                print("--------requested_date----------------", requested_date)
                                
                                if (is_checkin_change and is_checkout_change) or len(new_requested_dates) == 2:
                                    print("---------len(new_requested_dates)--------", len(new_requested_dates))
                                    # For check-in changes, only update the arrival date
                                    new_arrival_date = earliest_requested_date
                                    new_departure_date = latest_requested_date  # Keep existing check-out date
                                    logging.info(f"Check-in change detected: updating arrival date to: {new_arrival_date}, keeping check-out date as: {new_departure_date}")
                                elif is_checkout_change and not is_checkin_change:
                                    # For extension or check-out requests, only update the departure date
                                    new_departure_date = earliest_requested_date
                                    new_arrival_date = current_arrival_date  # Keep existing check-in date
                                elif not is_checkout_change and is_checkin_change:
                                    new_arrival_date = earliest_requested_date
                                    new_departure_date = current_departure_date
                                # else:
                                #     # If we have two different dates, assume it's a check-in and check-out change
                                #     if latest_requested_date and latest_requested_date != earliest_requested_date:
                                #         new_arrival_date = earliest_requested_date
                                #         new_departure_date = latest_requested_date
                                #         logging.info(f"Two distinct dates detected: updating check-in to {new_arrival_date} and check-out to {new_departure_date}")
                                #     else:
                                #         # For other single date changes, check if it's check-in or check-out based on date
                                #         requested_date_obj = datetime.strptime(earliest_requested_date, "%Y-%m-%d")
                                #         current_arrival_obj = datetime.strptime(current_arrival_date, "%Y-%m-%d")
                                        
                                #         # If the requested date is before or the same as the current departure, it's likely a check-in date
                                #         if requested_date_obj <= datetime.strptime(current_departure_date, "%Y-%m-%d"):
                                #             new_arrival_date = earliest_requested_date
                                #             new_departure_date = current_departure_date  # Keep existing check-out date
                                #             logging.info(f"Single date change detected (before or on current departure): updating check-in date to: {new_arrival_date}, keeping check-out date as: {new_departure_date}")
                                #         else:
                                #             # Otherwise, it's a check-out date
                                #             new_departure_date = earliest_requested_date
                                #             new_arrival_date = current_arrival_date  # Keep existing check-in date
                                #             logging.info(f"Single date change detected (after current departure): updating check-out date to: {new_departure_date}, keeping check-in date as: {new_arrival_date}")
                            
                            # Get current reservation details
                            logging.info(f"Getting reservation details for ID: {reservation_id}")
                            current_res_details_response = hostaway_get_request(
                                hostaway_account.hostaway_token, 
                                f"reservations/{reservation_id}"
                            )
                            
                            if not current_res_details_response:
                                logging.error(f"Failed to get reservation details for ID: {reservation_id}")
                                return "I'm sorry, I couldn't retrieve your current reservation details. Please try again later or contact customer service."
                            
                            current_res_details = json.loads(current_res_details_response).get('result', {})
                            
                            if not current_res_details:
                                logging.error(f"Empty result when getting reservation details for ID: {reservation_id}")
                                return"I'm sorry, I couldn't find the details for your current reservation. Please try again later or contact customer service."
                            
                            possible_result = is_update_possible(listing_reservations, reservationId, new_arrival_date, new_departure_date)

                            if not possible_result['success']:
                                return possible_result['message']

                            # Prepare update payload
                            update_payload = current_res_details
                            update_payload['arrivalDate'] = new_arrival_date
                            update_payload['departureDate'] = new_departure_date
                            print("--------update_payload-----", update_payload)
                            # Try to update the reservation                            
                            update_response = hostaway_put_request(
                                hostaway_account.hostaway_token,
                                f"/reservations/{reservation_id}",
                                update_payload,
                                force_overbooking=True
                            )
                            if not update_response:
                                logging.error(f"No response received from update request for reservation {reservation_id}")
                                return "I tried to update your stay dates, but the system didn't respond. Please try again later or contact customer service."
                            try:
                                update_result = json.loads(update_response)
                                logging.info(f"Update response status: {update_result.get('status')}")
                            except json.JSONDecodeError:
                                logging.error(f"Invalid JSON response from update request: {update_response}")
                                return "I encountered an error while processing your date change request. Please try again later or contact customer service."

                            if update_result.get('status') == 'success':
                                # Wait briefly for the system to process the change
                                time.sleep(1)
                                
                                # Verify the update by retrieving the reservation again
                                verification_response = hostaway_get_request(
                                    hostaway_account.hostaway_token,
                                    f"/reservations/{reservation_id}"
                                )
                                current_update_result = update_result.get('result', {})
                                print("------current_update_result-------", current_update_result)
                                updated_arrival_date = current_update_result["arrivalDate"]
                                updated_departure_date = current_update_result["departureDate"]
                                from app.websocket import update_checkout_date
                                if not verification_response:
                                    logging.warning(f"Unable to verify reservation update - no response")
                                    # We'll still assume it worked since the update call succeeded
                                    new_arrival_formatted = datetime.strptime(new_arrival_date, "%Y-%m-%d").strftime("%B %d, %Y")
                                    new_departure_formatted = datetime.strptime(new_departure_date, "%Y-%m-%d").strftime("%B %d, %Y")
                                    
                                    # Update via websocket if needed
                                    new_updated_data = {
                                        "reservation_id": reservation_id,
                                        "new_arrival_date": updated_arrival_date,
                                        "new_departure_date": updated_departure_date
                                    }
                                    await update_checkout_date(new_updated_data)
                                    
                                    return f"I've updated your stay dates. Your reservation has been changed to check in on {new_arrival_formatted} and check out on {new_departure_formatted}."
                                
                                try:
                                    verification_result = json.loads(verification_response)
                                    reservation_details = verification_result.get('result', {})
                                    
                                    # Check if the dates were actually updated
                                    final_arrival_date = reservation_details.get('arrivalDate')
                                    final_departure_date = reservation_details.get('departureDate')
                                    logging.info(f"Verification: final dates = {final_arrival_date}-{final_departure_date}, requested = {new_arrival_date}-{new_departure_date}")
                                    
                                    if final_arrival_date == new_arrival_date and final_departure_date == new_departure_date:
                                        # Success - reservation updated and verified
                                        new_arrival_formatted = datetime.strptime(new_arrival_date, "%Y-%m-%d").strftime("%B %d, %Y")
                                        new_departure_formatted = datetime.strptime(new_departure_date, "%Y-%m-%d").strftime("%B %d, %Y")
                                        
                                        # Update via websocket if needed
                                        new_updated_data = {
                                            "reservation_id": reservation_id,
                                            "new_arrival_date": updated_arrival_date,
                                            "new_departure_date": updated_departure_date
                                        }
                                        await update_checkout_date(new_updated_data)
                                        split_keyword = "Your check-in date"
                                        guest_message = gpt_response.split(split_keyword)[0].strip()
                                        return f"{guest_message}\nyour stay to start on {updated_arrival_date} and end on {updated_departure_date}"
                                    else:
                                        # The API said success but the dates didn't update - try one more time
                                        logging.warning(f"Verification failed - dates are {final_arrival_date}-{final_departure_date}, not {new_arrival_date}-{new_departure_date}")
                                        
                                        # Try to update once more with fresh reservation data
                                        fresh_reservation_data = reservation_details
                                        fresh_reservation_data['arrivalDate'] = new_arrival_date
                                        fresh_reservation_data['departureDate'] = new_departure_date
                                        
                                        retry_response = hostaway_put_request(
                                            hostaway_account.hostaway_token,
                                            f"/reservations/{reservation_id}",
                                            fresh_reservation_data,
                                            force_overbooking=True
                                        )
                                        
                                        if retry_response:
                                            retry_result = json.loads(retry_response)
                                            
                                            if retry_result.get('status') == 'success':
                                                # Check one more time
                                                time.sleep(1)
                                                final_verification_response = hostaway_get_request(
                                                    hostaway_account.hostaway_token,
                                                    f"/reservations/{reservation_id}"
                                                )
                                                
                                                if final_verification_response:
                                                    final_verification_result = json.loads(final_verification_response)
                                                    final_reservation_details = final_verification_result.get('result', {})
                                                    final_arrival_date = final_reservation_details.get('arrivalDate')
                                                    final_departure_date = final_reservation_details.get('departureDate')
                                                    
                                                    if final_arrival_date == new_arrival_date and final_departure_date == new_departure_date:
                                                        # Finally successful
                                                        new_arrival_formatted = datetime.strptime(new_arrival_date, "%Y-%m-%d").strftime("%B %d, %Y")
                                                        new_departure_formatted = datetime.strptime(new_departure_date, "%Y-%m-%d").strftime("%B %d, %Y")
                                                        
                                                        # Update via websocket if needed
                                                        new_updated_data = {
                                                            "reservation_id": reservation_id,
                                                            "new_arrival_date": new_arrival_date,
                                                            "new_departure_date": new_departure_date
                                                        }
                                                        await update_checkout_date(new_updated_data)
                                                        
                                                        return f"I've successfully updated your reservation. Your new check-in date is {new_arrival_formatted}, and your check-out date is {new_departure_formatted}. Let me know if you need anything else"
                                        
                                        # If we got here, we couldn't update the reservation despite retries
                                        return f"I submitted the date change request and the system accepted it, but I couldn't verify if it was fully processed. Please check your reservation status or contact customer service to confirm your new dates."
                                
                                except json.JSONDecodeError:
                                    logging.error(f"Error parsing verification response: {verification_response}")
                                    # We'll still assume it worked since the update call succeeded
                                    new_arrival_formatted = datetime.strptime(new_arrival_date, "%Y-%m-%d").strftime("%B %d, %Y")
                                    new_departure_formatted = datetime.strptime(new_departure_date, "%Y-%m-%d").strftime("%B %d, %Y")
                                    
                                    # Update via websocket if needed
                                    new_updated_data = {
                                        "reservation_id": reservation_id,
                                        "new_arrival_date": new_arrival_date,
                                        "new_departure_date": new_departure_date
                                    }
                                    await update_checkout_date(new_updated_data)
                                    
                                    return f"I've updated your stay dates. Your reservation has been changed to check in on {new_arrival_formatted} and check out on {new_departure_formatted}."
                            else:
                                error_message = update_result.get('message', '')
                                logging.error(f"Date update failed: {error_message}")

                                if error_message and 'booking' in error_message.lower():
                                    return  f"I tried to update your stay dates, but there appears to be a booking conflict. Please contact our support team for assistance with your date change request."
                                else:
                                    return f"I encountered an issue while trying to update your reservation dates. {error_message} Please contact customer service for assistance."
                        else:
                            return "It looks like there’s no current reservation for this property, so there isn’t anything to extend at the moment. If you’d like to stay, feel free to go ahead and book a new reservation,  I’d be happy to assist if you need help with that."
                    else:
                        return f"{gpt_response}\n\nI couldn't retrieve your reservation information. Please try again later or contact customer service."
                else:
                    return f"{gpt_response}\n\nYou need to connect your Hostaway account to use the booking date change feature."
        
        # If we didn't handle extension or there was no extension request, return the GPT response
        return gpt_response

    except HTTPException as he:
        logging.error(f"HTTP Exception in chat_with_gpt: {str(he)}")
        raise he
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        logging.error(f"Unhandled exception in chat_with_gpt: {str(e)}\n{tb}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
