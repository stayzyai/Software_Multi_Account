from fastapi import APIRouter, HTTPException, Depends
import logging
import json
from app.common.hostaway_setup import hostaway_get_request
import os
from sqlalchemy.orm import Session
from app.common.auth import get_hostaway_key
from app.database.db import get_db
from app.models.user import ChromeExtensionToken, HostawayAccount

router = APIRouter(prefix="/hostaway", tags=["hostaway"])

@router.get("/get-details/{params}/{id}")
def get_list(params: str, id: int,  db: Session = Depends(get_db), key: str = Depends(get_hostaway_key)):
    try:
        token_record = db.query(ChromeExtensionToken).filter(ChromeExtensionToken.key == key).first()
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
