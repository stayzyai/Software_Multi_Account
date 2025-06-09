from fastapi import APIRouter, HTTPException, Depends
from app.schemas.hostaway import HostawayAuthentication
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.common.auth import get_token, decode_access_token
from app.models.user import User, HostawayAccount, ChromeExtensionToken
from app.common.hostaway_setup import hostaway_authentication, revoke_hostaway_authentication
import logging
from datetime import datetime, timedelta
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/hostaway", tags=["hostaway"])

@router.post("/authentication")
def authentication(auth: HostawayAuthentication, db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if not auth or not auth.account_id.strip() or not auth.secret_id.strip():
            raise HTTPException(status_code=400, detail={"message": "account ID or client secret cannot be empty"})

        exisiting_account = db.query(HostawayAccount).filter(HostawayAccount.account_id == str(auth.account_id.strip()), HostawayAccount.user_id != user.id).first()
        if exisiting_account:
            raise HTTPException(status_code=400, detail={"message": "Account ID linked to a different email address"})

        account = db.query(HostawayAccount).filter(HostawayAccount.account_id == str(auth.account_id.strip())).first()
        if account:
            response = hostaway_authentication(auth.account_id, auth.secret_id)
            if 'access_token' in response:
                token = response['access_token']
                expires_at = datetime.utcnow() + timedelta(days=730)
                account.hostaway_token = token
                account.expires_at = expires_at
                db.commit()
                return JSONResponse(content={"detail": {"message": "User reauthenticated successfully on hostaway", "data": response}}, status_code=200)

        response = hostaway_authentication(auth.account_id, auth.secret_id)
        if 'access_token' in response:
            token = response['access_token']
        expires_at = datetime.utcnow() + timedelta(days=730)
        new_account = HostawayAccount(user_id=user.id, account_id = auth.account_id, secret_id = auth.secret_id, hostaway_token=token,expires_at=expires_at)
        db.add(new_account)
        db.commit()
        db.refresh(new_account)
        return JSONResponse(content={"detail": {"message": "User authenticated successfully on hostaway", "data": response}}, status_code=200)

    except HTTPException as exc:
        logging.error(f"****some error at hostaway authentication*****{exc}")
        raise exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error at hostaway authentication: {str(e)}")

@router.get("/get-hostaway-account")
def get_hostaway_account(db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        account = db.query(HostawayAccount).filter(HostawayAccount.user_id == user.id).first()
        current_time = datetime.now()
        if not account:
            return JSONResponse(content={"detail": {"valid": False, "message": "hostaway account does not exist"}}, status_code=404)
        if account.expires_at <= current_time:
            return JSONResponse(content={"detail": {"valid": False, "message": "hostaway token expired"}}, status_code=400)
        else:
            return JSONResponse(content={"detail": {"id": user_id,  "valid": True, "message": "hostaway token is valid", "data":{"account_id": account.account_id, "secret_id": account.secret_id}}}, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error at get hostaway account: {str(e)}")

@router.delete("/remove-authentication")
def delete_authentication(db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        account = db.query(HostawayAccount).filter(HostawayAccount.user_id == user_id).first()
        chrome_extension = db.query(ChromeExtensionToken).filter(ChromeExtensionToken.user_id == user_id).first()
        # access_token = account.hostaway_token
        if not account:
            raise HTTPException(status_code=400, detail={"message": "hostaway account not found"})
        # response = revoke_hostaway_authentication(access_token)
        db.delete(account)
        if chrome_extension:
            db.delete(chrome_extension)
        db.commit()
        return {"detail": {"message": " Hostaway account has been successfully removed"}}
    except HTTPException as exc:
        logging.error(f"****error at hostaway remove authentication*****{exc}")
        raise exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error at remove hostaway authentication: {str(e)}")
