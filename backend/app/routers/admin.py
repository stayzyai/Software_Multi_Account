from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.common.auth import get_token, decode_access_token
from app.models.user import User
from app.schemas.user import Role
from app.schemas.admin import UserUpdateSchema
from app.common.user_query import admin_update_user, get_user_statics, get_automated_message_statics, get_ticket_statics
from app.schemas.user import UserDelete
import logging

router = APIRouter(prefix="/admin", tags=["admin"])

@router.delete("/delete-user")
def delete_user(user: UserDelete, db: Session = Depends(get_db), token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']

        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail={"message": "You must be registered as an admin first"})

        if db_user.role.value != Role.admin.value:
            raise HTTPException(status_code=403, detail={"message": "You must be an admin to delete a user"})

        user_to_delete = db.query(User).filter(User.id == user.id).first()
        if not user_to_delete:
            raise HTTPException(status_code=404, detail={"message": "User to delete not found"})

        db.delete(user_to_delete)
        db.commit()
        return {"detail" : {"message": "User deleted successfully"}}

    except HTTPException as exc:
        raise exc

    except Exception as e:
        raise HTTPException(status_code=500, detail={"message": f"An error occurred during user deletion: {str(e)}"})

@router.put("/update-user")
def update_user(
    user_update: UserUpdateSchema,
    db: Session = Depends(get_db),
    token: str = Depends(get_token)
):
    try:
        decode_token = decode_access_token(token)
        current_user_id = decode_token['sub']
        current_user = db.query(User).filter(User.id == current_user_id).first()

        if not current_user:
            raise HTTPException(
                status_code=400,
                detail="Current user not found"
            )
        if current_user.role.value != Role.admin.value:
            raise HTTPException(
                status_code=400,
                detail="You must be an admin to update user"
            )
        user_to_update = db.query(User).filter(User.id == user_update.id).first()

        if not user_to_update:
            raise HTTPException(
                status_code=400,
                detail="User to update not found"
            )

        response = admin_update_user(user_update, user_to_update, db)
        db.commit()
        db.refresh(user_to_update)
        return {"detail": {"message": "User updated successfully", "data": response}}

    except HTTPException as exc:
        raise exc

    except Exception as e:
        logging.info("Error updating user:", str(e))
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")

@router.get("/get-statistics")
def get_statistics(db: Session = Depends(get_db),token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        current_user = db.query(User).filter(User.id == user_id).first()

        if not current_user:
            raise HTTPException(
                status_code=400,
                detail="Current user not found"
            )
        if current_user.role.value != Role.admin.value:
            raise HTTPException(
                status_code=400,
                detail="You must be an admin to update user"
            )
        user_statics = get_user_statics(db)
        ticket_statics = get_ticket_statics(db)
        message_statics = get_automated_message_statics(db)

        return {"DashboardStats" :{
            "automatedMessages": message_statics,
            "users": user_statics,
            "tickets": ticket_statics
        }}

    except HTTPException as exc:
        raise exc
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating user: {str(e)}"
        )
