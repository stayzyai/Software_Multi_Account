from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File
from sqlalchemy.orm import Session
from app.schemas.user import UserUpdate, ChangePasswordRequest, UserProfile, ChatRequest, Role
from app.models.user import User, ChromeExtensionToken, Subscription, ChatAIStatus
from app.service.chat_service import get_current_user, get_user_subscription, update_ai_status, get_active_ai_chats
from app.service.ai_catchup import ai_catchup_service
from app.models.user import ChromeExtensionToken, Subscription, HostawayAccount
from app.database.db import get_db
from app.common.auth import verify_password, get_password_hash, decode_access_token, get_token, get_hostaway_key
from app.common.user_query import update_user_details
from app.schemas.admin import UserList, UsersDetailResponse, UserResponse
from app.common.chat_query import store_chat
from app.common.chat_gpt_assistant import get_latest_model_id
from dotenv import load_dotenv
import logging
from app.common.open_ai import get_gpt_response, nearby_spots_gpt_response
import uuid
from sqlalchemy.exc import NoResultFound
import os
import httpx
from app.common.chat_query import haversine_distance
from datetime import datetime, timedelta
import threading
import json
import re
from app.common.hostaway_setup import hostaway_put_request, hostaway_get_request
from app.websocket import update_checkout_date
import time
from fastapi.responses import JSONResponse
from app.service.s3_service import upload_or_replace_image
from app.service.chat_service import is_update_possible

load_dotenv()

router = APIRouter(prefix="/user", tags=["users"])

@router.post("/update")
def update_user(user: UserUpdate, db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        existing_user = db.query(User).filter(User.id == user.id).first()
        if not existing_user:
            raise HTTPException(status_code=404, detail="User not found")

        if existing_user.role.value == Role.admin.value:    
            user_details = db.query(User).filter(User.id == user.id).first()
            if not user_details:
                raise HTTPException(status_code=404, detail="User not found")
            updated_details = update_user_details(user_details, user, db)
        else:
            updated_details = update_user_details(existing_user, user, db)
        db.commit()
        return {"detail": {"message": "User updated successfully", "data": updated_details}}

    except HTTPException as exc:
        logging.error(f"Error at update user {exc}")
        raise exc

    except Exception as e:
        logging.error(f"*Error updating user** {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error updating user: {str(e)}")

@router.get("/all-users", response_model=UsersDetailResponse)
def get_all_users(db: Session = Depends(get_db), token: str = Depends(get_token), page: int = Query(default=1, ge=1), page_size: int = Query(default=10, ge=1)
):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']

        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail={"message": "You must be registered as an admin first"})

        if db_user.role.value != Role.admin.value:
            raise HTTPException(status_code=403, detail={"message": "You must be an admin to view all users"})

        offset = (page - 1) * page_size
        users = db.query(User).filter(User.role != Role.admin).order_by(User.created_at.desc()).offset(offset).limit(page_size).all()
        total_count = db.query(User).filter(User.role != Role.admin).count()

        response = UsersDetailResponse(detail=UserResponse(message="User fetched successfully...", data=[UserList(id=user.id, firstname=user.firstname, 
                        lastname=user.lastname, email=user.email, role=user.role, created_at=user.created_at)for user in users],total_count=total_count))
        return response

    except HTTPException as exc:
        logging.error(f" An error occurred while retrieving users {exc}")
        raise exc
    except Exception as e:
        logging.error(f" An error occurred while retrieving users {exc}")
        raise HTTPException(status_code=500, detail={"message": f"An error occurred while retrieving users: {str(e)}"})

@router.put("/change-password")
def change_password(change_password_request: ChangePasswordRequest, db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']

        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail={"message": "User not found"})

        if db_user.role.value == Role.admin.value:
            user_details = db.query(User).filter(User.email == change_password_request.email).first()
            logging.error(f" user not found {db_user}")
            if not user_details:
                raise HTTPException(status_code=404, detail="User not found")
            if not verify_password(change_password_request.current_password, user_details.hashed_password):
                raise HTTPException(status_code=401, detail={"message": "Current password is incorrect"})
            if verify_password(change_password_request.new_password, user_details.hashed_password):
                raise HTTPException(status_code=401, detail={"message": "Current password matches the old password"})
            user_details.hashed_password = get_password_hash(change_password_request.new_password)
            db.commit()
            logging.info(f" Password changed successfully ")
            return {"details": {"message": "Password changed successfully",}}
        else:
            if not verify_password(change_password_request.current_password, db_user.hashed_password):
                raise HTTPException(status_code=401, detail={"message": "Current password is incorrect"})
            if  verify_password(change_password_request.new_password, db_user.hashed_password):
                raise HTTPException(status_code=401, detail={"message": "Current password matches the old password"})
            db_user.hashed_password = get_password_hash(change_password_request.new_password)
            db.commit()
            return {"details": {"message": "Password changed successfully"}}

    except HTTPException as exc:
        logging.error(f" Error at change password {exc}")
        raise exc
    except Exception as e:
        logging.error(f"An error occurred while changing the password: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"An error occurred while changing the password: {str(e)}"})

@router.get("/profile", response_model=UserProfile)
def get_user_profile(db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']

        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail={"message": "User not found"})
        subscribed_user = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        is_premium_member = subscribed_user and  subscribed_user.is_active if True else False
        ai_enable_list = db.query(ChatAIStatus).filter(ChatAIStatus.user_id == user_id).all()
        image_url = db_user.profile_url if db_user.profile_url else None
        return UserProfile(id=db_user.id, firstname=db_user.firstname, lastname=db_user.lastname, email=db_user.email, role=db_user.role,
            created_at=db_user.created_at, ai_enable=is_premium_member, chat_list=ai_enable_list, image_url=image_url)

    except HTTPException as exc:
        logging.error(f"An error occurred while changing the password: {exc}")
        raise exc
    except Exception as e:
        logging.error(f"An error occurred while retrieving user profile: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"An error occurred while retrieving user profile: {str(e)}"})

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail={"message": "User not found"})
        # Upload image to S3 and get the file URL
        file_url = upload_or_replace_image(file, user_id)
        if file_url:
            db_user.profile_url = file_url
            db.commit()
        return JSONResponse(content={"message": "Image uploaded successfully", "url": file_url}, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail={"message": f"An error occurred while upload profile image: {str(e)}"})

@router.post("/ai-suggestion")
async def chat_with_gpt(request: ChatRequest, db: Session = Depends(get_db), key: str = Depends(get_hostaway_key)):
    try:
        logging.info(f"AI suggestion request received with key: {key[:10] if key else 'None'}")
        
        # Authenticate the user
        token_record = db.query(ChromeExtensionToken).filter(ChromeExtensionToken.key == key).first()
        user_id = None
        if token_record is None:
            logging.info("No extension token found, attempting to decode as JWT token")
            try:
                decode_token = decode_access_token(key)
                user_id = decode_token['sub']
                if user_id is None:
                    logging.error("User ID not found in token after decoding")
                    raise HTTPException(status_code=404, detail="User ID not found in token")
                logging.info(f"Successfully decoded JWT token, user_id: {user_id}")
                token_record = True
            except Exception as decode_error:
                logging.error(f"Error decoding token: {str(decode_error)}")
                raise HTTPException(status_code=401, detail=f"Invalid authentication token: {str(decode_error)}")
        else:
            logging.info(f"Extension token found for user_id: {token_record.user_id}")
            user_id = token_record.user_id
            
        if token_record is None:
            logging.error("Extension key not found after token check")
            raise HTTPException(status_code=404, detail="extension key not found")
        
        # Record the time when the message was received
        received_timestamp = datetime.now().isoformat()
        
        # Get model and generate response
        model_id = get_latest_model_id()
        prompt = request.prompt
        
        if request.messsages is None:
            request.messsages = ""
            
        gpt_response = get_gpt_response(model_id, prompt, request.messsages)
        if gpt_response is None:
            raise HTTPException(status_code=400, detail="Some error occurred. Please try again.")

        extension_request = False
        response_timestamp = datetime.now().isoformat()
        available_dates = []
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
        interaction_data = {
            "prompt": request.messsages,
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
        user_message_lower = request.messsages.lower() if request.messsages else ""
        if re.search(r'(extend|extension|stay\s+(longer|more|extra)|book\s+more|change\s+date|move\s+date|update\s+date|from\s+\d{1,2}\s+\w+|upto\s+\d{1,2}\s+\w+|check[_\s]in|check[_\s]out)|checkout|checkin|check-in|check-out|book', user_message_lower):
            is_extension_request = True

        # Extract specified listing information
        mentioned_listing_id = request.listingMapId

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
                date_matches = re.findall(pattern, request.messsages.lower())
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

                            if date_str not in requested_dates:
                                requested_dates.append(date_str)
                                dates_specified = True

                    except Exception as e:
                        logging.error(f"Error parsing date: {str(e)}")
                        continue

            # Get the earliest and latest requested dates
            earliest_requested_date = None
            latest_requested_date = None

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
                    return {
                        "model": model_id,
                        "answer": f"Could you please let me know the exact checkin or checkout date you'd like to update? That’ll make it easier for me to check availability."
                    }
                else:
                    return {
                        "model": model_id,
                        "answer": gpt_response
                    }

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
                            if (res.get('id') == request.reservationId)
                        ]
                        upcoming_reservations = [
                            res for res in listing_reservations
                            if res.get('arrivalDate') > current_date
                        ]
                        # Use active reservation if available, otherwise use upcoming
                        if active_reservations:
                            current_reservation = active_reservations[0]
                            logging.info(f"Found active reservation: {current_reservation.get('id')}")
                        if upcoming_reservations:
                            # Sort by arrival date and use the earliest
                            upcoming_reservations.sort(key=lambda x: x.get('arrivalDate'))
                            current_reservation = upcoming_reservations[0]
                            logging.info(f"Found upcoming reservation: {current_reservation.get('id')}")
                        if current_reservation:
                            # We have a reservation to update
                            current_arrival_date = current_reservation.get('arrivalDate')
                            current_departure_date = current_reservation.get('departureDate')
                            reservation_id = request.reservationId
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
                                    return {
                                        "model": model_id,
                                        "answer": "I'm sorry, I couldn't understand the date format. Please try again with a clear date format."
                                    }
                                if earliest_requested_date == latest_requested_date:
                                    if earliest_requested_date < current_arrival_date or latest_requested_date < current_arrival_date:
                                        is_checkin_change = True
                                    if latest_requested_date > current_departure_date or earliest_requested_date > current_departure_date:
                                        is_checkout_change = True
                                
                                if (is_checkin_change and is_checkout_change) or len(new_requested_dates) == 2:
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
                            # Get current reservation details
                            logging.info(f"Getting reservation details for ID: {reservation_id}")
                            current_res_details_response = hostaway_get_request(
                                hostaway_account.hostaway_token, 
                                f"reservations/{reservation_id}"
                            )
                            
                            if not current_res_details_response:
                                logging.error(f"Failed to get reservation details for ID: {reservation_id}")
                                return {
                                    "model": model_id,
                                    "answer": "I'm sorry, I couldn't retrieve your current reservation details. Please try again later or contact customer service."
                                }
                            
                            current_res_details = json.loads(current_res_details_response).get('result', {})
                            
                            if not current_res_details:
                                logging.error(f"Empty result when getting reservation details for ID: {reservation_id}")
                                return {
                                    "model": model_id,
                                    "answer": "I'm sorry, I couldn't find the details for your current reservation. Please try again later or contact customer service."
                                }
                            possible_result = is_update_possible(listing_reservations, request.reservationId, new_arrival_date, new_departure_date)

                            if not possible_result['success']:
                                return {
                                    "model": model_id,
                                    "answer":  possible_result['message']
                                }
                            # Prepare update payload
                            update_payload = current_res_details
                            update_payload['arrivalDate'] = new_arrival_date
                            update_payload['departureDate'] = new_departure_date
                            # Try to update the reservation                            
                            update_response = hostaway_put_request(
                                hostaway_account.hostaway_token,
                                f"/reservations/{reservation_id}",
                                update_payload,
                                force_overbooking=True
                            )
                            if not update_response:
                                logging.error(f"No response received from update request for reservation {reservation_id}")
                                return {
                                    "model": model_id,
                                    "answer": "I tried to update your stay dates, but the system didn't respond. Please try again later or contact customer service."
                                }
                            
                            try:
                                update_result = json.loads(update_response)
                                logging.info(f"Update response status: {update_result.get('status')}")
                            except json.JSONDecodeError:
                                logging.error(f"Invalid JSON response from update request: {update_response}")
                                return {
                                    "model": model_id,
                                    "answer": "I encountered an error while processing your date change request. Please try again later or contact customer service."
                                }
                            
                            if update_result.get('status') == 'success':
                                # Wait briefly for the system to process the change
                                time.sleep(1)
                                
                                # Verify the update by retrieving the reservation again
                                verification_response = hostaway_get_request(
                                    hostaway_account.hostaway_token,
                                    f"/reservations/{reservation_id}"
                                )
                                current_update_result = update_result.get('result', {})

                                updated_arrival_date = current_update_result["arrivalDate"]
                                updated_departure_date = current_update_result["departureDate"]
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
                                    
                                    return {
                                        "model": model_id,
                                        "answer": f"I've updated your stay dates. Your reservation has been changed to check in on {new_arrival_formatted} and check out on {new_departure_formatted}."
                                    }
                                
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
                                        return {
                                            "model": model_id,
                                            "answer": f"I've updated your reservation. Your new check-in date is {updated_arrival_date}, and your check-out date is {updated_departure_date}. Let me know if you need anything else"
                                        }
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
                                                        
                                                        return {
                                                            "model": model_id,
                                                            "answer": f"I've successfully updated your reservation. Your new check-in date is {new_arrival_formatted}, and your check-out date is {new_departure_formatted}. Let me know if you need anything else"
                                                        }
                                        
                                        # If we got here, we couldn't update the reservation despite retries
                                        return {
                                            "model": model_id,
                                            "answer": f"I submitted the date change request and the system accepted it, but I couldn't verify if it was fully processed. Please check your reservation status or contact customer service to confirm your new dates."
                                        }
                                
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
                                    
                                    return {
                                        "model": model_id,
                                        "answer": f"I've updated your stay dates. Your reservation has been changed to check in on {new_arrival_formatted} and check out on {new_departure_formatted}."
                                    }
                            else:
                                # Handle update failure
                                error_message = update_result.get('message', '')
                                logging.error(f"Date update failed: {error_message}")
                                
                                if error_message and 'booking' in error_message.lower():
                                    return {
                                        "model": model_id,
                                        "answer": f"I tried to update your stay dates, but there appears to be a booking conflict. Please contact our support team for assistance with your date change request."
                                    }
                                else:
                                    return {
                                        "model": model_id,
                                        "answer": f"I encountered an issue while trying to update your reservation dates. {error_message} Please contact customer service for assistance."
                                    }
                        else:
                            return {
                                "model": model_id, 
                                "answer": "It looks like there’s no current reservation for this property, so there isn’t anything to extend at the moment. If you’d like to stay, feel free to go ahead and book a new reservation,  I’d be happy to assist if you need help with that."
                            }
                    else:
                        return {
                            "model": model_id,
                            "answer": f"{gpt_response}\n\nI couldn't retrieve your reservation information. Please try again later or contact customer service."
                        }
                else:
                    return {
                        "model": model_id,
                        "answer": f"{gpt_response}\n\nYou need to connect your Hostaway account to use the booking date change feature."
                    }
        
        # If we didn't handle extension or there was no extension request, return the GPT response
        return {"model": model_id, "answer": gpt_response}
    
    except HTTPException as he:
        logging.error(f"HTTP Exception in chat_with_gpt: {str(he)}")
        raise he
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        logging.error(f"Unhandled exception in chat_with_gpt: {str(e)}\n{tb}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/genrate-extension-key")
def genrate_extension_key(token: str = Depends(get_token), db: Session = Depends(get_db)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        db_user = db.query(User).filter(User.id == user_id).first()
        if db_user is None:
            raise HTTPException(status_code=404, detail="User not found")
        user_token = db.query(ChromeExtensionToken).filter(ChromeExtensionToken.user_id==user_id).first()
        key = uuid.uuid4()
        if user_token:
            user_token.key = key
            db.commit()
            return {"detail": {"message": "Key genrated successfully", "key": key}}
        new_key = ChromeExtensionToken(key=key, user_id=user_id)
        db.add(new_key)
        db.commit()
        return {"detail": {"message": "Key genrated successfully", "key": key}}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"message": f"An error occurred at genrate token: {str(e)}"})

@router.get("/get-extension-key")
def get_extension_key(token: str = Depends(get_token), db: Session = Depends(get_db)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        db_user = db.query(User).filter(User.id == user_id).first()
        if db_user is None:
            raise HTTPException(status_code=404, detail="User not found")
        user_token = db.query(ChromeExtensionToken).filter(ChromeExtensionToken.user_id==user_id).first()
        if user_token:
            return {"detail": {"message": "Key fetched successfully", "key": user_token.key}}
        return {"detail": {"message": "Key not found", "key": user_token}}
    except Exception as e:
        logging.error(f"Error at get extension key {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"An error occurred at get token: {str(e)}"})

@router.get("/validate-extension-token")
def validate_token(key: str, db: Session = Depends(get_db)):
    try:
        token_record = db.query(ChromeExtensionToken).filter(ChromeExtensionToken.key == key.strip()).first()
        if token_record:
            return {"detail": {"message": "Token is valid", "status": True}}
        else:
            return {"detail": {"message": "Token is invalid", "status": False}}
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Token not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail={"message": f"An error occurred: {str(e)}"})

@router.post("/nearby-places")
async def get_nearby_places(request: Request, token: str = Depends(get_token), db: Session = Depends(get_db)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        db_user = db.query(User).filter(User.id == user_id).first()
        if db_user is None:
            raise HTTPException(status_code=404, detail="User not found")
        GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
        MAP_URL = os.getenv("MAP_URL")
        body = await request.json()
        lat, lng = body.get("lat"), body.get("lng")
        place_types = ["restaurant", "shopping_mall", "park", "tourist_attraction"]
        all_results = {}
        async with httpx.AsyncClient() as client:
            for place_type in place_types:
                params = {"location": f"{lat},{lng}", "radius": 500,
                    "type": place_type,
                    "key": GOOGLE_MAPS_API_KEY
                }
                response = await client.get(MAP_URL, params=params)
                data = response.json()
                if "results" in data:
                    all_results[place_type] = [
                        { "name": place["name"],
                            "address": place.get("vicinity", "N/A"),
                            "distance_meter": round(
                                haversine_distance(lat, lng,
                                    place["geometry"]["location"]["lat"],
                                    place["geometry"]["location"]["lng"]
                                ), 2
                            )
                        } for place in data["results"][:2]
                    ]
        nearby_spots = nearby_spots_gpt_response(all_results)
        return {"results": nearby_spots}

    except Exception as e:
        logging.error(f"Error at get near places {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching nearby places: {str(e)}")

@router.get("/update-ai", response_model=UserProfile)
def get_user_profile(
    chatId: int = Query(..., description="Chat Id is for auto mode"),
    db: Session = Depends(get_db),
    token: str = Depends(get_token)
):
    try:
        db_user = get_current_user(db, token)
        subscription = get_user_subscription(db, db_user.id)
        is_premium_member = update_ai_status(db, db_user.id, chatId, subscription)
        active_ai_chats = get_active_ai_chats(db, db_user.id)

        return UserProfile(
            id=db_user.id,
            firstname=db_user.firstname,
            lastname=db_user.lastname,
            email=db_user.email,
            role=db_user.role,
            created_at=db_user.created_at,
            ai_enable=is_premium_member,
            chat_list=active_ai_chats
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail={"message": str(e)})

@router.post("/ai-catchup/{chat_id}")
async def trigger_ai_catchup(
    chat_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(get_token)
):
    """
    Trigger AI catchup when AI is toggled back on for a chat.
    This will analyze recent unanswered messages and respond appropriately.
    """
    try:
        # Get current user
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail={"message": "User not found"})
        
        # Check if AI is actually enabled for this chat
        chat_status = db.query(ChatAIStatus).filter(
            ChatAIStatus.user_id == user_id,
            ChatAIStatus.chat_id == chat_id
        ).first()
        
        if not chat_status or not chat_status.ai_enabled:
            raise HTTPException(status_code=400, detail={"message": "AI is not enabled for this chat"})
        
        # Trigger the catchup process
        print(f"🔄 Triggering AI catchup for user {user_id}, chat {chat_id}")
        results = await ai_catchup_service.trigger_ai_catchup(user_id, chat_id)
        
        if results.get("success"):
            return {
                "detail": {
                    "message": "AI catchup completed successfully",
                    "data": results
                }
            }
        else:
            return {
                "detail": {
                    "message": f"AI catchup completed with issues: {results.get('message', 'Unknown error')}",
                    "data": results
                }
            }
            
    except HTTPException as exc:
        raise exc
    except Exception as e:
        print(f"❌ Error in AI catchup endpoint: {e}")
        raise HTTPException(status_code=500, detail={"message": f"Error triggering AI catchup: {str(e)}"})
