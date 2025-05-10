from fastapi import APIRouter, HTTPException, Depends, Request, Query
import logging, requests
from app.schemas.user import ChatRequest, EmailRequest
from app.common.open_ai import gpt_taskCreation
import json
from app.common.hostaway_setup import hostaway_get_request, hostaway_post_request, hostaway_put_request
from sqlalchemy.orm import Session
from app.common.auth import get_hostaway_key
from app.database.db import get_db
from app.models.user import ChromeExtensionToken, HostawayAccount, Upsell, User
from app.common.auth import get_token
from app.common.auth import decode_access_token
from app.websocket import handle_webhook, handle_reservation
from app.schemas.hostaway import UpsellData, UpsellStatusUpdate
from typing import Optional
from app.common.send_email import send_email

router = APIRouter(prefix="/hostaway", tags=["hostaway"])

@router.get("/get-details/{params}/{id}")
def get_list(params: str, id: int,  db: Session = Depends(get_db), key: str = Depends(get_hostaway_key)):
    try:
        token_record = db.query(ChromeExtensionToken).filter(ChromeExtensionToken.key == key).first()
        if token_record is None:
            decode_token = decode_access_token(key)
            user_id = decode_token['sub']
            if user_id is None:
                raise HTTPException(status_code=404, detail="User ID not found in token")
            token_record = type("TokenRecord", (object,), {"user_id": user_id})()
        if token_record is None:
            raise HTTPException(status_code=404, detail="extension key not found")
        account = db.query(HostawayAccount).filter(HostawayAccount.user_id == token_record.user_id).first()
        if account is None:
            raise HTTPException(status_code=404, detail="hostaway account not found")
        token = account.hostaway_token
        response = hostaway_get_request(token, params, id)
        data = json.loads(response)
        if data['status'] == 'success':
            return {"detail": {"message": "User authenticated successfully on hostaway", "data":  data}}
        return {"detail": {"message": "Some error occured... ", "data": data}}

    except HTTPException as exc:
        logging.error(f"****some error at hostaway authentication*****{exc}")
        raise exc
    except Exception as e:
        raise HTTPException(status_code = 500, detail=f"Error at hostaway authentication: {str(e)}")

@router.get("/get-all/{params}")
def get_all_list(params:str, limit: Optional[int] = None, includeResources: Optional[int] = None, token: str = Depends(get_token), db: Session = Depends(get_db)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        account = db.query(HostawayAccount).filter(HostawayAccount.user_id == user_id).first()
        if not account:
            raise HTTPException(status_code = 404, detail="Hostaway account not found")
        response = hostaway_get_request(account.hostaway_token, params, None, limit, None, includeResources)
        data = json.loads(response)
        if data['status'] == 'success':
            return {"detail": {"message": "User authenticated successfully on hostaway", "data":  data}}
        return {"detail": {"message": "Some error occured... ", "data": data}}

    except HTTPException as exc:
        logging.error(f"****some error at hostaway authentication*****{exc}")
        raise exc
    except Exception as e:
        raise HTTPException(status_code = 500, detail=f"Error at hostaway authentication: {str(e)}")


@router.get("/get-all/{params}/{id}/{params2}")
def get_all_list(params:str, id: int, params2:str, token: str = Depends(get_token), db: Session = Depends(get_db)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        account = db.query(HostawayAccount).filter(HostawayAccount.user_id == user_id).first()
        if not account:
            raise HTTPException(status_code = 404, detail="Hostaway account not found")
        response = hostaway_get_request(account.hostaway_token, f"{params}/{id}/{params2}")
        data = json.loads(response)
        if data['status'] == 'success':
            return {"detail": {"message": "User authenticated successfully on hostaway", "data":  data}}
        return {"detail": {"message": "Some error occured... ", "data": data}}

    except HTTPException as exc:
        logging.error(f"****some error at hostaway authentication*****{exc}")
        raise exc
    except Exception as e:
        raise HTTPException(status_code = 500, detail=f"Error at hostaway authentication: {str(e)}")

@router.post("/post-data/{params}/{id}/{params2}")
async def post_data(request: Request ,params:str, id: int, params2:str, token: str = Depends(get_token), db: Session = Depends(get_db)):
    try:
        body = await request.json()
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        account = db.query(HostawayAccount).filter(HostawayAccount.user_id == user_id).first()
        if not account:
            raise HTTPException(status_code = 404, detail="Hostaway account not found")
        response = hostaway_post_request(account.hostaway_token, f"{params}/{id}/{params2}", body)
        data = json.loads(response)
        if data['status'] == 'success':
            return {"detail": {"message": "data post successfully..", "data":  data}}
        return {"detail": {"message": "Some error occured at post request.. ", "data": data}}

    except HTTPException as exc:
        logging.error(f"****some error at hostaway post request*****{exc}")
        raise exc
    except Exception as e:
        raise HTTPException(status_code = 500, detail=f"Error at hostaway post request: {str(e)}")

@router.post("/messages/webhook")
async def webhook_messages(request: Request):
    try:
        body = await request.json()
        logging.debug(f"Webhook received: {body}")
        await handle_webhook(body)
        return {"detail": {"message": "new messages received", "received": body}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error at messages webhook: {str(e)}")

@router.post("/reservation/webhook")
async def webhook_reservation(request: Request):
    try:
        body = await request.json()
        logging.debug(f"reservation webhook received: {body}")
        await handle_reservation(body)
        return {"detail": {"message": "new reservation received", "received": body}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error at reservation webhook: {str(e)}")

@router.post("/update-reservation")
async def update_checkin_checkout(request: Request, token: str = Depends(get_token), db: Session = Depends(get_db)):
    try:
        body = await request.json()
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        account = db.query(HostawayAccount).filter(HostawayAccount.user_id == user_id).first()
        if not account:
            raise HTTPException(status_code = 404, detail="Hostaway account not found")
        reservationId = body['id']
        response = hostaway_put_request(account.hostaway_token, f"/reservations/{reservationId}", body)
        data = json.loads(response)
        return  {"detail": {"message": "reservation updated", "received": data}}

    except Exception as e:
        logging.error(f"Error updating check-in/check-out times: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.post("/update-listing")
async def update_ai_info(request: Request, token: str = Depends(get_token), db: Session = Depends(get_db)):
    try:
        body = await request.json()
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        account = db.query(HostawayAccount).filter(HostawayAccount.user_id == user_id).first()
        if not account:
            raise HTTPException(status_code = 404, detail="Hostaway account not found")
        listingId = body['id']
        response = hostaway_put_request(account.hostaway_token, f"/listings/{listingId}", body)
        data = json.loads(response)
        return  {"detail": {"message": "listings updated", "response": data}}

    except Exception as e:
        logging.error(f"Error updating at AI Info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.post("/create-upsell")
async def create_or_update_upsell(upsell_data: UpsellData, token: str = Depends(get_token), db: Session = Depends(get_db)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not upsell_data.name or not upsell_data.detect_upsell_days or not upsell_data.upsell_message or not upsell_data.discount:
            raise HTTPException(status_code=400, detail="Missing required fields")

        if hasattr(upsell_data, 'id') and upsell_data.id:
            existing_upsell = db.query(Upsell).filter(Upsell.id == upsell_data.id, Upsell.user_id == user.id).first()
            if existing_upsell:
                existing_upsell.name = upsell_data.name
                existing_upsell.discount = upsell_data.discount
                existing_upsell.detect_upsell_days = upsell_data.detect_upsell_days
                existing_upsell.upsell_message = upsell_data.upsell_message
                existing_upsell.nights_exist = upsell_data.nights_exist
                existing_upsell.gap_time = upsell_data.gap_time
                db.commit()
                db.refresh(existing_upsell)
                return {"message": "Upsell offer updated successfully", "data": existing_upsell}

        new_upsell = Upsell(name=upsell_data.name, discount=upsell_data.discount,
                            detect_upsell_days=upsell_data.detect_upsell_days,
                            upsell_message=upsell_data.upsell_message, nights_exist=upsell_data.nights_exist, user_id=user.id, gap_time=upsell_data.gap_time)
        db.add(new_upsell)
        db.commit()
        db.refresh(new_upsell)
        return {"message": "Upsell offer created successfully", "data": new_upsell}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update-upsell-status")
async def update_upsell_status(payload: UpsellStatusUpdate, db: Session = Depends(get_db)):
    try:
        upsell = db.query(Upsell).filter(Upsell.id == payload.upsell_id).first()
        if not upsell:
            raise HTTPException(status_code=404, detail="Upsell offer not found")
        upsell.enabled = payload.enabled
        db.commit()
        db.refresh(upsell)
        return {"message": "Upsell status updated successfully", "upsell": upsell}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/get-upsell")
def get_all_upsell(token: str = Depends(get_token), db: Session = Depends(get_db)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        upsell_data = db.query(Upsell).filter(Upsell.user_id == user_id).all()
        return {"message": "Upsell offers retrieved successfully", "data": upsell_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete-upsell/{upsell_id}")
async def delete_upsell(upsell_id: int, token: str = Depends(get_token), db: Session = Depends(get_db)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        upsell = db.query(Upsell).filter(Upsell.id == upsell_id, Upsell.user_id == user.id).first()
        if not upsell:
            raise HTTPException(status_code=404, detail="Upsell offer not found")
        db.delete(upsell)
        db.commit()
        return {"message": "Upsell offer deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create/{params}")
async def post_data(request: Request ,params:str, token: str = Depends(get_token), db: Session = Depends(get_db)):
    try:
        body = await request.json()
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        account = db.query(HostawayAccount).filter(HostawayAccount.user_id == user_id).first()
        if not account:
            raise HTTPException(status_code = 404, detail="Hostaway account not found")
        response = hostaway_post_request(account.hostaway_token, f"{params}", body)
        data = json.loads(response)
        if data['status'] == 'success':
            return {"detail": {"message": "data post successfully..", "data":  data}}
        return {"detail": {"message": "Some error occured at post request.. ", "data": data}}

    except HTTPException as exc:
        logging.error(f"****some error at hostaway post request*****{exc}")
        raise exc
    except Exception as e:
        raise HTTPException(status_code = 500, detail=f"Error at hostaway post request: {str(e)}")

@router.post("/update/{params}/{id}")
async def post_data(request: Request, params:str, id:int, token: str = Depends(get_token), db: Session = Depends(get_db)):
    try:
        body = await request.json()
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        account = db.query(HostawayAccount).filter(HostawayAccount.user_id == user_id).first()
        if not account:
            raise HTTPException(status_code = 404, detail="Hostaway account not found")
        
        # Add force_overbooking parameter when updating reservations
        force_overbooking = False
        if params == "reservations":
            force_overbooking = True
            
        response = hostaway_put_request(account.hostaway_token, f"/{params}/{id}", body, force_overbooking=force_overbooking)
        data = json.loads(response)
        if data['status'] == 'success':
            return {"detail": {"message": "data updated successfully..", "data":  data}}
        return {"detail": {"message": "Some error occured at updated request.. ", "data": data}}

    except HTTPException as exc:
        logging.error(f"****some error at hostaway post request*****{exc}")
        raise exc
    except Exception as e:
        raise HTTPException(status_code = 500, detail=f"Error at hostaway post request: {str(e)}")

@router.post("/ai-issue-detection")
def detect_issues(request: ChatRequest, db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        prompt = request.prompt
        gpt_response = gpt_taskCreation(prompt)
        if gpt_response is None:
            raise HTTPException(status_code=400, detail="Some error occurred. Please try again.")
        logging.info(f"chat gpt response{gpt_response}")
        return {"answer": gpt_response}

    except requests.exceptions.RequestException as req_err:
        logging.error(f"Error at issue detection {req_err}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(req_err)}")

@router.post("/send-email")
def send_task_email(request: EmailRequest, db: Session = Depends(get_db), token: str = Depends(get_token)):
    decode_token = decode_access_token(token)
    user_id = decode_token['sub']
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Not authorized to use this feature")
    return send_email(request.userEmail, request.subject, request.body)

@router.post("/check-and-send-upsells")
async def check_and_send_upsells(debug: bool = False, token: str = Depends(get_token), db: Session = Depends(get_db)):
    try:
        # Convert debug string parameter to actual boolean
        debug = str(debug).lower() == 'true'
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        account = db.query(HostawayAccount).filter(HostawayAccount.user_id == user_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Hostaway account not found")
        
        # Get all active upsells for this user
        upsells = db.query(Upsell).filter(
            Upsell.user_id == user_id,
            Upsell.enabled == True
        ).all()
        
        if not upsells:
            return {"message": "No active upsells found"}
        
        # Get all listings for this user
        listings_response = hostaway_get_request(account.hostaway_token, "listings")
        listings_data = json.loads(listings_response)
        if listings_data['status'] != 'success':
            return {"message": "Failed to fetch listings", "data": listings_data}
        
        # Get reservations
        reservations_response = hostaway_get_request(account.hostaway_token, "reservations")
        reservations_data = json.loads(reservations_response)
        if reservations_data['status'] != 'success':
            return {"message": "Failed to fetch reservations", "data": reservations_data}
        
        if debug:
            # Check reservation statuses
            status_counts = {}
            for r in reservations_data['result']:
                status = r.get('status', 'unknown')
                status_counts[status] = status_counts.get(status, 0) + 1
        
        upsell_opportunities = []
        
        # Find the correct listing ID field name in the reservation data
        reservation_listing_field = None
        if reservations_data['result'] and len(reservations_data['result']) > 0:
            sample_reservation = reservations_data['result'][0]
            
            # Try common field names for listing ID
            possible_field_names = ['listingId', 'listing_id', 'listingMapId', 'propertyId', 'propertyID', 'property_id']
            for field in possible_field_names:
                if field in sample_reservation:
                    reservation_listing_field = field
                    break
        
        if not reservation_listing_field:
            # If we can't find the field, return the first reservation for debugging
            if reservations_data['result'] and len(reservations_data['result']) > 0:
                return {
                    "message": "Could not identify listing ID field in reservation data",
                    "sample_reservation": reservations_data['result'][0]
                }
            else:
                return {"message": "No reservations found"}
        
        # For debugging - print all reservation listing IDs and all listing IDs
        if debug:
            listing_ids = [str(listing['id']) for listing in listings_data['result']]
            reservation_listing_ids = [str(r.get(reservation_listing_field, 'missing')) for r in reservations_data['result']]
        
        # Debug data collection to see what's happening
        all_gaps = []
        
        # FIX: Define the correct date fields
        check_in_field = "arrivalDate"  # Changed from checkInDate
        check_out_field = "departureDate"  # Changed from checkOutDate
        
        # Define valid statuses - include modified and new
        valid_statuses = ['confirmed', 'modified', 'new']
        
        for listing in listings_data['result']:
            listing_id = listing['id']
            
            # Include reservations with the right status
            listing_reservations = [r for r in reservations_data['result'] 
                                  if r.get(reservation_listing_field) is not None and
                                  str(r[reservation_listing_field]) == str(listing_id) and
                                  r.get('status', '').lower() in valid_statuses]
            
            if debug:
                all_reservations = [r for r in reservations_data['result'] 
                               if r.get(reservation_listing_field) is not None and 
                               str(r[reservation_listing_field]) == str(listing_id)]
                
                if all_reservations:
                    statuses = [r.get('status', 'unknown') for r in all_reservations]
            
            # FIX: Use the correct date fields for sorting
            if listing_reservations:
                try:
                    # Sort using the correct date field
                    listing_reservations.sort(key=lambda x: x[check_in_field])
                except Exception as e:
                    continue
            else:
                continue
            
            # Need at least 2 reservations to find gaps
            if len(listing_reservations) < 2:
                continue
            
            # Find gap nights between reservations
            for i in range(len(listing_reservations) - 1):
                # FIX: Use the correct date fields
                current_checkout = listing_reservations[i][check_out_field]
                next_checkin = listing_reservations[i+1][check_in_field]
                
                # Calculate gap nights
                from datetime import datetime
                try:
                    current_checkout_date = datetime.strptime(current_checkout, "%Y-%m-%d")
                    next_checkin_date = datetime.strptime(next_checkin, "%Y-%m-%d")
                    gap_days = (next_checkin_date - current_checkout_date).days
                except Exception as e:
                    continue
                
                # Add to debug collection
                all_gaps.append({
                    "listing_id": listing_id,
                    "current_checkout": current_checkout,
                    "next_checkin": next_checkin,
                    "gap_days": gap_days,
                    "current_guest": listing_reservations[i].get('guestName', 'Guest'),
                    "status": listing_reservations[i].get('status', 'unknown')
                })
                
                if gap_days > 0:
                    # We found a gap
                    current_guest = listing_reservations[i]
                    
                    # Check applicable upsells
                    for upsell in upsells:
                        # Calculate when to send message
                        from datetime import timedelta
                        
                        # FIX: Extract numeric value from strings like "1 days" or "2 days"
                        try:
                            # Handle both integer values and string formats like "1 days"
                            upsell_days = str(upsell.detect_upsell_days)
                            if "days" in upsell_days or "day" in upsell_days:
                                # Extract just the numeric part
                                import re
                                num_match = re.search(r'\d+', upsell_days)
                                if num_match:
                                    detect_days = int(num_match.group())
                                else:
                                    raise ValueError(f"Could not extract number from {upsell_days}")
                            else:
                                # It's already just a number
                                detect_days = int(upsell_days)
                                
                            trigger_date = next_checkin_date - timedelta(days=detect_days)
                            today = datetime.now().date()
                            
                            # Modified: Force create opportunities in debug mode
                            if debug is True or today == trigger_date.date():
                                # In debug mode or today is the day to send the message!
                                upsell_opportunities.append({
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
                        except (ValueError, TypeError) as e:
                            # Skip this upsell if days value is invalid
                            continue
        
        # If debug mode, return helpful information
        if debug:
            return {
                "message": f"Debug mode: {'No ' if not upsell_opportunities else ''}upsell opportunities found",
                "opportunities": upsell_opportunities,
                "gaps_found": all_gaps,
                "upsells_configured": [{"name": u.name, "days_before": u.detect_upsell_days, "discount": u.discount} for u in upsells],
                "today": datetime.now().date().strftime("%Y-%m-%d"),
                "check_in_field": check_in_field,
                "check_out_field": check_out_field
            }
        
        # Send messages for each opportunity
        messages_sent = 0
        for opportunity in upsell_opportunities:
            try:
                # Prepare the message with actual details
                personalized_message = opportunity["message"].format(
                    guest_name=opportunity["guest_name"],
                    discount=opportunity["discount"] + " % ",
                    possible_extend_nights=opportunity["possible_extend_nights"]
                )
                
                # CHANGE: Send via email instead of Hostaway messaging
                guest_email = opportunity["guest_email"]
                subject = f"Special Offer: Extend Your Stay with {opportunity['discount']}% Discount"
                
                # Only send if we have a valid email
                if guest_email and '@' in guest_email:
                    # Use the existing send_email function
                    email_result = send_email(guest_email, subject, personalized_message)
                    
                    if email_result.get("success", False):
                        messages_sent += 1
                else:
                    print(f"----------------Invalid email for guest: {opportunity['guest_name']}")
                    
            except Exception as e:
                print(f"Error sending message: {str(e)}")
                continue
                
        return {
            "message": f"{'DEBUG MODE: ' if debug else ''}Checked for upsell opportunities. Found: {len(upsell_opportunities)}, Messages sent: {messages_sent}",
            "opportunities": upsell_opportunities
        }
    
    except Exception as e:
        logging.error(f"Error in check-and-send-upsells: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing upsells: {str(e)}")
