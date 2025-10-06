import requests
import json
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.user import User
from app.database.db import get_db
import logging

class TwilioService:
    def __init__(self):
        self.base_url = "https://api.twilio.com/2010-04-01"
    
    def get_user_twilio_settings(self, user_id: int, db: Session) -> Optional[Dict[str, Any]]:
        """Get Twilio settings for a specific user"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user or not user.twilio_settings:
                return None
            
            settings = user.twilio_settings
            if not settings.get("enabled", False):
                return None
                
            return {
                "account_sid": settings.get("account_sid"),
                "auth_token": settings.get("auth_token"),
                "whatsapp_number": settings.get("whatsapp_number")
            }
        except Exception as e:
            logging.error(f"Error getting Twilio settings for user {user_id}: {e}")
            return None
    
    def send_whatsapp_message(
        self, 
        to_number: str, 
        message: str, 
        user_id: int, 
        db: Session,
        media_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send WhatsApp message using user's Twilio credentials"""
        try:
            # Get user's Twilio settings
            settings = self.get_user_twilio_settings(user_id, db)
            if not settings:
                return {
                    "success": False,
                    "error": "Twilio not configured for this user"
                }
            
            # Prepare the message payload
            payload = {
                "To": f"whatsapp:{to_number}",
                "From": f"whatsapp:{settings['whatsapp_number']}",
                "Body": message
            }
            
            # Add media if provided
            if media_url:
                payload["MediaUrl"] = media_url
            
            # Send the message
            url = f"{self.base_url}/Accounts/{settings['account_sid']}/Messages.json"
            response = requests.post(
                url,
                data=payload,
                auth=(settings['account_sid'], settings['auth_token'])
            )
            
            if response.status_code == 201:
                response_data = response.json()
                logging.info(f"WhatsApp message sent successfully to {to_number}")
                return {
                    "success": True,
                    "message_sid": response_data.get("sid"),
                    "status": response_data.get("status")
                }
            else:
                error_data = response.json()
                logging.error(f"Failed to send WhatsApp message: {error_data}")
                return {
                    "success": False,
                    "error": error_data.get("message", "Unknown error")
                }
                
        except Exception as e:
            logging.error(f"Error sending WhatsApp message: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def send_task_notification(
        self,
        staff_phone: str,
        task_name: str,
        ticket_number: str,
        listing_address: str,
        user_id: int,
        db: Session
    ) -> Dict[str, Any]:
        """Send task notification to staff member via WhatsApp"""
        try:
            # Format the message
            message = f"""🔧 *New Task Assignment*

*Task:* {task_name}
*Ticket:* #{ticket_number}
*Location:* {listing_address}

Please respond to this message to:
✅ Accept the task
📸 Upload a photo when completed

Reply with 'ACCEPTED' to confirm you'll handle this task."""

            # Send the message
            result = self.send_whatsapp_message(
                to_number=staff_phone,
                message=message,
                user_id=user_id,
                db=db
            )
            
            return result
            
        except Exception as e:
            logging.error(f"Error sending task notification: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def test_connection(self, account_sid: str, auth_token: str) -> Dict[str, Any]:
        """Test Twilio connection with provided credentials"""
        try:
            url = f"{self.base_url}/Accounts/{account_sid}.json"
            response = requests.get(url, auth=(account_sid, auth_token))
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "message": "Connection successful"
                }
            else:
                return {
                    "success": False,
                    "message": "Invalid credentials"
                }
        except Exception as e:
            return {
                "success": False,
                "message": f"Connection failed: {str(e)}"
            }

# Global instance
twilio_service = TwilioService()
