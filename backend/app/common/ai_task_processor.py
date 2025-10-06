import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.common.open_ai import get_gpt_response
import json
import re

async def process_whatsapp_response(
    from_number: str,
    message_body: str,
    media_url: str,
    user_id: int,
    db: Session
) -> Dict[str, Any]:
    """Process incoming WhatsApp response and update task status accordingly"""
    try:
        # Find the staff member by phone number
        staff_member = find_staff_by_phone(from_number, db)
        if not staff_member:
            logging.warning(f"No staff member found with phone number: {from_number}")
            return {"success": False, "error": "Staff member not found"}
        
        # Find active tasks assigned to this staff member
        active_tasks = find_active_tasks_for_staff(staff_member["id"], db)
        if not active_tasks:
            logging.warning(f"No active tasks found for staff member: {staff_member['id']}")
            return {"success": False, "error": "No active tasks found"}
        
        # Use AI to analyze the response
        ai_analysis = analyze_task_response(message_body, media_url, active_tasks)
        
        if not ai_analysis.get("success"):
            return {"success": False, "error": ai_analysis.get("error")}
        
        # Update task status based on AI analysis
        task_id = ai_analysis.get("task_id")
        action = ai_analysis.get("action")  # "accepted" or "completed"
        
        if action == "accepted":
            result = update_task_status(task_id, "confirmed", db)
        elif action == "completed":
            result = update_task_status(task_id, "completed", db)
            # If there's a media URL, upload it to Hostaway task attachments
            if media_url:
                upload_media_to_task(task_id, media_url, user_id, db)
        else:
            return {"success": False, "error": "Could not determine action from response"}
        
        if result.get("success"):
            logging.info(f"Successfully updated task {task_id} to {action}")
            return {"success": True, "task_id": task_id, "action": action}
        else:
            return {"success": False, "error": result.get("error")}
            
    except Exception as e:
        logging.error(f"Error processing WhatsApp response: {e}")
        return {"success": False, "error": str(e)}

def find_staff_by_phone(phone_number: str, db: Session) -> Optional[Dict[str, Any]]:
    """Find staff member by phone number"""
    try:
        # This would need to be implemented based on your staff data structure
        # For now, returning a mock structure
        # You'll need to query your actual staff/users table
        
        # Clean phone number (remove + and any formatting)
        clean_phone = re.sub(r'[^\d]', '', phone_number)
        
        # Query users table for matching phone
        # Assuming you have a phone field in your User model
        # user = db.query(User).filter(User.phone == clean_phone).first()
        # if user:
        #     return {"id": user.id, "name": f"{user.firstname} {user.lastname}", "phone": user.phone}
        
        # For now, return None - you'll need to implement this based on your data structure
        return None
        
    except Exception as e:
        logging.error(f"Error finding staff by phone: {e}")
        return None

def find_active_tasks_for_staff(staff_id: int, db: Session) -> list:
    """Find active tasks assigned to staff member"""
    try:
        # This would need to be implemented based on your task data structure
        # For now, returning empty list
        # You'll need to query your actual tasks table
        
        # Example implementation:
        # tasks = db.query(Task).filter(
        #     Task.assigneeUserId == staff_id,
        #     Task.status.in_(["pending", "confirmed", "inProgress"])
        # ).all()
        # return [{"id": task.id, "title": task.title, "status": task.status} for task in tasks]
        
        return []
        
    except Exception as e:
        logging.error(f"Error finding active tasks: {e}")
        return []

def analyze_task_response(message_body: str, media_url: str, active_tasks: list) -> Dict[str, Any]:
    """Use AI to analyze the WhatsApp response and determine action"""
    try:
        # Create prompt for AI analysis
        prompt = f"""
        Analyze this WhatsApp message from a staff member and determine:
        1. Is this an acceptance of a task?
        2. Is this a completion of a task?
        3. Which task is being referenced (if any)?
        
        Message: "{message_body}"
        Has media attachment: {"Yes" if media_url else "No"}
        Active tasks: {json.dumps(active_tasks, indent=2)}
        
        Respond with JSON in this format:
        {{
            "action": "accepted|completed|unclear",
            "task_id": <task_id_if_determined>,
            "confidence": <0.0_to_1.0>,
            "reasoning": "<explanation>"
        }}
        
        Look for keywords like:
        - Acceptance: "accepted", "I'll do it", "on my way", "yes", "ok"
        - Completion: "done", "finished", "completed", "all set"
        """
        
        # Get AI response
        ai_response = get_gpt_response("gpt-4", prompt, message_body)
        
        if not ai_response:
            return {"success": False, "error": "AI analysis failed"}
        
        # Parse AI response
        try:
            analysis = json.loads(ai_response)
        except json.JSONDecodeError:
            # If AI didn't return valid JSON, try to extract info manually
            analysis = extract_action_manually(message_body)
        
        # Validate analysis
        if analysis.get("action") not in ["accepted", "completed", "unclear"]:
            return {"success": False, "error": "Invalid action from AI analysis"}
        
        if analysis.get("action") == "unclear":
            return {"success": False, "error": "Could not determine action from message"}
        
        # If we have multiple tasks and no specific task_id, use the first one
        if not analysis.get("task_id") and active_tasks:
            analysis["task_id"] = active_tasks[0]["id"]
        
        return {"success": True, **analysis}
        
    except Exception as e:
        logging.error(f"Error analyzing task response: {e}")
        return {"success": False, "error": str(e)}

def extract_action_manually(message_body: str) -> Dict[str, Any]:
    """Fallback method to extract action from message without AI"""
    message_lower = message_body.lower()
    
    # Check for completion keywords
    completion_keywords = ["done", "finished", "completed", "all set", "ready"]
    if any(keyword in message_lower for keyword in completion_keywords):
        return {
            "action": "completed",
            "confidence": 0.7,
            "reasoning": "Detected completion keywords"
        }
    
    # Check for acceptance keywords
    acceptance_keywords = ["accepted", "i'll do it", "on my way", "yes", "ok", "sure"]
    if any(keyword in message_lower for keyword in acceptance_keywords):
        return {
            "action": "accepted",
            "confidence": 0.7,
            "reasoning": "Detected acceptance keywords"
        }
    
    return {
        "action": "unclear",
        "confidence": 0.0,
        "reasoning": "No clear action detected"
    }

def update_task_status(task_id: int, new_status: str, db: Session) -> Dict[str, Any]:
    """Update task status in the database"""
    try:
        # This would need to be implemented based on your task data structure
        # For now, returning success
        
        # Example implementation:
        # task = db.query(Task).filter(Task.id == task_id).first()
        # if task:
        #     task.status = new_status
        #     db.commit()
        #     return {"success": True}
        # else:
        #     return {"success": False, "error": "Task not found"}
        
        logging.info(f"Would update task {task_id} to status {new_status}")
        return {"success": True}
        
    except Exception as e:
        logging.error(f"Error updating task status: {e}")
        return {"success": False, "error": str(e)}

def upload_media_to_task(task_id: int, media_url: str, user_id: int, db: Session) -> Dict[str, Any]:
    """Upload media to Hostaway task attachments"""
    try:
        # This would need to be implemented using Hostaway API
        # For now, just logging
        
        logging.info(f"Would upload media {media_url} to task {task_id}")
        return {"success": True}
        
    except Exception as e:
        logging.error(f"Error uploading media to task: {e}")
        return {"success": False, "error": str(e)}
