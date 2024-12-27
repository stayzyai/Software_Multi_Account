from sqlalchemy.orm import Session
from app.schemas.user import UserUpdate, Role
from app.common.auth import get_password_hash
from app.models.user import User
from fastapi import HTTPException
from app.schemas.admin import UserUpdateSchema
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy import and_

def update_user_details(current_user: User, user_update: UserUpdate, db: Session):
    try:
        if user_update.email is not None:
            existing_user = db.query(User).filter(
                User.email == user_update.email,
                User.id != user_update.id
            ).first()
            if existing_user:
                raise HTTPException(
                    status_code=400,
                    detail="Email is already in use by another user."
                )
            current_user.email = user_update.email
        if user_update.firstname is not None:
            current_user.firstname = user_update.firstname
        if user_update.lastname is not None:
            current_user.lastname = user_update.lastname
        if user_update.password is not None:
            current_user.password = get_password_hash(user_update.password)
        return user_update

    except HTTPException as e:
        raise e

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while updating user details: {str(e)}"
        )

def admin_update_user(user_update: UserUpdateSchema, user_to_update: User, db: Session):
    try:
        if user_update.email is not None:
            existing_user = db.query(User).filter(
                User.email == user_update.email,
                User.id != user_to_update.id
            ).first()

            if existing_user:
                raise HTTPException(
                    status_code=400,
                    detail="Email is already in use by another user."
                )
            user_to_update.email = user_update.email

        if user_update.firstname is not None:
            user_to_update.firstname = user_update.firstname

        if user_update.lastname is not None:
            user_to_update.lastname = user_update.lastname

        if user_update.password is not None:
            user_to_update.hashed_password = get_password_hash(user_update.password)

        return user_to_update

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while updating user details: {str(e)}"
        )

def get_user_statics(db: Session):
    try:
        current_count = db.query(func.count(User.id)).filter(User.role != Role.admin).scalar()
        one_week_ago = datetime.utcnow() - timedelta(weeks=1)
        count_one_week_ago = db.query(func.count(User.id)).filter(and_(User.created_at <= one_week_ago, User.role != Role.admin)).scalar()
        if count_one_week_ago == 0:
            percentage_change = 100.0
        else:
            percentage_change = round(((current_count - count_one_week_ago) / count_one_week_ago) * 100, 2)
        is_increase = current_count > count_one_week_ago
        return {
                "current_count": current_count,
                "percentage_change": percentage_change,
                "is_increase": is_increase,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while fetching user statics: {str(e)}"
        )

def get_ticket_statics(db: Session):
    try:
        return {
        "current_count": 786,
        "percentage_change": 12,
        "is_increase": True,
    }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while fetching ticket statics: {str(e)}"
        )

def get_automated_message_statics(db: Session):
    try:
        return {
        "current_count": 786,
        "percentage_change": 12,
        "is_increase": False,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while fetching message statics: {str(e)}"
        )

def get_user_id_by_email(email: str, db: Session):
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        return user.id
    except HTTPException as exc:
        raise exc
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while fetching user id: {str(e)}"
        )
