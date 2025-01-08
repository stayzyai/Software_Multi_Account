from fastapi import HTTPException
import os
from dotenv import load_dotenv
import logging
import requests

load_dotenv()
url = os.getenv('HOSTAWAY_URL')

def hostaway_get_request(token, endpoint, id=None):
    try:
        hostaway_url = os.getenv('HOSTAWAY_API_URL')
        api_url = f"{hostaway_url}/{endpoint}"
        if id:
            api_url = f"{api_url}/{id}"
        querystring = None
        headers = {
            'Authorization': f"Bearer {token}",
            'Cache-control': "no-cache",
            }
        response = requests.request("GET", api_url, headers=headers, params=querystring)
        return response.text
    except Exception as e:
        logging.error(f"Error at hostaway get request {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred at hostaway get request: {str(e)}")
