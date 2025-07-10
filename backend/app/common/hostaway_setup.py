from fastapi import HTTPException
import os
from dotenv import load_dotenv
import logging
import requests
import http.client
import json

load_dotenv()
url = os.getenv('HOSTAWAY_URL')
provider_id=os.getenv('PROVIDER_ID')
provider = f'?&provider={provider_id}'

def hostaway_get_request(token, endpoint, id=None, limit=None, offset=None, includeResources=None, max_retries=3):
    """
    Make a GET request to the Hostaway API with retry logic for transient errors.
    
    Args:
        token: Authentication token
        endpoint: API endpoint to call
        id: Optional ID to append to the endpoint
        limit: Optional limit for pagination
        offset: Optional offset for pagination
        includeResources: Optional parameter to include additional resources
        max_retries: Maximum number of retry attempts (default: 3)
        
    Returns:
        Response text from the API
    """
    retry_count = 0
    last_exception = None
    
    while retry_count < max_retries:
        try:
            hostaway_url = os.getenv('HOSTAWAY_API_URL')
            # Fix the endpoint path - ensure we don't have double slashes
            if endpoint.startswith('/'):
                api_url = f"{hostaway_url}{endpoint}"
            else:
                api_url = f"{hostaway_url}/{endpoint}"
            
            if id:
                api_url = f"{api_url}/{id}"
            
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
            
            # Log the request we're about to make
            logging.info(f"Making Hostaway GET request to: {api_url}")
            logging.debug(f"Hostaway request details - URL: {hostaway_url}, Endpoint: {endpoint}, Final URL: {api_url}")
            api_url = api_url+provider
            # Increase timeout to handle potential slow connections
            response = requests.request(
                "GET", 
                api_url, 
                headers=headers, 
                params=querystring,
                timeout=60,  # 60 second timeout for slow API responses
                verify=True  # Ensure SSL verification is enabled
            )
            
            # Check for HTTP errors
            response.raise_for_status()
            
            # If we get here, the request succeeded
            return response.text
            
        except requests.exceptions.SSLError as ssl_err:
            # Handle SSL errors specifically
            retry_count += 1
            last_exception = ssl_err
            logging.warning(f"SSL Error on attempt {retry_count}/{max_retries}: {str(ssl_err)}")
            
            # Wait a bit longer between retries for SSL issues
            import time
            time.sleep(2 * retry_count)  # Progressive backoff
            
        except requests.exceptions.RequestException as req_err:
            # Handle other request errors
            retry_count += 1
            last_exception = req_err
            logging.warning(f"Request Error on attempt {retry_count}/{max_retries}: {str(req_err)}")
            
            # Wait between retries
            import time
            time.sleep(1 * retry_count)  # Progressive backoff
            
        except Exception as e:
            # For non-request errors, don't retry
            logging.error(f"Error at hostaway get request: {str(e)}")
            raise HTTPException(status_code=500, detail=f"An error occurred at hostaway get request: {str(e)}")
    
    # If we've exhausted all retries
    logging.error(f"Max retries ({max_retries}) exceeded for Hostaway GET request: {str(last_exception)}")
    raise HTTPException(status_code=500, detail=f"An error occurred at hostaway get request after {max_retries} attempts: {str(last_exception)}")

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
                'Authorization': f"Bearer {token}",
                'Content-Type': 'application/json',
                'Cache-control': "no-cache"
        }
        api_url = f"/v1/{endpoint}"
        api_url = api_url+provider
        logging.info("Hostaway url: ", api_url)
        conn.request("POST", api_url, payload, headers)
        res = conn.getresponse()
        data = res.read()
        return data.decode("utf-8")

    except Exception as e:
        logging.error(f"Error at hostaway post request {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred at hostaway post request: {str(e)}")

def hostaway_put_request(token, endpoint, data, id=None, force_overbooking=False):
    try:
        conn = http.client.HTTPSConnection(url)
        payload = json.dumps(data)
        
        # Build the API URL path correctly
        api_url = f"/v1{endpoint}"
        if id:
            api_url = f"{api_url}/{id}"
            
        # Add the forceOverbooking parameter if requested
        # This needs to be part of the request path, not the connection URL
        if force_overbooking:
            api_url = f"{api_url}?forceOverbooking=1"

        headers = {
                'Authorization': f"Bearer {token}",
                'Content-Type': 'application/json',
                'Cache-control': "no-cache"
        }
        
        logging.info(f"Making Hostaway PUT request to: {api_url}")
        
        # The critical change: conn.request passes the full path including query parameters
        api_url = api_url+provider
        logging.info("Hostaway url: ", api_url)
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
        api_url = api_url+provider

        headers = {
                'Authorization': f"Bearer {token}",
                'Content-Type': 'application/json',
                'Cache-control': "no-cache"
        }
        api_url = api_url+provider
        logging.info("Hostaway url: ", api_url)
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
        api_url = api_url+provider
        logging.info("Hostaway url: ", api_url)
        response = requests.request("GET", api_url, headers=headers, params=querystring)
        return response.text
    except Exception as e:
        logging.error(f"Error at hostaway get request {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred at hostaway get request: {str(e)}")
