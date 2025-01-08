from fastapi import APIRouter, HTTPException
import logging
import json
from app.common.hostaway_setup import hostaway_get_request

router = APIRouter(prefix="/hostaway", tags=["hostaway"])

@router.get("/get-details/{params}/{id}")
def get_list(params: str, id: int):
    try:
        token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxMzQwNDAiLCJqdGkiOiJhOTEyYTljYzNlZjMzMzM0MjVjNmM5NDQ4YWQ1NTZmZjhiNDNkNzdjOTBiOWU4YTE0MGVlMWJlYTFhMDI4NmM3MzRhNDdmMzFkNmRjYWFlZiIsImlhdCI6MTczMjE3NTA5MS4xOTc3MDQsIm5iZiI6MTczMjE3NTA5MS4xOTc3MDUsImV4cCI6MjA0NzcwNzg5MS4xOTc3MDksInN1YiI6IiIsInNjb3BlcyI6WyJnZW5lcmFsIl0sInNlY3JldElkIjo1MTA3Nn0.b0nHp73UekTkkKvXreh79HofL3lLFcbz-gUzne3zSPEic6oTLXiq6ASakLmBRZhotX1K19eJse6zRIMadDUOhnUMNCZWfDxP8GD9XFCO_FF5363RtNlZULd_JTHgBHeLiP-6yDcD1D1HFeHthjP7XCnHADHZbMdeHymaRCD0Tws"
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
