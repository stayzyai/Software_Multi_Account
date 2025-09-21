from fastapi import APIRouter, HTTPException, Depends
from app.schemas.hostaway import HostawayAuthentication, HostawayAccountResponse
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.common.auth import get_token, decode_access_token
from app.models.user import User, HostawayAccount, ChromeExtensionToken
from app.common.hostaway_setup import hostaway_authentication, revoke_hostaway_authentication
from app.common.error_logger import log_user_error
import logging
from datetime import datetime, timedelta
from fastapi.responses import JSONResponse
from typing import List

router = APIRouter(prefix="/hostaway", tags=["hostaway"])

@router.post("/authentication")
def authentication(auth: HostawayAuthentication, db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        logging.info(f"Authentication request received: account_id={auth.account_id}, secret_id={'*' * len(auth.secret_id) if auth.secret_id else 'None'}")
        
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if not auth or not auth.account_id.strip() or not auth.secret_id.strip():
            print(f"🚨 400 Error: Empty account ID or secret ID")
            raise HTTPException(status_code=400, detail={"message": "account ID or client secret cannot be empty"})

        # Check if user already has 3 accounts (max limit)
        existing_accounts_count = db.query(HostawayAccount).filter(HostawayAccount.user_id == user.id, HostawayAccount.is_active == True).count()
        print(f"🚨 Debug: User has {existing_accounts_count} existing accounts")
        if existing_accounts_count >= 3:
            print(f"🚨 400 Error: Maximum of 3 Hostaway accounts allowed")
            raise HTTPException(status_code=400, detail={"message": "Maximum of 3 Hostaway accounts allowed"})

        # Check if account ID is already linked to a different user
        existing_account = db.query(HostawayAccount).filter(HostawayAccount.account_id == str(auth.account_id.strip()), HostawayAccount.user_id != user.id).first()
        if existing_account:
            print(f"🚨 400 Error: Account ID linked to a different email address")
            raise HTTPException(status_code=400, detail={"message": "Account ID linked to a different email address"})

        # Check if this account already exists for this user
        account = db.query(HostawayAccount).filter(HostawayAccount.account_id == str(auth.account_id.strip()), HostawayAccount.user_id == user.id).first()
        if account:
            # Re-authenticate existing account
            logging.info("Re-authenticating existing account")
            response = hostaway_authentication(auth.account_id, auth.secret_id)
            if 'access_token' in response:
                token = response['access_token']
                expires_at = datetime.utcnow() + timedelta(days=730)
                account.hostaway_token = token
                account.expires_at = expires_at
                account.is_active = True
                if auth.account_name:
                    account.account_name = auth.account_name
                db.commit()
                return JSONResponse(content={"detail": {"message": "User reauthenticated successfully on hostaway", "data": response}}, status_code=200)

        # Create new account
        logging.info("Creating new account")
        response = hostaway_authentication(auth.account_id, auth.secret_id)
        if 'access_token' in response:
            token = response['access_token']
            expires_at = datetime.utcnow() + timedelta(days=730)
            
            new_account = HostawayAccount(
                user_id=user.id, 
                account_id=auth.account_id, 
                secret_id=auth.secret_id, 
                hostaway_token=token,
                expires_at=expires_at,
                account_name=auth.account_name or f"Account {existing_accounts_count + 1}",
                is_active=True
            )
            db.add(new_account)
            db.commit()
            db.refresh(new_account)
            return JSONResponse(content={"detail": {"message": "User authenticated successfully on hostaway", "data": response}}, status_code=200)

    except HTTPException as exc:
        print(f"🚨 HTTPException at hostaway authentication: {exc}")
        logging.error(f"****HTTPException at hostaway authentication*****{exc}")
        # Log user-specific error for 400/500 errors
        if exc.status_code >= 400:
            try:
                decode_token = decode_access_token(token)
                user_id = decode_token['sub']
                log_user_error(
                    db=db,
                    user_id=user_id,
                    error_type="Authentication",
                    error_message=f"HTTP {exc.status_code}: {exc.detail}",
                    endpoint="/hostaway/authentication"
                )
            except:
                pass  # Don't let error logging break the main flow
        raise exc
    except Exception as e:
        print(f"🚨 General exception at hostaway authentication: {str(e)}")
        print(f"🚨 Exception type: {type(e).__name__}")
        import traceback
        print(f"🚨 Traceback: {traceback.format_exc()}")
        logging.error(f"****General exception at hostaway authentication*****{str(e)}")
        logging.error(f"Exception type: {type(e).__name__}")
        logging.error(f"Traceback: {traceback.format_exc()}")
        
        # Log user-specific error for general exceptions
        try:
            decode_token = decode_access_token(token)
            user_id = decode_token['sub']
            log_user_error(
                db=db,
                user_id=user_id,
                error_type="Authentication",
                error_message=f"Exception: {type(e).__name__}: {str(e)}",
                endpoint="/hostaway/authentication"
            )
        except:
            pass  # Don't let error logging break the main flow
            
        raise HTTPException(status_code=500, detail=f"Error at hostaway authentication: {str(e)} | Type: {type(e).__name__}")

@router.get("/get-hostaway-accounts")
def get_hostaway_accounts(db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        accounts = db.query(HostawayAccount).filter(HostawayAccount.user_id == user.id, HostawayAccount.is_active == True).all()
        current_time = datetime.now()
        
        if not accounts:
            return JSONResponse(content={"detail": {"valid": False, "message": "No hostaway accounts found", "accounts": []}}, status_code=404)
        
        # Check for expired accounts and filter valid ones
        valid_accounts = []
        for account in accounts:
            if account.expires_at > current_time:
                valid_accounts.append({
                    "id": account.id,
                    "account_id": account.account_id,
                    "secret_id": account.secret_id,
                    "account_name": account.account_name,
                    "is_active": account.is_active,
                    "created_at": account.created_at.isoformat(),
                    "expires_at": account.expires_at.isoformat()
                })
        
        if not valid_accounts:
            return JSONResponse(content={"detail": {"valid": False, "message": "All hostaway tokens expired", "accounts": []}}, status_code=400)
        
        return JSONResponse(content={"detail": {"valid": True, "message": "Hostaway accounts retrieved successfully", "accounts": valid_accounts}}, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error at get hostaway accounts: {str(e)}")

@router.delete("/remove-account/{account_id}")
def remove_account(account_id: int, db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        account = db.query(HostawayAccount).filter(HostawayAccount.id == account_id, HostawayAccount.user_id == user.id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

        # Soft delete by setting is_active to False
        account.is_active = False
        db.commit()
        
        return JSONResponse(content={"detail": {"message": "Account removed successfully"}}, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing account: {str(e)}")

@router.put("/rename-account/{account_id}")
def rename_account(account_id: int, request: dict, db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        account = db.query(HostawayAccount).filter(HostawayAccount.id == account_id, HostawayAccount.user_id == user.id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

        new_name = request.get("account_name", "").strip()
        if not new_name:
            raise HTTPException(status_code=400, detail="Account name cannot be empty")

        account.account_name = new_name
        db.commit()
        
        return JSONResponse(content={"detail": {"message": "Account renamed successfully"}}, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error renaming account: {str(e)}")

# Keep the old endpoint for backward compatibility
@router.get("/get-hostaway-account")
def get_hostaway_account(db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get first active account for backward compatibility
        account = db.query(HostawayAccount).filter(HostawayAccount.user_id == user.id, HostawayAccount.is_active == True).first()
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

# New endpoints for multiple account management

@router.delete("/remove-account/{account_id}")
def remove_specific_account(account_id: int, db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        account = db.query(HostawayAccount).filter(HostawayAccount.id == account_id, HostawayAccount.user_id == user_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        # No primary account logic needed
        
        # Soft delete by setting is_active to False
        account.is_active = False
        db.commit()
        
        return JSONResponse(content={"detail": {"message": "Account removed successfully"}}, status_code=200)
    except HTTPException as exc:
        logging.error(f"****error at remove specific account*****{exc}")
        raise exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error at remove specific account: {str(e)}")

@router.put("/rename-account/{account_id}")
def rename_account(account_id: int, new_name: str, db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        account = db.query(HostawayAccount).filter(HostawayAccount.id == account_id, HostawayAccount.user_id == user_id, HostawayAccount.is_active == True).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        account.account_name = new_name
        db.commit()
        
        return JSONResponse(content={"detail": {"message": "Account renamed successfully"}}, status_code=200)
    except HTTPException as exc:
        logging.error(f"****error at rename account*****{exc}")
        raise exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error at rename account: {str(e)}")
