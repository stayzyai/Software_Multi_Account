import os
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.common.auth import get_token, decode_access_token
from app.models.user import User, HostawayAccount, UserError
from app.schemas.user import Role
from app.schemas.admin import UserUpdateSchema
from app.common.user_query import admin_update_user, get_user_statics, get_all_tasks
from app.schemas.user import UserDelete
import logging
from app.common.send_email import send_email
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

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

        return {"user_statics" : user_statics }

    except HTTPException as exc:
        raise exc
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating user: {str(e)}"
        )

@router.get("/get-all-tickets")
def get_all_tickets(db: Session = Depends(get_db), token: str = Depends(get_token)):
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
                detail="You must be an admin to get all tickets"
            )
        all_hostaway_accounts = db.query(HostawayAccount).all()
        if not all_hostaway_accounts:
            raise HTTPException(
                status_code=404,
                detail="No hostaway accounts found"
            )
        
        ticket_statics = get_all_tasks(all_hostaway_accounts)
        return {"task_status": ticket_statics}

    except HTTPException as exc:
        raise exc
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating user: {str(e)}"
        )

@router.get("/user-errors/{user_id}")
def get_user_errors(user_id: int, db: Session = Depends(get_db), token: str = Depends(get_token)):
    """
    Get recent errors for a specific user (Admin only)
    """
    try:
        decode_token = decode_access_token(token)
        admin_user_id = decode_token['sub']
        admin_user = db.query(User).filter(User.id == admin_user_id).first()

        if not admin_user:
            raise HTTPException(status_code=404, detail="Admin user not found")

        if admin_user.role.value != Role.admin.value:
            raise HTTPException(status_code=403, detail="Admin access required")

        # Verify the target user exists
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="Target user not found")

        # Get recent errors for the user (last 20 errors)
        errors = db.query(UserError)\
            .filter(UserError.user_id == user_id)\
            .order_by(UserError.created_at.desc())\
            .limit(20)\
            .all()

        # Format errors for response
        error_list = []
        for error in errors:
            error_list.append({
                "id": error.id,
                "error_type": error.error_type,
                "error_message": error.error_message,
                "endpoint": error.endpoint,
                "is_resolved": error.is_resolved,
                "created_at": error.created_at.isoformat(),
                "resolved_at": error.resolved_at.isoformat() if error.resolved_at else None
            })

        return {
            "detail": {
                "user_id": user_id,
                "user_name": f"{target_user.firstname} {target_user.lastname}",
                "user_email": target_user.email,
                "errors": error_list,
                "total_errors": len(error_list),
                "unresolved_errors": len([e for e in error_list if not e["is_resolved"]]),
                "status": "All Good ✅" if len(error_list) == 0 else f"{len([e for e in error_list if not e['is_resolved']])} unresolved issues"
            }
        }

    except HTTPException as exc:
        raise exc
    except Exception as e:
        logging.error(f"Error getting user errors: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting user errors: {str(e)}")

@router.post("/resolve-error/{error_id}")
def resolve_user_error(error_id: int, db: Session = Depends(get_db), token: str = Depends(get_token)):
    """
    Mark a user error as resolved (Admin only)
    """
    try:
        decode_token = decode_access_token(token)
        admin_user_id = decode_token['sub']
        admin_user = db.query(User).filter(User.id == admin_user_id).first()

        if not admin_user:
            raise HTTPException(status_code=404, detail="Admin user not found")

        if admin_user.role.value != Role.admin.value:
            raise HTTPException(status_code=403, detail="Admin access required")

        # Find the error
        error = db.query(UserError).filter(UserError.id == error_id).first()
        if not error:
            raise HTTPException(status_code=404, detail="Error not found")

        # Mark as resolved
        error.is_resolved = True
        error.resolved_at = datetime.utcnow()
        db.commit()

        return {"detail": {"message": f"Error {error_id} marked as resolved"}}

    except HTTPException as exc:
        raise exc
    except Exception as e:
        logging.error(f"Error resolving user error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error resolving user error: {str(e)}")

@router.post("/report-issue")
async def report_issue(report: Request, db: Session = Depends(get_db),token: str = Depends(get_token)):
    try:
        decode_token = decode_access_token(token)
        user_id = decode_token['sub']
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        report_data = await report.json()
        subject = report_data.get("subject", "No Subject")
        message = report_data.get("message", "No Message")
        email=os.getenv("REPORT_EMAIL")
        return send_email(email, subject, message)
    except HTTPException as exc:
        logging.error(f"HTTPException: {exc.detail}")
        raise HTTPException(status_code=500, detail="Something went wrong")
