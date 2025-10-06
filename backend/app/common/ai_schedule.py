from datetime import datetime, time
import pytz
from typing import Dict, Any

def is_ai_schedule_active(ai_schedule: Dict[str, Any], user_timezone: str = "America/Chicago") -> bool:
    """
    Check if AI should be active based on the user's schedule settings
    
    Args:
        ai_schedule: The AI schedule configuration
        user_timezone: The user's timezone
        
    Returns:
        bool: True if AI should be active, False otherwise
    """
    try:
        # If schedule control is disabled, AI is always active (when master AI is enabled)
        if not ai_schedule.get("enabled", False):
            return True
        
        # Get current time in user's timezone
        user_tz = pytz.timezone(user_timezone)
        now = datetime.now(user_tz)
        current_day = now.strftime("%A").lower()
        current_time = now.time()
        
        # Check if current day is enabled
        days_config = ai_schedule.get("days", {})
        day_config = days_config.get(current_day, {})
        
        if not day_config.get("enabled", False):
            return False
        
        # Check if current time is within the allowed range
        start_time_str = day_config.get("startTime", "09:00")
        end_time_str = day_config.get("endTime", "17:00")
        
        try:
            start_time = datetime.strptime(start_time_str, "%H:%M").time()
            end_time = datetime.strptime(end_time_str, "%H:%M").time()
        except ValueError:
            # If time format is invalid, default to 9 AM - 5 PM
            start_time = time(9, 0)
            end_time = time(17, 0)
        
        # Check if current time is within the allowed range
        if not (start_time <= current_time <= end_time):
            return False
        
        # Check special date ranges
        date_ranges = ai_schedule.get("dateRanges", [])
        current_date = now.date()
        
        for date_range in date_ranges:
            if not date_range.get("enabled", True):
                continue
                
            try:
                start_date = datetime.strptime(date_range.get("startDate", ""), "%Y-%m-%d").date()
                end_date = datetime.strptime(date_range.get("endDate", ""), "%Y-%m-%d").date()
                
                # If current date falls within this range, AI should be active
                if start_date <= current_date <= end_date:
                    return True
            except (ValueError, TypeError):
                # Skip invalid date ranges
                continue
        
        # If we get here, check if we're in a disabled date range
        for date_range in date_ranges:
            if not date_range.get("enabled", True):
                try:
                    start_date = datetime.strptime(date_range.get("startDate", ""), "%Y-%m-%d").date()
                    end_date = datetime.strptime(date_range.get("endDate", ""), "%Y-%m-%d").date()
                    
                    # If current date falls within a disabled range, AI should be inactive
                    if start_date <= current_date <= end_date:
                        return False
                except (ValueError, TypeError):
                    # Skip invalid date ranges
                    continue
        
        # If we get here, AI should be active based on day/time schedule
        return True
        
    except Exception as e:
        # If there's any error in schedule checking, default to active
        print(f"Error checking AI schedule: {e}")
        return True

def get_ai_schedule_status_message(ai_schedule: Dict[str, Any], user_timezone: str = "America/Chicago") -> str:
    """
    Get a human-readable status message about the AI schedule
    
    Args:
        ai_schedule: The AI schedule configuration
        user_timezone: The user's timezone
        
    Returns:
        str: Status message
    """
    try:
        if not ai_schedule.get("enabled", False):
            return "AI schedule control is disabled - AI will respond based on master toggle"
        
        user_tz = pytz.timezone(user_timezone)
        now = datetime.now(user_tz)
        current_day = now.strftime("%A")
        current_time = now.strftime("%H:%M")
        
        days_config = ai_schedule.get("days", {})
        day_config = days_config.get(now.strftime("%A").lower(), {})
        
        if not day_config.get("enabled", False):
            return f"AI is currently inactive - {current_day} is disabled in your schedule"
        
        start_time = day_config.get("startTime", "09:00")
        end_time = day_config.get("endTime", "17:00")
        
        if is_ai_schedule_active(ai_schedule, user_timezone):
            return f"AI is currently active - {current_day} {start_time}-{end_time}"
        else:
            return f"AI is currently inactive - Outside scheduled hours ({start_time}-{end_time})"
            
    except Exception as e:
        return f"AI schedule status unknown - Error: {str(e)}"


