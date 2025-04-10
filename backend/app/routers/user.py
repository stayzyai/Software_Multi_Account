from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from app.schemas.user import UserUpdate, ChangePasswordRequest, UserProfile, ChatRequest
from app.models.user import User, ChromeExtensionToken, Subscription, ChatAIStatus
from app.service.chat_service import get_current_user, get_user_subscription, update_ai_status, get_active_ai_chats
from app.models.user import User, ChromeExtensionToken, Subscription, HostawayAccount
from app.database.db import get_db
from app.common.auth import verify_password, get_password_hash, decode_access_token, get_token, get_hostaway_key
from app.common.user_query import update_user_details
from app.schemas.user import Role
from app.schemas.admin import UserList, UsersDetailResponse, UserResponse
from sqlalchemy import and_
import requests
import logging
from app.common.chat_query import store_chat
from app.common.chat_gpt_assistant import get_latest_model_id
from dotenv import load_dotenv
from typing import Optional
import requests
import logging
from app.common.open_ai import get_gpt_response, nearby_spots_gpt_response
import uuid
from sqlalchemy.exc import NoResultFound
import os
import httpx
from app.common.chat_query import haversine_distance
from datetime import datetime
import threading
from datetime import datetime, timedelta
import json
import re
from app.common.hostaway_setup import hostaway_put_request, hostaway_get_request, hostaway_post_request
import time

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
        logging.error(f"************user updated********{updated_details}")
        return {"detail": {"message": "User updated successfully", "data": updated_details}}

    except HTTPException as exc:
        logging.error(f"************Error at update user********{exc}")
        raise exc

    except Exception as e:
        logging.error(f"************Error updating user********{str(e)}")
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
        logging.error(f"*****An error occurred while retrieving users********{exc}")
        raise exc
    except Exception as e:
        logging.error(f"*****An error occurred while retrieving users********{exc}")
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
            logging.error(f"*****user not found********{db_user}")
            if not user_details:
                raise HTTPException(status_code=404, detail="User not found")
            if not verify_password(change_password_request.current_password, user_details.hashed_password):
                raise HTTPException(status_code=401, detail={"message": "Current password is incorrect"})
            if verify_password(change_password_request.new_password, user_details.hashed_password):
                raise HTTPException(status_code=401, detail={"message": "Current password matches the old password"})
            user_details.hashed_password = get_password_hash(change_password_request.new_password)
            db.commit()
            logging.info(f"*****Password changed successfully********")
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
        logging.error(f"*****Error at change password*****{exc}")
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
        is_premium_member = subscribed_user.is_active if subscribed_user else False
        ai_enable_list = db.query(ChatAIStatus).filter(ChatAIStatus.user_id == user_id, ChatAIStatus.ai_enabled == True).all()
        return UserProfile(id=db_user.id, firstname=db_user.firstname, lastname=db_user.lastname, email=db_user.email, role=db_user.role,
            created_at=db_user.created_at, ai_enable=is_premium_member, chat_list=ai_enable_list)

    except HTTPException as exc:
        logging.error(f"An error occurred while changing the password: {exc}")
        raise exc
    except Exception as e:
        logging.error(f"An error occurred while retrieving user profile: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"An error occurred while retrieving user profile: {str(e)}"})


@router.post("/ai-suggestion")
def chat_with_gpt(request: ChatRequest, db: Session = Depends(get_db), key: str = Depends(get_hostaway_key)):
    token_record = db.query(ChromeExtensionToken).filter(ChromeExtensionToken.key == key).first()
    if token_record is None:
        decode_token = decode_access_token(key)
        user_id = decode_token['sub']
        if user_id is None:
            raise HTTPException(status_code=404, detail="User ID not found in token")
        token_record = True
    if token_record is None:
        raise HTTPException(status_code=404, detail="extension key not found")
    
    # Record the time when the message was received
    received_timestamp = datetime.now().isoformat()
    
    model_id = get_latest_model_id()
    prompt = request.prompt
    if request.messsages is None:
        request.messsages = ""
    gpt_response = get_gpt_response(model_id, prompt, request.messsages)
    if gpt_response is None:
        raise HTTPException(status_code=400, detail="Some error occurred. Please try again.")
    # logging.info(f"chat gpt response{gpt_response}")
    
    # Record the time when the response was generated
    response_timestamp = datetime.now().isoformat()
    
    interaction_data = {
            "prompt": request.messsages,
            "completion": gpt_response,
            "received_timestamp": received_timestamp,
            "response_timestamp": response_timestamp
            }
    store_chat(interaction_data)
    
    # First check GPT response for extension request flags
    gpt_extension_request = bool(re.search(r'extension[_\s]request.*?yes', gpt_response.lower(), re.IGNORECASE))
    gpt_dates_specified = bool(re.search(r'dates[_\s]specified.*?true', gpt_response.lower(), re.IGNORECASE))
    
    # Initialize with GPT detection results
    is_extension_request = gpt_extension_request
    dates_specified = gpt_dates_specified
    
    print(f"GPT detected - dates_specified: {dates_specified}, extension_request: {is_extension_request}")

    mentioned_listing_name = request.listingName
    mentioned_listing_id = request.listingMapId
    
    # Also check the user message directly for date mentions
    # This is a simpler and more direct approach that doesn't rely on the GPT response
    direct_date_check = False
    
    # Common date patterns in natural language
    date_keywords = [
        r'(?:for|on|until|through)?\s*(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(\w+)',  # "7 April" or "the 7th of April"
        r'(?:for|on|until|through)?\s*(?:the\s+)?(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?',  # "April 7" or "April 7th"
        r'(?:for|on|until|through)?\s*(\d{1,2})[/-](\d{1,2})',  # "4/7" or "4-7"
        r'(?:for|on|until|through)?\s*(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})'  # "4/7/2023" or "4-7-23"
    ]
    
    user_message_lower = request.messsages.lower() if request.messsages else ""
    
    for pattern in date_keywords:
        if re.search(pattern, user_message_lower):
            direct_date_check = True
            logging.info(f"Direct date mention found in user message: {re.search(pattern, user_message_lower).group(0)}")
            break
    
    # If we detect a date mention directly in the user's message, force dates_specified to True
    if direct_date_check:
        dates_specified = True
        logging.info("Date detected directly in user message, setting dates_specified to True")
        print("Date detected directly in user message, setting dates_specified to True")
        
        # If this appears to be a direct extension request, also set is_extension_request to True
        if re.search(r'(extend|extension|stay\s+(longer|more|extra)|book\s+more)', user_message_lower):
            is_extension_request = True
            logging.info("Extension request detected directly in user message, setting is_extension_request to True")
            print("Extension request detected directly in user message, setting is_extension_request to True")
    
    # Extract specific dates mentioned in user query
    date_patterns = [
        # April 7, 2025 or April 7 2025
        r'(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?\s*(?:,\s*)?(\d{4})?',
        # 7 April, 2025 or 7 April 2025
        r'(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(\w+)(?:,\s*)?(\d{4})?',
        # 04/07/2025 or 4/7/2025 (assuming MM/DD/YYYY format)
        r'(\d{1,2})/(\d{1,2})/(\d{4})',
        # 2025-04-07
        r'(\d{4})-(\d{1,2})-(\d{1,2})'
    ]
    
    requested_dates = []
    
    for pattern in date_patterns:
        date_matches = re.findall(pattern, request.messsages.lower())
        print(f"Pattern: {pattern}, Matches: {date_matches}")
        for match in date_matches:
            # try:
                # Handle different date formats
                if len(match) == 3:  # All patterns should capture 3 groups
                    if re.match(r'\d{4}', match[0]):  # ISO format: 2025-04-07
                        year, month, day = match
                        month_name = None
                    elif match[0].isalpha():  # Month name first: April 7, 2025
                        month_name, day, year = match
                        month = None
                    else:  # Day first: 7 April, 2025 or MM/DD/YYYY: 04/07/2025
                        if match[1] and match[1].isalpha():  # 7 April, 2025
                            day, month_name, year = match
                            month = None
                        else:  # 04/07/2025
                            month, day, year = match
                            month_name = None
                
                    # Convert month name to number if needed
                    if month_name:
                        import calendar
                        month_names = {month.lower(): i for i, month in enumerate(calendar.month_name) if month}
                        month_abbr = {month.lower(): i for i, month in enumerate(calendar.month_abbr) if month}
                        
                        month_name = month_name.lower()
                        if month_name in month_names:
                            month = month_names[month_name]
                        elif month_name in month_abbr:
                            month = month_abbr[month_name]
                        else:
                            continue
                    
                    # Handle missing year (assume current or next year)
                    if not year or year == '':
                        current_year = datetime.now().year
                        current_month = datetime.now().month
                        
                        # If the mentioned month is earlier than the current month, assume next year
                        if int(month) < current_month:
                            year = current_year + 1
                        else:
                            year = current_year
                    
                    # Create date object
                    date_obj = datetime(int(year), int(month), int(day))
                    date_str = date_obj.strftime("%Y-%m-%d")
                    
                    if date_str not in requested_dates:
                        requested_dates.append(date_str)
                        logging.info(f"Found requested date in user query: {date_str}")
            
            # except (ValueError, TypeError) as e:
            #     logging.warning(f"Error parsing date from {match}: {str(e)}")
            #     continue
            # except Exception as e:
            #     logging.warning(f"Unexpected error parsing date: {str(e)}")
            #     continue
    
    # Get the latest requested date if there are multiple
    latest_requested_date = None
    if requested_dates:
        requested_dates.sort()
        latest_requested_date = requested_dates[-1]
        logging.info(f"Latest requested extension date: {latest_requested_date}")

    if is_extension_request:
        # try:
            # Get hostaway account for this user
            user_id = None
            if token_record is not True:  # It's an extension token
                user_id = token_record.user_id
            else:  # It's a normal token
                decode_token = decode_access_token(key)
                user_id = decode_token['sub']
            
            if user_id:
                # Get the user's Hostaway account
                hostaway_account = db.query(HostawayAccount).filter(HostawayAccount.user_id == user_id).first()
                
                if hostaway_account:
                    # Get all reservations
                    import requests.exceptions
                    
                    # Define the fields we need
                    check_in_field = "arrivalDate"
                    check_out_field = "departureDate"
                    reservation_listing_field = "listingMapId"
                    
                    # Check if a specific username was provided for reservation lookup
                    username_filter = request.username
                    if username_filter:
                        logging.info(f"Searching for reservations with username: {username_filter}")
                        print(f"DEBUG: Searching for reservations with username: {username_filter!r}")
                    else:
                        logging.info("No username provided in request, will search all reservations")
                        print("DEBUG: No username provided in request, will search all reservations")
                    
                    # try:
                        # Get reservations data with a timeout limit
                    logging.info(f"Retrieving reservations with hostaway token: {hostaway_account.hostaway_token[:5]}...")
                    reservations_response = hostaway_get_request(hostaway_account.hostaway_token, "/reservations")
                    if reservations_response:
                        reservations_data = json.loads(reservations_response)
                        all_reservations = reservations_data
                        logging.info(f"Successfully retrieved reservations data with {len(all_reservations)} reservations")
                        print(f"DEBUG: Retrieved {len(all_reservations)} total reservations")
                        
                        # Filter reservations by username if provided
                        if username_filter:
                            original_count = len(all_reservations)
                            logging.info(f"Username filter: '{username_filter}', Reservations before filter: {original_count}")
                            
                            # Debug: Check each reservation's guest name
                            for i, res in enumerate(all_reservations):  # Check first 10
                                guest_name = res.get('guestName', '')
                                print(f"DEBUG: Reservation {i+1} guest: '{guest_name!r}' vs filter: '{username_filter!r}'")
                                match = guest_name.lower() == username_filter.lower() or username_filter.lower() in guest_name.lower() 
                                print(f"DEBUG: Match result: {match}")
                            
                            # Filter for reservations that match the username (case insensitive)
                            reservations_data['result'] = [
                                r for r in all_reservations
                                if r.get('guestName', '').lower() == username_filter.lower() or 
                                    username_filter.lower() in r.get('guestName', '').lower()
                            ]
                            filtered_count = len(reservations_data)
                            logging.info(f"Filtered reservations by username '{username_filter}': {filtered_count} out of {original_count}")
                            print(f"Filtered reservations by username '{username_filter}': {filtered_count} out of {original_count}")
                            
                            if filtered_count == 0:
                                gpt_response += f"\n\nI couldn't find any reservations for the username '{username_filter}'. Please check the spelling or try with a different username."
                                return {"model": model_id, "answer": gpt_response}
                        
                        # Find the user's current or most recent reservation
                        current_listing_id = None
                        current_reservation = None
                        
                        # Get current date for comparison
                        current_date = datetime.now().strftime("%Y-%m-%d")
                        logging.info(f"Current date for comparison: {current_date}")
                        
                        # Look for active reservations (where user is currently staying)
                        user_reservations = []
                        
                        # try:
                        reservations_data = [reservation for reservation in reservations_data.get('result', []) if reservation.get('listingMapId') == mentioned_listing_id]
                        for reservation in reservations_data:
                            # Check if required fields exist
                            if check_in_field not in reservation or check_out_field not in reservation:
                                logging.warning(f"Reservation missing required date fields: {reservation.get('id', 'unknown')}")
                                continue
                                
                            # Check if this reservation is in the specifically mentioned listing
                            if mentioned_listing_id and reservation.get(reservation_listing_field) is not None:
                                if str(reservation.get(reservation_listing_field)) == mentioned_listing_id:
                                    # Found a reservation in the mentioned listing - check if it's for this user
                                    if reservation.get('status', '').lower() in ['confirmed', 'modified', 'new']:
                                        current_reservation = reservation
                                        current_listing_id = mentioned_listing_id
                                        logging.info(f"Found user's reservation in mentioned listing ID: {current_listing_id}")
                                        # Found a match - skip the remaining checks
                                        break
                                
                            # Check if this is an active reservation (check-in date <= today <= check-out date)
                            if (reservation.get(check_in_field) <= current_date and 
                                reservation.get(check_out_field) >= current_date and
                                reservation.get('status', '').lower() in ['confirmed', 'modified', 'new']):
                                user_reservations.append(reservation)
                            
                            # Also add upcoming reservations (check-in date > today) - they're valid for extensions too
                            elif (reservation.get(check_in_field) > current_date and
                                    reservation.get('status', '').lower() in ['confirmed', 'modified', 'new']):
                                print(f"DEBUG: Found upcoming reservation: ID={reservation.get('id')}, "
                                        f"Guest={reservation.get('guestName')}, Dates={reservation.get(check_in_field)} to {reservation.get(check_out_field)}")
                                user_reservations.append(reservation)
                        
                        # This print statement and the code below should be outside the reservation loop
                        print(f"DEBUG: Found {len(user_reservations)} active or upcoming reservations")
                        if user_reservations:
                            for i, res in enumerate(user_reservations):
                                # Determine if this is active now or upcoming
                                is_active = (res.get(check_in_field) <= current_date and 
                                            res.get(check_out_field) >= current_date)
                                status = "Active" if is_active else "Upcoming"
                                
                                print(f"DEBUG: {status} reservation {i+1}: ID={res.get('id')}, " 
                                        f"Guest={res.get('guestName')}, ListingID={res.get(reservation_listing_field)}, "
                                        f"Dates={res.get(check_in_field)} to {res.get(check_out_field)}")
                            
                            # Sort reservations - active ones first, then by check-in date (earliest first)
                            user_reservations.sort(key=lambda x: (
                                0 if x.get(check_in_field) <= current_date and x.get(check_out_field) >= current_date else 1,
                                x.get(check_in_field)
                            ))
                            current_reservation = user_reservations[0]
                            current_listing_id = str(current_reservation.get(reservation_listing_field))
                            logging.info(f"Found user's reservation in listing ID: {current_listing_id}")
                            print(f"DEBUG: Selected reservation: ID={current_reservation.get('id')}, "
                                    f"Guest={current_reservation.get('guestName')}, "
                                    f"Dates={current_reservation.get(check_in_field)} to {current_reservation.get(check_out_field)}")
                        else:
                            # Debug why no active reservations were found
                            print(f"DEBUG: No active or upcoming reservations found. Current date: {current_date}")
                            for i, res in enumerate(reservations_data):
                                check_in = res.get(check_in_field)
                                check_out = res.get(check_out_field)
                                status = res.get('status', '').lower()
                                date_condition = (check_in <= current_date and check_out >= current_date) if check_in and check_out else False
                                upcoming_condition = (check_in > current_date) if check_in else False
                                status_condition = status in ['confirmed', 'modified', 'new']
                                print(f"DEBUG: Reservation {i+1} check - Current date condition: {date_condition}, " 
                                        f"Upcoming condition: {upcoming_condition}, Status condition: {status_condition}")
                                print(f"DEBUG: Details - CheckIn: {check_in}, CheckOut: {check_out}, Current: {current_date}, Status: {status}")
                        
                        # except Exception as res_proc_err:
                        #     logging.error(f"Error while processing reservations to find current listing: {str(res_proc_err)}")
                            # Continue without a current listing ID
                        
                        # try:
                            # Get listings data with a timeout limit
                        listings_response = hostaway_get_request(hostaway_account.hostaway_token, "/listings")
                        if listings_response:
                            listings_data = json.loads(listings_response)
                            logging.info(f"Successfully retrieved listings data with {len(listings_data.get('result', []))} listings")
                            
                            # Store all gaps found
                            all_gaps = []
                            
                            # Define valid statuses for reservations
                            valid_statuses = ['confirmed', 'modified', 'new']
                            
                            # If we found the user's listing, prioritize that
                            processed_listings = []
                            
                            # First, look for specifically mentioned listing by name
                            mentioned_listing_found = False
                            if mentioned_listing_name:
                                for listing in listings_data.get('result', []):
                                    # Case-insensitive partial match on listing name
                                    if (listing.get('name') and 
                                        mentioned_listing_name.lower() in listing.get('name', '').lower()):
                                        mentioned_listing_found = True
                                        current_listing_id = mentioned_listing_id
                                        processed_listings.append(listing)
                                        logging.info(f"Found mentioned listing by name: {listing.get('name')} (ID: {current_listing_id})")
                                        break
                                
                                if not mentioned_listing_found:
                                    logging.warning(f"Mentioned listing name '{mentioned_listing_name}' not found in listings data")
                            
                            # Then check the user's current/recent booking
                            if current_listing_id and not mentioned_listing_found:
                                # First check the user's current/recent listing
                                current_listing_found = False
                                for listing in listings_data.get('result', []):
                                    if str(listing['id']) == current_listing_id:
                                        processed_listings.append(listing)
                                        current_listing_found = True
                                        logging.info(f"Found current listing in listings data: {listing.get('name', 'unknown')}")
                                        break
                                
                                if not current_listing_found:
                                    logging.warning(f"Current listing ID {current_listing_id} not found in listings data")
                                
                                # Then add other listings if needed
                                for listing in listings_data.get('result', []):
                                    if str(listing['id']) != current_listing_id:
                                        processed_listings.append(listing)
                            else:
                                # If no current listing found, process all listings
                                processed_listings = listings_data.get('result', [])
                                logging.info(f"No current listing identified, processing all {len(processed_listings)} listings")
                            
                            # Process each listing
                            for listing in processed_listings:
                                listing_id = listing['id']
                                
                                # Get reservations for this listing with valid statuses
                                listing_reservations = [r for r in reservations_data 
                                                        if r.get(reservation_listing_field) is not None and
                                                        str(r[reservation_listing_field]) == str(listing_id) and
                                                        r.get('status', '').lower() in valid_statuses]
                                
                                logging.info(f"Found {len(listing_reservations)} reservations for listing {listing_id}")
                                
                                # Sort by check-in date
                                if listing_reservations:
                                    # try:
                                    listing_reservations.sort(key=lambda x: x[check_in_field])
                                    
                                    # Need at least 2 reservations to find gaps
                                    if len(listing_reservations) >= 2:
                                        logging.info(f"Looking for gaps between {len(listing_reservations)} reservations for listing {listing_id}")
                                        print(f"DEBUG: Looking for gaps between {len(listing_reservations)} reservations for listing {listing_id}")
                                        
                                        # Find gaps between reservations
                                        for i in range(len(listing_reservations) - 1):
                                            try:
                                                current_checkout = listing_reservations[i][check_out_field]
                                                next_checkin = listing_reservations[i+1][check_in_field]
                                                
                                                # Calculate gap nights
                                                current_checkout_date = datetime.strptime(current_checkout, "%Y-%m-%d")
                                                next_checkin_date = datetime.strptime(next_checkin, "%Y-%m-%d")
                                                gap_days = (next_checkin_date - current_checkout_date).days
                                                
                                                logging.info(f"Calculating gap between checkout {current_checkout} and checkin {next_checkin}: {gap_days} days")
                                                print(f"DEBUG: Calculating gap between checkout {current_checkout} and checkin {next_checkin}: {gap_days} days")
                                                
                                                if gap_days > 0:
                                                    # Found a gap
                                                    all_gaps.append({
                                                        "listing_id": listing_id,
                                                        "listing_name": listing.get('name', f'Listing {listing_id}'),
                                                        "current_checkout": current_checkout,
                                                        "next_checkin": next_checkin,
                                                        "gap_days": gap_days,
                                                        "current_guest": listing_reservations[i].get('guestName', 'Guest'),
                                                        "status": listing_reservations[i].get('status', 'unknown'),
                                                        "is_current_listing": str(listing_id) == current_listing_id
                                                    })
                                                    logging.info(f"Found gap of {gap_days} days for listing {listing_id}")
                                                    print(f"DEBUG: Found gap of {gap_days} days for listing {listing_id}")
                                            except Exception as gap_err:
                                                logging.error(f"Error calculating gap for listing {listing_id}, reservations {i} and {i+1}: {str(gap_err)}")
                                    else:
                                        logging.info(f"Only found {len(listing_reservations)} reservation(s) for listing {listing_id}, need at least 2 to find gaps")
                                        print(f"DEBUG: Only found {len(listing_reservations)} reservation(s) for listing {listing_id}, need at least 2 to find gaps")
                                        
                                        # Special case: If this is the current listing and we only have 1 reservation (the user's),
                                        # we should still allow extension into the future if there are no conflicting bookings
                                        if len(listing_reservations) == 1 and str(listing_id) == current_listing_id:
                                            current_reservation_data = listing_reservations[0]
                                            if current_reservation_data.get('id') == current_reservation.get('id'):
                                                logging.info(f"This is the user's current reservation, will check if extension is possible")
                                                print(f"DEBUG: This is the user's current reservation, will check if extension is possible")
                                                
                                                # Create a simulated gap with a generous future date (e.g., 30 days from checkout)
                                                current_checkout = current_reservation_data[check_out_field]
                                                current_checkout_date = datetime.strptime(current_checkout, "%Y-%m-%d")
                                                future_date = current_checkout_date + timedelta(days=30)
                                                next_checkin = future_date.strftime("%Y-%m-%d")
                                                
                                                logging.info(f"Creating simulated gap after {current_checkout} until {next_checkin}")
                                                print(f"DEBUG: Creating simulated gap after {current_checkout} until {next_checkin}")
                                                
                                                # Create a simulated gap that allows for extension
                                                all_gaps.append({
                                                    "listing_id": listing_id,
                                                    "listing_name": listing.get('name', f'Listing {listing_id}'),
                                                    "current_checkout": current_checkout,
                                                    "next_checkin": next_checkin,
                                                    "gap_days": 30,  # Simulate a 30-day gap
                                                    "current_guest": current_reservation_data.get('guestName', 'Guest'),
                                                    "status": current_reservation_data.get('status', 'unknown'),
                                                    "is_current_listing": True,
                                                    "is_simulated": True  # Mark this as a simulated gap
                                                })
                                                logging.info(f"Added simulated gap of 30 days after current reservation")
                                                print(f"DEBUG: Added simulated gap of 30 days after current reservation")
                                    # except Exception as sort_err:
                                    #     logging.error(f"Error sorting reservations for listing {listing_id}: {str(sort_err)}")
                                    #     print(f"DEBUG: Error sorting reservations: {str(sort_err)}")
                                            
                            # Add the gap information to the response by appending it to the string
                            # Initialize gap_info here to prevent reference before assignment error
                            gap_info = ""
                            
                            if all_gaps:
                                logging.info(f"Found a total of {len(all_gaps)} gaps across all listings")
                                print(f"DEBUG: Found {len(all_gaps)} gaps across all listings")
                                for i, gap in enumerate(all_gaps):  # Log all gaps
                                    print(f"DEBUG: Gap {i+1}: ListingID={gap['listing_id']}, "
                                            f"Name={gap['listing_name']}, "
                                            f"Period={gap['current_checkout']} to {gap['next_checkin']}, "
                                            f"Days={gap['gap_days']}, IsCurrentListing={gap['is_current_listing']}, "
                                            f"Simulated={gap.get('is_simulated', False)}")
                            else:
                                logging.warning(f"No gaps found across any listings")
                                print(f"DEBUG: No gaps found across any listings")
                                
                            # Check if requested dates are available in any of the found gaps
                            if latest_requested_date:
                                logging.info(f"Found requested date: {latest_requested_date}")
                                print(f"DEBUG: Extracted date from request: {latest_requested_date}")
                                # Check if the date is in the future
                                current_date_obj = datetime.now()
                                requested_date_obj = datetime.strptime(latest_requested_date, "%Y-%m-%d")
                                is_future_date = requested_date_obj > current_date_obj
                                days_until_date = (requested_date_obj - current_date_obj).days
                                print(f"DEBUG: Requested date is in the future: {is_future_date}")
                                print(f"DEBUG: Days from now: {days_until_date}")
                                requested_date_formatted = requested_date_obj.strftime("%B %d, %Y")
                            else:
                                print("DEBUG: No specific date was found in the request")
                            
                            # FIRST PASS: Check for direct extension that covers the requested date
                            direct_extension_covers_request = False
                            direct_extension = None
                            
                            # Define check_out_date from current reservation for extension comparison
                            check_out_date = None
                            checkout_date_obj = None
                            if current_reservation:
                                check_out_date = current_reservation.get(check_out_field)
                                try:
                                    checkout_date_obj = datetime.strptime(check_out_date, "%Y-%m-%d")
                                except (ValueError, TypeError):
                                    logging.error(f"Invalid checkout date format: {check_out_date}")
                            
                            print(f"DEBUG: Checking for direct extensions with checkout date: {check_out_date}")
                            
                            # Check for direct extension
                            for gap in all_gaps:
                                if (gap['is_current_listing'] and  gap['current_checkout'] == check_out_date):
                                    direct_extension = gap
                                    print(f"DEBUG: Found direct extension opportunity: ListingID={gap['listing_id']}, " 
                                            f"From={gap['current_checkout']} to {gap['next_checkin']}, Days={gap['gap_days']}")
                                    
                                    # Check if direct extension covers requested date
                                    if latest_requested_date:
                                        # try:
                                        next_checkin_date = datetime.strptime(gap['next_checkin'], "%Y-%m-%d")
                                        
                                        # Add more detailed logging
                                        logging.info(f"Comparing dates - Checkout: {checkout_date_obj.strftime('%Y-%m-%d') if checkout_date_obj else 'None'}, "
                                                    f"Requested: {requested_date_obj.strftime('%Y-%m-%d')}, "
                                                    f"Next checkin: {next_checkin_date.strftime('%Y-%m-%d')}")
                                        print(f"DEBUG: Comparing dates - Checkout: {checkout_date_obj.strftime('%Y-%m-%d') if checkout_date_obj else 'None'}, "
                                                f"Requested: {requested_date_obj.strftime('%Y-%m-%d')}, "
                                                f"Next checkin: {next_checkin_date.strftime('%Y-%m-%d')}")
                                        
                                        # Check if the checkout date is before the requested date
                                        # AND the requested date is before the next checkin date
                                        if checkout_date_obj and checkout_date_obj <= requested_date_obj < next_checkin_date:
                                            direct_extension_covers_request = True
                                            logging.info(f"Direct extension covers requested date {latest_requested_date}")
                                            print(f"DEBUG: Direct extension covers requested date {latest_requested_date}")
                                        else:
                                            logging.info(f"Direct extension doesn't cover requested date: {latest_requested_date}")
                                            print(f"DEBUG: Direct extension doesn't cover requested date: {latest_requested_date}")
                                            print(f"DEBUG: Extension period: {gap['current_checkout']} to {gap['next_checkin']}, Requested: {latest_requested_date}")
                                            
                                            # If this is a simulated gap (no next booking), we can still extend
                                            if gap.get('is_simulated', False) and checkout_date_obj:
                                                direct_extension_covers_request = True
                                                logging.info(f"Using simulated gap to allow extension to {latest_requested_date}")
                                                print(f"DEBUG: Using simulated gap to allow extension to {latest_requested_date}")
                                        # except ValueError as ve:
                                        #     logging.error(f"Error checking if extension covers request: {str(ve)}")
                                        #     print(f"DEBUG: Error checking if extension covers request: {str(ve)}")
                                        
                                        break
                            else:
                                print(f"DEBUG: No direct extension opportunity found for checkout date: {check_out_date}")
                            
                            # Now determine the right message based on what we found
                            if direct_extension_covers_request:
                                print(f"DEBUG: Direct extension covers requested date: {latest_requested_date}")
                                print(f"DEBUG: Extension details - From {direct_extension['current_checkout']} to {direct_extension['next_checkin']}, Gap: {direct_extension['gap_days']} days")
                                # try:
                                next_checkin_formatted = datetime.strptime(direct_extension['next_checkin'], "%Y-%m-%d").strftime("%B %d, %Y")
                                
                                # Automatically extend the reservation - include upcoming ones by removing the days_until_checkout check
                                if current_reservation:
                                    check_in_date = current_reservation.get(check_in_field)
                                    
                                    # Add debug info about the reservation status (active now or upcoming)
                                # try:
                                    checkin_date_obj = datetime.strptime(check_in_date, "%Y-%m-%d")
                                    days_until_checkin = (checkin_date_obj - datetime.now()).days
                                    
                                    if days_until_checkin > 0:
                                        print(f"DEBUG: Attempting to extend upcoming reservation (starts in {days_until_checkin} days): {current_reservation.get('id')}")
                                    else:
                                        print(f"DEBUG: Attempting to extend active reservation: {current_reservation.get('id')}")
                                    # except Exception as e:
                                    #     print(f"DEBUG: Attempting to extend reservation: {current_reservation.get('id')}")
                                        
                                    try:
                                        # Get the reservation ID and other required fields
                                        reservation_id = current_reservation.get('id')
                                        
                                        # If there's a specific requested date and this is a simulated gap,
                                        # use the requested date instead of the full gap
                                        if latest_requested_date and gap.get('is_simulated', False):
                                            print(f"DEBUG: Using requested date for extension instead of full simulated gap---> {latest_requested_date}")
                                            # Add one day to the requested date for checkout
                                            # requested_checkout_obj = requested_date_obj + timedelta(days=1)
                                            requested_checkout_obj = requested_date_obj
                                            new_checkout_date = requested_checkout_obj.strftime("%Y-%m-%d")
                                            print(f"DEBUG: Using requested date for extension instead of full simulated gap: {new_checkout_date}")
                                            logging.info(f"Using requested date for extension instead of full simulated gap: {new_checkout_date}")
                                            print(f"DEBUG: Using requested date for extension instead of full simulated gap: {new_checkout_date}")
                                        else:
                                            # Otherwise use the gap's end date
                                            new_checkout_date = direct_extension['next_checkin']
                                        print(f"DEBUG: Extension details - Reservation ID: {reservation_id}, Old checkout: {check_out_date}, New checkout: {new_checkout_date}")
                                        logging.info(f"Extension details - Reservation ID: {reservation_id}, Old checkout: {check_out_date}, New checkout: {new_checkout_date}")
                                        
                                        # Verify we have the hostaway account
                                        if not hostaway_account or not hostaway_account.hostaway_token:
                                            logging.error(f"Missing hostaway account or token for user ID: {user_id}")
                                            raise Exception("Missing Hostaway authentication")
                                        
                                        
                                        # First get the current reservation details to use as the base for our update
                                        logging.info(f"Getting full reservation details before update")
                                        current_reservation_details_response = hostaway_get_request(hostaway_account.hostaway_token, f"reservations/{reservation_id}")
                                        current_reservation_details = json.loads(current_reservation_details_response).get('result', {})
                                        
                                        # Start with the complete current reservation data
                                        update_payload = current_reservation_details
                                        
                                        # Just update the departure date field
                                        update_payload['departureDate'] = new_checkout_date
                                        
                                        
                                        # Call the API to update the reservation
                                        logging.info(f"Automatically extending reservation {reservation_id} to {new_checkout_date}")
                                        # Add extensive logging before the API call
                                        logging.info(f"DETAILED - Extension payload contains {len(update_payload)} fields")
                                        logging.info(f"DETAILED - Hostaway token prefix: {hostaway_account.hostaway_token[:10]}...")
                                        
                                        # Use the hostaway token instead of the key for authentication
                                        # Pass force_overbooking=True to enable overbooking for the extension
                                        extension_response = hostaway_put_request(hostaway_account.hostaway_token, f"/reservations/{reservation_id}", update_payload, force_overbooking=True)
                                        
                                        # Add extensive logging for the response
                                        logging.info(f"DETAILED - Raw extension response: {extension_response}")
                                        
                                        try:
                                            extension_result = json.loads(extension_response)
                                            print(f"DEBUG: Extension API full response: {json.dumps(extension_result, indent=2)}")
                                            logging.info(f"DETAILED - Extension API full response: {json.dumps(extension_result, indent=2)}")
                                        except json.JSONDecodeError as json_err:
                                            print(f"DEBUG: CRITICAL - Failed to parse extension response as JSON: {extension_response}")
                                            logging.error(f"CRITICAL - Failed to parse extension response as JSON: {extension_response}")
                                            extension_result = {"status": "error", "message": f"Invalid JSON response: {str(json_err)}"}
                                        
                                        if extension_result.get('status') != 'success':
                                            print(f"DEBUG: Extension failed with response: {json.dumps(extension_result)}")
                                            logging.error(f"Extension failed: {json.dumps(extension_result)}")
                                            # Check for specific error messages
                                            error_message = extension_result.get('message', '')
                                            if error_message and 'booking' in error_message.lower():
                                                gap_info += f"\nI tried to extend your stay, but there appears to be a booking conflict.\n"
                                                gap_info += f"Please contact our support team for assistance with your extension request.\n"
                                            else:
                                                gap_info += f"\nGood news! You could extend your current stay directly by {direct_extension['gap_days']} more nights until {next_checkin_formatted} as there are no bookings immediately after yours.\n"
                                                gap_info += f"Please let me know if you'd like me to process this extension for you.\n"
                                        else:
                                            logging.info(f"Received success response for extension, but need to verify the change was applied")
                                            
                                            # Wait briefly for any database propagation (if needed)
                                            time.sleep(1)
                                            
                                            # Fetch the reservation again to verify the change was applied
                                            verification_response = hostaway_get_request(hostaway_account.hostaway_token, f"/reservations/{reservation_id}")
                                            logging.info(f"DETAILED - Raw verification response: {verification_response}")
                                            
                                            try:
                                                verification_result = json.loads(verification_response)
                                                logging.info(f"DETAILED - Verification result: {json.dumps(verification_result, indent=2)}")
                                                
                                                if verification_result.get('status') == 'success':
                                                    # Extract the result object directly
                                                    reservation_details = verification_result.get('result', {})
                                                    
                                                    # Check the specific fields that would contain the checkout/departure date
                                                    actual_departure_date = reservation_details.get('departureDate')
                                                    actual_checkout_date = reservation_details.get('checkOutDate')
                                                    
                                                    # Log both potential date fields
                                                    logging.info(f"Verification - departureDate: {actual_departure_date}, checkOutDate: {actual_checkout_date}")
                                                    print(f"DEBUG: Verification - departureDate: {actual_departure_date}, checkOutDate: {actual_checkout_date}")
                                                    
                                                    # Use either departureDate or checkOutDate, whichever is available
                                                    final_checkout_date = actual_departure_date or actual_checkout_date
                                                    
                                                    if final_checkout_date == new_checkout_date:
                                                        logging.info(f"Verified that reservation {reservation_id} checkout date was updated to {new_checkout_date}")
                                                        # Continue with the success messaging
                                                        extension_verified = True
                                                    else:
                                                        logging.error(f"Verification failed - checkout date is {final_checkout_date}, not {new_checkout_date}")
                                                        print(f"DEBUG: Verification failed - checkout date is {final_checkout_date}, not {new_checkout_date}")
                                                        
                                                        # Try to update the reservation again
                                                        logging.info(f"Attempting to update the reservation again after verification failure")
                                                        
                                                        # Get fresh reservation data
                                                        fresh_reservation_response = hostaway_get_request(hostaway_account.hostaway_token, f"reservations/{reservation_id}")
                                                        fresh_reservation_data = json.loads(fresh_reservation_response).get('result', {})
                                                        
                                                        # Update the departure date in the fresh data
                                                        fresh_reservation_data['departureDate'] = new_checkout_date
                                                        
                                                        logging.info(f"Retry with fresh reservation data containing {len(fresh_reservation_data)} fields")
                                                        retry_response = hostaway_put_request(hostaway_account.hostaway_token, f"/reservations/{reservation_id}", fresh_reservation_data, force_overbooking=True)
                                                        logging.info(f"DETAILED - Raw retry response: {retry_response}")
                                                        
                                                        try:
                                                            retry_result = json.loads(retry_response)
                                                            logging.info(f"DETAILED - Retry result: {json.dumps(retry_result, indent=2)}")
                                                            
                                                            if retry_result.get('status') == 'success':
                                                                logging.info(f"Second update attempt successful")
                                                                # Check one more time
                                                                time.sleep(1)
                                                                verification_response2 = hostaway_get_request(hostaway_account.hostaway_token, f"/reservations/{reservation_id}")
                                                                verification_result2 = json.loads(verification_response2)
                                                                
                                                                # Extract dates from second verification
                                                                reservation_details2 = verification_result2.get('result', {})
                                                                actual_departure_date2 = reservation_details2.get('departureDate')
                                                                actual_checkout_date2 = reservation_details2.get('checkOutDate')
                                                                final_checkout_date2 = actual_departure_date2 or actual_checkout_date2
                                                                
                                                                if final_checkout_date2 == new_checkout_date:
                                                                    logging.info(f"Second verification successful - checkout date updated to {new_checkout_date}")
                                                                    extension_verified = True
                                                                else:
                                                                    logging.error(f"Second verification failed - checkout date is {final_checkout_date2}, not {new_checkout_date}")
                                                                    extension_verified = False
                                                            else:
                                                                logging.error(f"Second update attempt failed: {retry_result}")
                                                                extension_verified = False
                                                        except json.JSONDecodeError:
                                                            logging.error(f"Failed to parse retry response as JSON: {retry_response}")
                                                            extension_verified = False
                                                else:
                                                    logging.error(f"Failed to get reservation details for verification: {verification_result}")
                                                    extension_verified = False
                                            except json.JSONDecodeError:
                                                logging.error(f"Failed to parse verification response as JSON: {verification_response}")
                                                extension_verified = False
                                            
                                            # Now update the message based on whether verification succeeded
                                            if extension_verified:
                                                logging.info(f"Successfully extended reservation {reservation_id} to {new_checkout_date}")
                                                
                                                # Format the new checkout date for display
                                                new_checkout_date_obj = datetime.strptime(new_checkout_date, "%Y-%m-%d")
                                                new_checkout_formatted = new_checkout_date_obj.strftime("%B %d, %Y")
                                                
                                                # Calculate the actual number of nights extended
                                                if checkout_date_obj:
                                                    nights_extended = (new_checkout_date_obj - checkout_date_obj).days
                                                    # Add success message with correct number of nights
                                                    gap_info += f"\n🎉 GREAT NEWS! I've automatically extended your stay by {nights_extended} more nights until {new_checkout_formatted}.\n"
                                                    gap_info += f"Your reservation has been updated to check out on {new_checkout_formatted}.\n"
                                                else:
                                                    nights_extended = direct_extension['gap_days']
                                                    gap_info += f"\n🎉 GREAT NEWS! I've automatically extended your stay by {nights_extended} more nights until {new_checkout_formatted}.\n"
                                                    gap_info += f"Your reservation has been updated to check out on {new_checkout_formatted}.\n"
                                            else:
                                                logging.warning(f"System reported success but verification failed")
                                                gap_info += f"\nI've submitted a request to extend your stay until {new_checkout_date}, but the system is still processing it.\n"
                                                gap_info += f"Please check your reservation status in a few minutes to confirm the change, or contact customer service if you don't see the update.\n"
                                    except Exception as e:
                                        logging.error(f"Error extending reservation: {str(e)}")
                                        gap_info += f"\nI encountered an issue while trying to extend your reservation: {str(e)}.\n"
                                        gap_info += f"Please contact customer service for assistance with your extension request.\n"
                                else:
                                    # This block is for when direct_extension_covers_request is true but no current_reservation
                                    next_checkin_formatted = datetime.strptime(direct_extension['next_checkin'], "%Y-%m-%d").strftime("%B %d, %Y")
                                    gap_info += f"\nGood news! You could extend your current stay directly by {direct_extension['gap_days']} more nights until {next_checkin_formatted} as there are no bookings immediately after yours.\n"
                                    gap_info += f"Please let me know if you'd like me to process this extension for you.\n"
                            else:
                                # This block is for when direct_extension_covers_request is false
                                if direct_extension:
                                    next_checkin_formatted = datetime.strptime(direct_extension['next_checkin'], "%Y-%m-%d").strftime("%B %d, %Y") 
                                    gap_info += f"\nI found a gap after your stay, but it doesn't cover your requested date ({latest_requested_date}).\n"
                                    gap_info += f"The available extension period is until {next_checkin_formatted}.\n"
                                    gap_info += f"Please let me know if you'd like to extend within this period instead.\n"
                                else:
                                    gap_info += f"\nUnfortunately, I couldn't find any available extension periods after your stay.\n"
                                    gap_info += f"This might be because there's already another booking immediately after yours.\n"
                                    gap_info += f"Please contact customer service if you need assistance with special arrangements.\n"
        
        # Check if gpt_response mentions extension but no date was found
            if is_extension_request and not dates_specified:
                # Check if the user message directly contains an extension request
                extension_words = ['extend', 'extending', 'extension', 'stay longer', 'more nights', 'additional nights']
                has_extension_words = any(word in user_message_lower for word in extension_words)
                
                if has_extension_words:
                    # Add more date patterns that might be specific to extension requests
                    specific_extension_patterns = [
                        r'(?:until|through|for|to)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(\w+)',  # "until 7 April"
                        r'(?:until|through|for|to)\s+(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?',  # "through April 7"
                        r'(?:until|to)\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?',  # "until the 7th"
                        r'(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(\w+)'  # "7th of April" or just "7 April"
                    ]
                    
                    for pattern in specific_extension_patterns:
                        matches = re.search(pattern, user_message_lower)
                        if matches:
                            logging.info(f"Found date in extension request: {matches.group(0)}")
                            print(f"Found date in extension request: {matches.group(0)}")
                            dates_specified = True
                            break
            
        # Final debug log to show the state of the flags
            print(f"Final state - is_extension_request: {is_extension_request}, dates_specified: {dates_specified}")
            logging.info(f"Final state - is_extension_request: {is_extension_request}, dates_specified: {dates_specified}")
            
            # Append the gap information to the GPT response if available
            if 'gap_info' in locals():
                gpt_response = gap_info
            else:
                gpt_response
            
            # Final debug log to confirm function is reaching the end
            print("Function completed successfully!")
            logging.info("Function completed successfully!")

            return {"model": model_id, "answer": gpt_response}
    else:
        return {"model": model_id, "answer": gpt_response}

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
    listingId: int = Query(..., description="Listing Id is for auto mode"),
    db: Session = Depends(get_db),
    token: str = Depends(get_token)
):
    try:
        db_user = get_current_user(db, token)
        subscription = get_user_subscription(db, db_user.id, listingId)
        is_premium_member = update_ai_status(db, db_user.id, chatId, listingId, subscription)
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
