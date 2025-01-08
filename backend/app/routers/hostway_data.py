from fastapi import APIRouter, HTTPException
import logging
import json
from app.common.hostaway_setup import hostaway_get_request
import os
router = APIRouter(prefix="/hostaway", tags=["hostaway"])

@router.get("/get-details/{params}/{id}")
def get_list(params: str, id: int):
    try:
        token = os.getenv("TEMP_HOST_TOKEN")
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
