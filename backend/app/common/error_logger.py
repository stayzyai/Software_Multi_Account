"""
Simple error logging utility for user-specific errors
"""
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.user import UserError

def log_user_error(
    db: Session,
    user_id: int,
    error_type: str,
    error_message: str,
    endpoint: str = None
):
    """
    Log a user-specific error to the database
    
    Args:
        db: Database session
        user_id: ID of the user who encountered the error
        error_type: Category of error (e.g., "Authentication", "API", "Data Sync")
        error_message: Detailed error message
        endpoint: API endpoint where error occurred (optional)
    """
    try:
        user_error = UserError(
            user_id=user_id,
            error_type=error_type,
            error_message=error_message,
            endpoint=endpoint,
            is_resolved=False
        )
        db.add(user_error)
        db.commit()
        
        # Also log to console for debugging
        print(f"🚨 User Error Logged - User: {user_id}, Type: {error_type}, Message: {error_message}")
        logging.error(f"User Error - User: {user_id}, Type: {error_type}, Message: {error_message}")
        
    except Exception as e:
        # If logging fails, at least print to console
        print(f"❌ Failed to log user error: {str(e)}")
        logging.error(f"Failed to log user error: {str(e)}")

def resolve_user_error(db: Session, error_id: int):
    """
    Mark a user error as resolved
    
    Args:
        db: Database session
        error_id: ID of the error to resolve
    """
    try:
        error = db.query(UserError).filter(UserError.id == error_id).first()
        if error:
            error.is_resolved = True
            error.resolved_at = datetime.utcnow()
            db.commit()
            print(f"✅ User Error Resolved - Error ID: {error_id}")
    except Exception as e:
        print(f"❌ Failed to resolve user error: {str(e)}")
        logging.error(f"Failed to resolve user error: {str(e)}")

def get_user_errors(db: Session, user_id: int, limit: int = 10):
    """
    Get recent errors for a specific user
    
    Args:
        db: Database session
        user_id: ID of the user
        limit: Maximum number of errors to return
        
    Returns:
        List of UserError objects
    """
    try:
        errors = db.query(UserError)\
            .filter(UserError.user_id == user_id)\
            .order_by(UserError.created_at.desc())\
            .limit(limit)\
            .all()
        return errors
    except Exception as e:
        print(f"❌ Failed to get user errors: {str(e)}")
        logging.error(f"Failed to get user errors: {str(e)}")
        return []

