from fastapi import HTTPException
import os
from dotenv import load_dotenv
import logging
import requests
import http.client
import json

load_dotenv()
url = os.getenv('HOSTAWAY_URL')

def hostaway_get_request(token, endpoint, id=None, limit=None, offset=None, includeResources=None):
    try:
        hostaway_url = os.getenv('HOSTAWAY_API_URL')
        api_url = f"{hostaway_url}/{endpoint}"
        if id:
            api_url = f"{api_url}/{id}"
        # querystring = {"limit": limit, "offset": offset} if limit and offset else None
        querystring = {}
        if limit is not None:
            querystring['limit'] = limit
        if offset is not None and limit is not None:
            querystring['offset'] = offset
        if includeResources is not None:
            querystring['includeResources'] = includeResources

        headers = {
            'Authorization': f"Bearer {token}",
            'Cache-control': "no-cache",
            }
        response = requests.request("GET", api_url, headers=headers, params=querystring)
        return response.text
    except Exception as e:
        logging.error(f"Error at hostaway get request {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred at hostaway get request: {str(e)}")

def hostaway_authentication(account_id, secret_id):
    try:
        hostaway_account_id = account_id
        client_secret = secret_id
        conn = http.client.HTTPSConnection(url)
        payload = f"grant_type=client_credentials&client_id={hostaway_account_id}&client_secret={client_secret}&scope=general"
        headers = {
            'Content-type': "application/x-www-form-urlencoded",
            'Cache-control': "no-cache"
            }
        conn.request("POST", "/v1/accessTokens", payload, headers)
        res = conn.getresponse()
        data = res.read()
        decoded_response =  json.loads(data.decode("utf-8"))

        if "token_type" in decoded_response and decoded_response["token_type"] == "Bearer":
            return decoded_response

        if "error" in decoded_response:
            raise HTTPException(status_code=400, detail=decoded_response)

    except HTTPException as exc:
        logging.error(f"Error during authentication{exc}")
        raise exc
    except Exception as e:
        logging.error(f"Error at creating hostaway auth token {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred while creating hostaway auth token: {str(e)}")

def revoke_hostaway_authentication(token):
    try:
        conn = http.client.HTTPSConnection(url)
        payload = ""
        revoke_url = f"/v1/accessTokens?token={token}"

        headers = {
            'Content-type': "application/x-www-form-urlencoded",
            'Cache-control': "no-cache"
            }
        conn.request("DELETE", revoke_url, payload, headers)

        res = conn.getresponse()
        data = res.read()
        decoded_response = data.decode("utf-8")

        response_json = json.loads(decoded_response)
        if response_json.get("status") == "fail":
            logging.error(f"Failed to revoke token: {response_json.get('message')}")
            raise HTTPException(status_code=403, detail=response_json)
        return response_json
    except HTTPException as exc:
        logging.error(f"Error during revoke authentication{exc}")
        raise exc
    except Exception as e:
        logging.error(f"Error at deleteing hostaway auth token {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred while deleteing hostaway auth token: {str(e)}")

def hostaway_post_request(token, endpoint, data):
    try:
        conn = http.client.HTTPSConnection(url)
        payload = json.dumps(data)
        headers = {
                'authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
        }
        api_url = f"/v1/{endpoint}"
        conn.request("POST", api_url, payload, headers)
        res = conn.getresponse()
        data = res.read()
        return data.decode("utf-8")

    except Exception as e:
        logging.error(f"Error at hostaway post request {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred at hostaway post request: {str(e)}")

def hostaway_put_request(token, endpoint, data, id=None):
    try:
        conn = http.client.HTTPSConnection(url)
        payload = json.dumps(data)
        api_url = f"/v1{endpoint}"
        if id:
            api_url = f"{api_url}/{id}"

        headers = {
                'authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
                'Cache-control': "no-cache"
        }
        conn.request("PUT", api_url, payload, headers)
        res = conn.getresponse()
        data = res.read()
        return data.decode("utf-8")

    except Exception as e:
        logging.error(f"Error at hostaway put request {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred at hostaway put request: {str(e)}")

def hostaway_delete_request(token, endpoint, id=None):
    try:
        conn = http.client.HTTPSConnection(url)
        api_url = f"/v1{endpoint}"
        if id:
            api_url = f"{api_url}/{id}"
        api_url = api_url+"&provider=stayzy"

        headers = {
                'authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
                'Cache-control': "no-cache"
        }
        conn.request("DELETE", api_url, headers)
        res = conn.getresponse()
        data = res.read()
        return data.decode("utf-8")

    except Exception as e:
        logging.error(f"Error at hostaway delete request {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred at hostaway delete request: {str(e)}")


def hostaway_get_list_request(token, endpoint, lastEndpoint, id=None):
    try:
        hostaway_url = os.getenv('HOSTAWAY_API_URL')
        api_url = f"{hostaway_url}/{endpoint}/{id}/{lastEndpoint}"
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
