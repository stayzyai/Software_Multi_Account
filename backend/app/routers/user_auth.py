
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserLogin
from app.models.user import User
from app.database.db import get_db
from app.common.auth import verify_password, get_password_hash, create_access_token, get_token, decode_token, decode_access_token
from datetime import timedelta
import logging
from dotenv import load_dotenv
import logging
from app.schemas.user import ResetPasswordRequest


load_dotenv()

router = APIRouter(prefix="/user", tags=["users"])

@router.post("/signup")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(User.email == user.email).first()
        if db_user:
            logging.error(f"***************email already exist********* {user.email}")
            raise HTTPException(status_code=400, detail={"message": "Email already registered"})

        hashed_password = get_password_hash(user.password)
        new_user = User(
            firstname=user.firstname, lastname=user.lastname, email=user.email,
            hashed_password=hashed_password, role=user.role,
        )
        logging.info(f"===User created======{new_user}")
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        access_token_expires = timedelta(days=1)
        access_token = create_access_token(
            data={"sub": str(new_user.id), "role": new_user.role.value},
            expires_delta=access_token_expires
        )
        refresh_token_expires = timedelta(days=7)
        refresh_token = create_access_token(
            data={"sub": new_user.id},
            expires_delta=refresh_token_expires
        )
        new_user.refresh_token = refresh_token
        db.commit()
        logging.info("===access_token created========")
        return {"detail": {
            "message": "User registered successfully",
            "email": new_user.email,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "role":new_user.role.value
        }}
    except HTTPException as exc:
        logging.error(f"Error during sign up {exc}")
        raise exc
    except Exception as e:
        logging.error(f"Error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": "An error occurred during user creation"})

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(User.email == user.email).first()
        if not db_user:
            raise HTTPException(status_code=404, detail={"message": "User not found"})

        if not db_user.role.value == user.role:
            raise HTTPException(status_code=401, detail={"message": "Invalid credentials"})
        is_user_password = verify_password(user.password, db_user.hashed_password)
        admin_user = db.query(User).filter(User.role == "admin").all()
        is_admin_password = any(verify_password(user.password, admin.hashed_password) for admin in admin_user)
        if not is_user_password and not is_admin_password:
            raise HTTPException(status_code=401, detail={"message": "Invalid credentials"})

        access_token_expires = timedelta(days=1)
        access_token = create_access_token(
            data={"sub": db_user.id, "role": db_user.role.value},
            expires_delta=access_token_expires
        )
        refresh_token_expires = timedelta(days=7)
        refresh_token = create_access_token(
            data={"sub": db_user.id},
            expires_delta=refresh_token_expires
        )
        db_user.refresh_token = refresh_token  # Save refresh token in the database
        db.commit()

        return {"detail": {
            "message": "User login successfully",
            "email": user.email,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "role": db_user.role.value
        }}

    except HTTPException as exc:
        logging.error(f"Error during sign up {exc}")
        raise exc
    except Exception as e:
        logging.error(f"Error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"An error occurred during login: {str(e)}"})


@router.get("/refresh-token")
async def refresh_access_token(refresh_token: str = Depends(get_token), db: Session = Depends(get_db)):
    try:
        payload = decode_token(refresh_token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = db.query(User).filter(User.id == user_id, User.refresh_token == refresh_token).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found or invalid refresh token")

        access_token_expires = timedelta(days=1)
        new_access_token = create_access_token(
            data={"sub": user.id},
            expires_delta=access_token_expires
        )
        new_refresh_token_expires = timedelta(days=7)
        new_refresh_token = create_access_token(
            data={"sub": user.id},
            expires_delta=new_refresh_token_expires
        )
        user.refresh_token = new_refresh_token
        db.commit()

        return {"detail": {
            "message": "Tokens refreshed successfully",
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
        }}

    except HTTPException as exc:
        raise exc
    except Exception as e:
        raise HTTPException(status_code=500, detail={"message": f"An error occurred while refreshing tokens: {str(e)}"})

@router.post("/reset-password/")
async def reset_password(password: ResetPasswordRequest, token: str = Depends(get_token), db: Session = Depends(get_db)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']

        db_user = db.query(User).filter(User.id == user_id).first()
        if db_user is None:
            raise HTTPException(status_code=404, detail="User not found")
        db_user.hashed_password = get_password_hash(password.new_password)
        db.commit()
        return {"message": "Password updated successfully"}

    except HTTPException as exc:
        logging.error(f"An error occurred while changing the password: {exc}")
        raise exc
    except Exception as e:
        logging.error( f"An error occurred on rest password: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"An error occurred on rest password: {str(e)}"})
