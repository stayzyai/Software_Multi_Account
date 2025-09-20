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
        print(f"📤 Starting message send request: params={params}, id={id}, params2={params2}")
        
        # Step 1: Parse request body
        try:
            body = await request.json()
            print(f"📤 Request body parsed: {body}")
        except Exception as parse_error:
            print(f"❌ Error parsing request body: {parse_error}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON in request body: {str(parse_error)}")
        
        # Step 2: Decode token
        try:
            decode_token = decode_access_token(token)
            user_id = decode_token['sub']
            print(f"👤 User ID from token: {user_id}")
        except Exception as token_error:
            print(f"❌ Error decoding token: {token_error}")
            raise HTTPException(status_code=401, detail=f"Token validation failed: {str(token_error)}")
        
        # Step 3: Get Hostaway account
        try:
            account = db.query(HostawayAccount).filter(HostawayAccount.user_id == user_id).first()
            if not account:
                print(f"❌ Hostaway account not found for user {user_id}")
                raise HTTPException(status_code=404, detail="Hostaway account not found")
            print(f"✅ Hostaway account found: {account.account_id}")
        except Exception as db_error:
            print(f"❌ Database error: {db_error}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")
        
        # Step 4: Make Hostaway API call
        try:
            print(f"🌐 Making Hostaway API call to: {params}/{id}/{params2}")
            response = hostaway_post_request(account.hostaway_token, f"{params}/{id}/{params2}", body)
            print(f"📨 Raw Hostaway response: {response}")
            
            data = json.loads(response)
            print(f"📨 Parsed Hostaway response: {data}")
            
            if data.get('status') == 'success':
                return {"detail": {"message": "data post successfully..", "data": data}}
            else:
                return {"detail": {"message": "Some error occurred at post request.. ", "data": data}}
                
        except Exception as hostaway_error:
            print(f"❌ Hostaway API error: {hostaway_error}")
            raise HTTPException(status_code=500, detail=f"Hostaway API error: {str(hostaway_error)}")

    except HTTPException as exc:
        print(f"❌ HTTP Exception in post_data: {exc}")
        logging.error(f"****some error at hostaway post request*****{exc}")
        raise exc
    except Exception as e:
        print(f"❌ General Exception in post_data: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.post("/messages/webhook")
async def webhook_messages(request: Request):
    try:
        body = await request.json()
        print(f"📨 Webhook endpoint received: {body}")
        logging.debug(f"Webhook received: {body}")
        await handle_webhook(body)
        return {"detail": {"message": "new messages received", "received": body}}
    except Exception as e:
        print(f"❌ Webhook error: {e}")
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

@router.get("/debug/ai-status/{conversation_id}")
async def debug_ai_status(conversation_id: int, db: Session = Depends(get_db)):
    try:
        from app.service.ai_enable import chack_ai_enable, check_ai_status
        from app.models.user import HostawayAccount, ChatAIStatus
        
        # Get all accounts to test
        accounts = db.query(HostawayAccount).all()
        print(f"🔍 Found {len(accounts)} Hostaway accounts")
        
        results = []
        for account in accounts:
            test_message = {
                "accountId": account.account_id,
                "conversationId": conversation_id,
                "body": "test message"
            }
            
            user_id = chack_ai_enable(test_message, db)
            if user_id:
                is_ai_enabled = check_ai_status(user_id, conversation_id, db)
                ai_status = db.query(ChatAIStatus).filter(
                    ChatAIStatus.user_id == user_id, 
                    ChatAIStatus.chat_id == conversation_id
                ).first()
                
                results.append({
                    "account_id": account.account_id,
                    "user_id": user_id,
                    "ai_enabled": is_ai_enabled,
                    "ai_status_record": {
                        "exists": ai_status is not None,
                        "ai_enabled": ai_status.ai_enabled if ai_status else None,
                        "is_active": ai_status.is_active if ai_status else None
                    }
                })
        
        return {"conversation_id": conversation_id, "results": results}
    except Exception as e:
        print(f"❌ Debug AI status error: {e}")
        return {"error": str(e)}

@router.post("/debug/trigger-ai")
async def debug_trigger_ai(request: Request, db: Session = Depends(get_db)):
    try:
        from app.websocket import handle_webhook
        
        body = await request.json()
        print(f"🧪 Manual AI trigger test: {body}")
        
        result = await handle_webhook(body)
        print(f"🧪 Manual AI trigger result: {result}")
        
        return {"message": "AI trigger test completed", "result": result}
    except Exception as e:
        print(f"❌ Debug trigger AI error: {e}")
        return {"error": str(e)}

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

