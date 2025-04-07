from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from app.schemas.user import UserUpdate, ChangePasswordRequest, UserProfile, ChatRequest
from app.models.user import User, ChromeExtensionToken, Subscription, ChatAIStatus
from app.service.chat_service import get_current_user, get_user_subscription, update_ai_status, get_active_ai_chats
from app.database.db import get_db
from app.common.auth import verify_password, get_password_hash, decode_access_token, get_token, get_hostaway_key
from app.common.user_query import update_user_details
from app.schemas.user import Role
from app.schemas.admin import UserList, UsersDetailResponse, UserResponse
from sqlalchemy import and_
import requests
import logging
from app.common.chat_query import store_chat
from app.common.chat_gpt_assistant import get_latest_model_id
from dotenv import load_dotenv
from typing import Optional
import requests
import logging
from app.common.open_ai import get_gpt_response, nearby_spots_gpt_response
import uuid
from sqlalchemy.exc import NoResultFound
import os
import httpx
from app.common.chat_query import haversine_distance
from datetime import datetime
import threading
load_dotenv()

router = APIRouter(prefix="/user", tags=["users"])

@router.post("/update")
def update_user(user: UserUpdate, db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        existing_user = db.query(User).filter(User.id == user.id).first()
        if not existing_user:
            raise HTTPException(status_code=404, detail="User not found")

        if existing_user.role.value == Role.admin.value:    
            user_details = db.query(User).filter(User.id == user.id).first()
            if not user_details:
                raise HTTPException(status_code=404, detail="User not found")
            updated_details = update_user_details(user_details, user, db)
        else:
            updated_details = update_user_details(existing_user, user, db)
        db.commit()
        logging.error(f"************user updated********{updated_details}")
        return {"detail": {"message": "User updated successfully", "data": updated_details}}

    except HTTPException as exc:
        logging.error(f"************Error at update user********{exc}")
        raise exc

    except Exception as e:
        logging.error(f"************Error updating user********{str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error updating user: {str(e)}")

@router.get("/all-users", response_model=UsersDetailResponse)
def get_all_users(db: Session = Depends(get_db), token: str = Depends(get_token), page: int = Query(default=1, ge=1), page_size: int = Query(default=10, ge=1)
):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']

        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail={"message": "You must be registered as an admin first"})

        if db_user.role.value != Role.admin.value:
            raise HTTPException(status_code=403, detail={"message": "You must be an admin to view all users"})

        offset = (page - 1) * page_size
        users = db.query(User).filter(User.role != Role.admin).order_by(User.created_at.desc()).offset(offset).limit(page_size).all()
        total_count = db.query(User).filter(User.role != Role.admin).count()

        response = UsersDetailResponse(detail=UserResponse(message="User fetched successfully...", data=[UserList(id=user.id, firstname=user.firstname, 
                        lastname=user.lastname, email=user.email, role=user.role, created_at=user.created_at)for user in users],total_count=total_count))
        return response

    except HTTPException as exc:
        logging.error(f"*****An error occurred while retrieving users********{exc}")
        raise exc
    except Exception as e:
        logging.error(f"*****An error occurred while retrieving users********{exc}")
        raise HTTPException(status_code=500, detail={"message": f"An error occurred while retrieving users: {str(e)}"})

@router.put("/change-password")
def change_password(change_password_request: ChangePasswordRequest, db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']

        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail={"message": "User not found"})

        if db_user.role.value == Role.admin.value:
            user_details = db.query(User).filter(User.email == change_password_request.email).first()
            logging.error(f"*****user not found********{db_user}")
            if not user_details:
                raise HTTPException(status_code=404, detail="User not found")
            if not verify_password(change_password_request.current_password, user_details.hashed_password):
                raise HTTPException(status_code=401, detail={"message": "Current password is incorrect"})
            if verify_password(change_password_request.new_password, user_details.hashed_password):
                raise HTTPException(status_code=401, detail={"message": "Current password matches the old password"})
            user_details.hashed_password = get_password_hash(change_password_request.new_password)
            db.commit()
            logging.info(f"*****Password changed successfully********")
            return {"details": {"message": "Password changed successfully",}}
        else:
            if not verify_password(change_password_request.current_password, db_user.hashed_password):
                raise HTTPException(status_code=401, detail={"message": "Current password is incorrect"})
            if  verify_password(change_password_request.new_password, db_user.hashed_password):
                raise HTTPException(status_code=401, detail={"message": "Current password matches the old password"})
            db_user.hashed_password = get_password_hash(change_password_request.new_password)
            db.commit()
            return {"details": {"message": "Password changed successfully"}}

    except HTTPException as exc:
        logging.error(f"*****Error at change password*****{exc}")
        raise exc
    except Exception as e:
        logging.error(f"An error occurred while changing the password: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"An error occurred while changing the password: {str(e)}"})

@router.get("/profile", response_model=UserProfile)
def get_user_profile(db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']

        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail={"message": "User not found"})
        subscribed_user = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        is_premium_member = subscribed_user.is_active if subscribed_user else False
        ai_enable_list = db.query(ChatAIStatus).filter(ChatAIStatus.user_id == user_id, ChatAIStatus.ai_enabled == True).all()
        return UserProfile(id=db_user.id, firstname=db_user.firstname, lastname=db_user.lastname, email=db_user.email, role=db_user.role,
            created_at=db_user.created_at, ai_enable=is_premium_member, chat_list=ai_enable_list)

    except HTTPException as exc:
        logging.error(f"An error occurred while changing the password: {exc}")
        raise exc
    except Exception as e:
        logging.error(f"An error occurred while retrieving user profile: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"An error occurred while retrieving user profile: {str(e)}"})


@router.post("/ai-suggestion")
def chat_with_gpt(request: ChatRequest, db: Session = Depends(get_db), key: str = Depends(get_hostaway_key)):
    try:
        token_record = db.query(ChromeExtensionToken).filter(ChromeExtensionToken.key == key).first()
        if token_record is None:
            decode_token = decode_access_token(key)
            user_id = decode_token['sub']
            if user_id is None:
                raise HTTPException(status_code=404, detail="User ID not found in token")
            token_record = True
        if token_record is None:
            raise HTTPException(status_code=404, detail="extension key not found")
        model_id = get_latest_model_id()
        prompt = request.prompt
        if request.messsages is None:
            request.messsages = ""
        gpt_response = get_gpt_response(model_id, prompt, request.messsages)
        if gpt_response is None:
            raise HTTPException(status_code=400, detail="Some error occurred. Please try again.")
        logging.info(f"chat gpt response{gpt_response}")
        interaction_data = {
                "prompt": request.messsages,
                "completion": gpt_response
                }
        # Run store_chat in a separate thread
        threading.Thread(target=store_chat, args=(interaction_data,), daemon=True).start()
        
        # Return response immediately
        return {"model": model_id, "answer": gpt_response}

    except requests.exceptions.RequestException as req_err:
        logging.error(f"Error at chat {req_err}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(req_err)}")

@router.get("/genrate-extension-key")
def genrate_extension_key(token: str = Depends(get_token), db: Session = Depends(get_db)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        db_user = db.query(User).filter(User.id == user_id).first()
        if db_user is None:
            raise HTTPException(status_code=404, detail="User not found")
        user_token = db.query(ChromeExtensionToken).filter(ChromeExtensionToken.user_id==user_id).first()
        key = uuid.uuid4()
        if user_token:
            user_token.key = key
            db.commit()
            return {"detail": {"message": "Key genrated successfully", "key": key}}
        new_key = ChromeExtensionToken(key=key, user_id=user_id)
        db.add(new_key)
        db.commit()
        return {"detail": {"message": "Key genrated successfully", "key": key}}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"message": f"An error occurred at genrate token: {str(e)}"})

@router.get("/get-extension-key")
def get_extension_key(token: str = Depends(get_token), db: Session = Depends(get_db)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        db_user = db.query(User).filter(User.id == user_id).first()
        if db_user is None:
            raise HTTPException(status_code=404, detail="User not found")
        user_token = db.query(ChromeExtensionToken).filter(ChromeExtensionToken.user_id==user_id).first()
        if user_token:
            return {"detail": {"message": "Key fetched successfully", "key": user_token.key}}
        return {"detail": {"message": "Key not found", "key": user_token}}
    except Exception as e:
        logging.error(f"Error at get extension key {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"An error occurred at get token: {str(e)}"})

@router.get("/validate-extension-token")
def validate_token(key: str, db: Session = Depends(get_db)):
    try:
        token_record = db.query(ChromeExtensionToken).filter(ChromeExtensionToken.key == key.strip()).first()
        if token_record:
            return {"detail": {"message": "Token is valid", "status": True}}
        else:
            return {"detail": {"message": "Token is invalid", "status": False}}
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Token not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail={"message": f"An error occurred: {str(e)}"})

@router.post("/nearby-places")
async def get_nearby_places(request: Request, token: str = Depends(get_token), db: Session = Depends(get_db)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        db_user = db.query(User).filter(User.id == user_id).first()
        if db_user is None:
            raise HTTPException(status_code=404, detail="User not found")
        GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
        MAP_URL = os.getenv("MAP_URL")
        body = await request.json()
        lat, lng = body.get("lat"), body.get("lng")
        place_types = ["restaurant", "shopping_mall", "park", "tourist_attraction"]
        all_results = {}
        async with httpx.AsyncClient() as client:
            for place_type in place_types:
                params = {"location": f"{lat},{lng}", "radius": 500,
                    "type": place_type,
                    "key": GOOGLE_MAPS_API_KEY
                }
                response = await client.get(MAP_URL, params=params)
                data = response.json()
                if "results" in data:
                    all_results[place_type] = [
                        { "name": place["name"],
                            "address": place.get("vicinity", "N/A"),
                            "distance_meter": round(
                                haversine_distance(lat, lng,
                                    place["geometry"]["location"]["lat"],
                                    place["geometry"]["location"]["lng"]
                                ), 2
                            )
                        } for place in data["results"][:2]
                    ]
        nearby_spots = nearby_spots_gpt_response(all_results)
        return {"results": nearby_spots}

    except Exception as e:
        logging.error(f"Error at get near places {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching nearby places: {str(e)}")



@router.get("/update-ai", response_model=UserProfile)
def get_user_profile(
    chatId: int = Query(..., description="Chat Id is for auto mode"),
    listingId: int = Query(..., description="Listing Id is for auto mode"),
    db: Session = Depends(get_db),
    token: str = Depends(get_token)
):
    try:
        db_user = get_current_user(db, token)
        subscription = get_user_subscription(db, db_user.id, listingId)
        is_premium_member = update_ai_status(db, db_user.id, chatId, listingId, subscription)
        active_ai_chats = get_active_ai_chats(db, db_user.id)

        return UserProfile(
            id=db_user.id,
            firstname=db_user.firstname,
            lastname=db_user.lastname,
            email=db_user.email,
            role=db_user.role,
            created_at=db_user.created_at,
            ai_enable=is_premium_member,
            chat_list=active_ai_chats
        )

    except Exception as e:
        print(f"Error at get user profile: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": str(e)})