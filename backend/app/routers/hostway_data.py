from fastapi import APIRouter, HTTPException, Depends, Request
import logging
import json
from app.common.hostaway_setup import hostaway_get_request, hostaway_post_request
from sqlalchemy.orm import Session
from app.common.auth import get_hostaway_key
from app.database.db import get_db
from app.models.user import ChromeExtensionToken, HostawayAccount
from app.common.auth import get_token
from app.common.auth import decode_access_token
from app.websocket import handle_webhook, handle_reservation

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
def get_all_list(params:str, token: str = Depends(get_token), db: Session = Depends(get_db)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        account = db.query(HostawayAccount).filter(HostawayAccount.user_id == user_id).first()
        if not account:
            raise HTTPException(status_code = 404, detail="Hostaway account not found")
        response = hostaway_get_request(account.hostaway_token, params)
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
