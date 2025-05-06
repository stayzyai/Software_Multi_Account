from sqlalchemy.orm import Session
from app.schemas.user import UserUpdate, Role
from app.common.auth import get_password_hash
from app.models.user import User
from fastapi import HTTPException
from app.schemas.admin import UserUpdateSchema
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy import and_
from app.common.hostaway_setup import hostaway_get_request
import json

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
            current_user.hashed_password = get_password_hash(user_update.password)
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

def calculate_percentage_change(old, new):
    if old == 0 and new == 0:
        return 0, False
    if old == 0:
        return 100, True
    change = ((new - old) / old) * 100
    return round(change, 2), new > old


def get_all_tasks(all_accounts):
    total_tasks = 0
    previous_count = 0
    recent_count = 0

    try:
        for account in all_accounts:
            token = account.hostaway_token
            user_id = account.user_id
            tasks = []
            try:
                response = hostaway_get_request(token, endpoint="tasks")
                data = json.loads(response)
                if data['status'] == 'success':
                    tasks = data.get("result", [])
                total_tasks += len(tasks)

                now = datetime.now()
                cutoff = now - timedelta(days=30)
                mid_point = cutoff + timedelta(days=15)

                for task in tasks:
                    task_time = task.get("canStartFrom", None)
                    if not task_time:
                        continue
                    try:
                        task_date = datetime.strptime(task_time, "%Y-%m-%d %H:%M:%S")
                    except ValueError:
                        print(f"Invalid datetime format: {task_time}")
                        continue

                    if cutoff <= task_date < mid_point:
                        previous_count += 1
                    elif task_date >= mid_point:
                        recent_count += 1

            except Exception as e:
                print(f"Error fetching tasks for user {user_id}: {e}")
                continue

        percentage_change, is_increase = calculate_percentage_change(previous_count, recent_count)

        return {
            "total_tasks": total_tasks,
            "previous_tasks": previous_count,
            "recent_tasks": recent_count,
            "is_increase": is_increase,
            "percentage_change": f"{round(percentage_change, 1)}%" if percentage_change != "N/A" else "N/A"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating task stats: {str(e)}")
