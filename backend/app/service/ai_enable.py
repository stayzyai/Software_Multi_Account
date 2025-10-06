from concurrent.futures import ThreadPoolExecutor
from app.data.chat_prompt import SYSTEM_PROMPT
from app.data.task_create_prompt import TASK_GENERATION_PROMPT
from app.common.hostaway_setup import hostaway_get_request, hostaway_post_request
from app.database.db import get_db
from app.models.user import HostawayAccount, ChatAIStatus, User
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.common.chat_gpt_assistant import get_latest_model_id
from app.common.chat_query import store_chat
from app.common.open_ai import get_gpt_response, gpt_taskCreation
from app.common.send_email import send_email
import json
from datetime import datetime
import threading
from app.common.ai_booking import update_booking
from app.common.ai_schedule import is_ai_schedule_active

def generate_prompt(previous_conversation, latest_message, property_details, amenities_detail, reservation_details=None):
    try:
        return SYSTEM_PROMPT.format(
            previous_conversation=previous_conversation,
            latest_message=latest_message,
            property_details=property_details,
            amenities_detail=amenities_detail,
            reservation_details=reservation_details
        )
    except KeyError as e:
        return f"Error: Missing key {e} in formatting the prompt."
    except Exception as e:
        return f"Unexpected error: {e}"

def get_hostaway_token(account_id, db: Session):
    try:
        hostaway_account = db.query(HostawayAccount).filter(HostawayAccount.account_id == str(account_id)).first()
        return hostaway_account.hostaway_token if hostaway_account else None
    except Exception as e:
        return None
    
def chack_ai_enable(new_messages, db: Session):
    try:
        accountId = new_messages.get("accountId")
        print(f"🔍 Checking AI enable for accountId: {accountId}")
        hostaway_account = db.query(HostawayAccount).filter(HostawayAccount.account_id == str(accountId)).first()
        if hostaway_account:
            print(f"✅ Found Hostaway account: {hostaway_account.account_id}, user_id: {hostaway_account.user_id}")
            return hostaway_account.user_id
        else:
            print(f"❌ No Hostaway account found for accountId: {accountId}")
            return None
    except Exception as e:
        print(f"❌ Error in chack_ai_enable: {e}")
        return None

def check_ai_status(user_id, chat_id, db: Session):
    try:
        print(f"🔍 Checking AI status for user_id: {user_id}, chat_id: {chat_id}")
        chat_status = db.query(ChatAIStatus).filter(ChatAIStatus.user_id == user_id, ChatAIStatus.chat_id == chat_id).first()
        if chat_status:
            print(f"📊 Chat AI Status found: ai_enabled={chat_status.ai_enabled}, is_active={chat_status.is_active}")
            return chat_status.ai_enabled
        else:
            print(f"❌ No ChatAIStatus record found for user_id: {user_id}, chat_id: {chat_id}")
            return False
    except Exception as e:
        print(f"❌ Error in check_ai_status: {e}")
        return False

def get_parsed_conversation(response):
    try:
        data = json.loads(response)
        conversations = data.get("result", [])
        conversations.sort(key=lambda x: x.get("date", ""))
        parsed_conversations = []
        for convo in conversations:
            role = "user" if convo.get("isIncoming") == 1 else "assistant"
            content = convo.get("body", "")
            if content:
                parsed_conversations.append({"role": role, "content": content})
        return parsed_conversations
    except json.JSONDecodeError:
        return []
    except Exception as e:
        return []

def get_previous_conversation(new_messages):
    try:
        db = next(get_db())
        accountId = new_messages.get("accountId")
        hostaway_token = get_hostaway_token(accountId, db)
        if not hostaway_token:
            return []
        conversationId = new_messages.get("conversationId")
        response = hostaway_get_request(hostaway_token, f"conversations/{conversationId}/messages")
        return get_parsed_conversation(response)
    except Exception as e:
        return []

def get_property_details(new_messages):
    try:
        db = next(get_db())
        accountId = new_messages.get("accountId")
        listingMapId = new_messages.get("listingMapId")
        hostaway_token = get_hostaway_token(accountId, db)
        response = hostaway_get_request(hostaway_token, f"listings/{listingMapId}")
        data = json.loads(response)
        return data.get("result", {})
    except json.JSONDecodeError:
        return {}
    except Exception as e:
        return {}

def get_amenities_detail(new_messages):
    try:
        db = next(get_db())
        accountId = new_messages.get("accountId")
        hostaway_token = get_hostaway_token(accountId, db)
        response = hostaway_get_request(hostaway_token, "amenities")
        data = json.loads(response)
        return data.get("result", [])
    except json.JSONDecodeError:
        return []
    except Exception as e:
        return []

def get_ai_response(prompt, messsages, user_id):
    try:
        print(f"🤖 Generating AI response for user_id: {user_id}")
        received_timestamp = datetime.now().isoformat()
        model_id = get_latest_model_id()
        print(f"🤖 Using model: {model_id}")
        print(f"🤖 Prompt length: {len(prompt)}")
        print(f"🤖 Message: {messsages}")
        
        gpt_response = get_gpt_response(model_id, prompt, messsages)
        print(f"🤖 GPT Response received: {gpt_response}")
        
        if gpt_response is None:
            print(f"❌ GPT response is None")
            raise HTTPException(status_code=400, detail="Some error occurred. Please try again.")
        
        response_timestamp = datetime.now().isoformat()
        interaction_data = {
            "prompt": messsages,
            "completion": gpt_response,
            "received_timestamp": received_timestamp,
            "response_timestamp": response_timestamp,
            "user_id": user_id if user_id else None,
        }
        # store_chat(interaction_data)
        threading.Thread(target=store_chat, args=(interaction_data,), daemon=True).start()
        
        print(f"✅ AI response generated successfully")
        return {"model": model_id, "answer": gpt_response}
    except Exception as e:
        print(f"❌ Error in get_ai_response: {e}")
        return {"model": model_id, "answer": ""}
    
def get_reservations (user_id, listingMapId):
    try:
        db = next(get_db())
        account = db.query(HostawayAccount).filter(HostawayAccount.user_id == user_id).first()
        if not account or not account.hostaway_token:
            raise HTTPException(status_code=404, detail="Hostaway account or token not found.")
        response = hostaway_get_request(account.hostaway_token, "reservations")
        data = json.loads(response)
        reservations = []
        if data['status'] == 'success':
            all_reservations = data.get("result", [])
            reservations = [res for res in all_reservations if res.get('listingMapId') == listingMapId]
        return reservations

    except Exception as e:
        raise HTTPException(status_code=500, detail={"message": f"Error in get_all_reservations: {str(e)}"})

def create_issue_ticket(new_message):
    try:
        db = next(get_db())
        accountId = new_message.get("accountId")
        hostaway_token = get_hostaway_token(accountId, db)
        response = hostaway_get_request(hostaway_token, "tasks")
        user_response = hostaway_get_request(hostaway_token, "users")
        data = json.loads(response)
        tasks =  data.get("result", {})
        user_data = json.loads(user_response)
        users = user_data.get("result", {})
        reservationId = new_message.get("reservationId")
        message = new_message.get("body")
        prompt = TASK_GENERATION_PROMPT.format(tasks=tasks, users=users,
                reservationId=reservationId, message=message)
        task_response = gpt_taskCreation(prompt)
        task_response = json.loads(task_response)
        email_data = task_response.get("email")
        task_data = {key: value for key, value in task_response.items() if key != "email"}
        create_task = hostaway_post_request(hostaway_token, "tasks", task_data)
        task_data = json.loads(create_task)
        if task_data['status'] == 'success':
            # Send email notification
            email_response = send_email(email_data["userEmail"], email_data["subject"], email_data["body"])
            
            # Send WhatsApp notification if configured
            send_whatsapp_task_notification(task_data, users, accountId, db)
            
    except Exception as e:
        return {"status": "error", "message": str(e)}

def send_whatsapp_task_notification(task_data, users, accountId, db):
    """Send WhatsApp notification for newly created task"""
    try:
        from app.common.twilio_service import twilio_service
        
        # Get the user who owns this Hostaway account
        hostaway_account = db.query(HostawayAccount).filter(HostawayAccount.account_id == accountId).first()
        if not hostaway_account:
            print("❌ No Hostaway account found for WhatsApp notification")
            return
        
        user_id = hostaway_account.user_id
        
        # Get task details
        task_id = task_data.get("result", {}).get("id")
        task_title = task_data.get("result", {}).get("title", "New Task")
        assignee_user_id = task_data.get("result", {}).get("assigneeUserId")
        
        if not task_id or not assignee_user_id:
            print("❌ Missing task ID or assignee for WhatsApp notification")
            return
        
        # Find assigned user details
        assigned_user = None
        for user in users:
            if user.get("id") == assignee_user_id:
                assigned_user = user
                break
        
        if not assigned_user:
            print(f"❌ Assigned user {assignee_user_id} not found for WhatsApp notification")
            return
        
        # Get user's phone number (assuming it's in the user data)
        staff_phone = assigned_user.get("phone")
        if not staff_phone:
            print(f"❌ No phone number found for user {assigned_user.get('firstName', 'Unknown')}")
            return
        
        # Get listing address (you might need to fetch this from reservation data)
        listing_address = "Property Address"  # This would need to be fetched from reservation/listing data
        
        # Send WhatsApp notification
        result = twilio_service.send_task_notification(
            staff_phone=staff_phone,
            task_name=task_title,
            ticket_number=str(task_id),
            listing_address=listing_address,
            user_id=user_id,
            db=db
        )
        
        if result.get("success"):
            print(f"✅ WhatsApp notification sent to {staff_phone} for task {task_id}")
        else:
            print(f"❌ Failed to send WhatsApp notification: {result.get('error')}")
            
    except Exception as e:
        print(f"❌ Error sending WhatsApp task notification: {e}")

async def send_message(new_message, gpt_response, latest_incoming, user_id, listingMapId):
    try:
        print(f"📤 Starting to send AI message")
        db = next(get_db())
        accountId = new_message.get("accountId")
        conversationId = new_message.get("conversationId")
        reservationId = new_message.get("reservationId")
        print(f"📤 Message details: accountId={accountId}, conversationId={conversationId}, reservationId={reservationId}")
        
        hostaway_token = get_hostaway_token(accountId, db)
        if not hostaway_token:
            print(f"❌ No Hostaway token found for accountId: {accountId}")
            return False
        print(f"✅ Hostaway token found")
        
        answer_data = gpt_response.get("answer", "")
        print(f"📤 GPT answer data: {answer_data}")
        
        if isinstance(answer_data, str):
            try:
                parsed_answer = json.loads(answer_data)
                if isinstance(parsed_answer, dict) and "response" in parsed_answer:
                    messageBody = parsed_answer["response"]
                    issue_detected = parsed_answer.get("issues") == "Yes, issue detected"
                    print(f"📤 Parsed JSON response: {messageBody}, issue_detected: {issue_detected}")
                else:
                    messageBody = answer_data
                    issue_detected = False
                    print(f"📤 Using raw answer as message body: {messageBody}")
            except json.JSONDecodeError:
                messageBody = answer_data
                issue_detected = False
                print(f"📤 JSON decode failed, using raw answer: {messageBody}")
        else:
            print(f"❌ Answer data is not a string: {type(answer_data)}")
            return False
            
        print(f"📤 Processing message body through update_booking")
        messageBody = await update_booking(messageBody, latest_incoming, listingMapId, reservationId, user_id, db)
        print(f"📤 Final message body: {messageBody}")
        
        payload = {
            "body": messageBody,
            "communicationType": "channel"
        }
        print(f"📤 Sending to Hostaway API: {payload}")
        
        response = hostaway_post_request(hostaway_token, f"conversations/{conversationId}/messages", payload)
        print(f"📤 Hostaway API response: {response}")
        
        data = json.loads(response)
        if data.get("status") == "success":
            print(f"✅ Message sent successfully")
            if issue_detected:
                print(f"🎫 Creating issue ticket")
                create_issue_ticket(new_message)
            return True
        else:
            print(f"⚠️ Hostaway API returned non-success status: {data}")
            return True

    except Exception as e:
        print(f"❌ Error sending message: {e}")
        import traceback
        traceback.print_exc()
        return False

async def send_auto_ai_messages(new_messages):
    try:
        print(f"🤖 Processing AI message: {new_messages}")
        db = next(get_db())
        user_id = chack_ai_enable(new_messages, db)
        print(f"🔍 User ID found: {user_id}")
        
        if user_id:
            consversationsId = new_messages.get("conversationId")
            listingMapId = new_messages.get("listingMapId")
            is_ai_enabled = check_ai_status(user_id, consversationsId, db)
            print(f"🤖 AI enabled for chat {consversationsId}: {is_ai_enabled}")
            
            if not is_ai_enabled:
                print(f"❌ AI not enabled for chat {consversationsId}")
                return False
            
            # Check AI schedule if enabled
            user = db.query(User).filter(User.id == user_id).first()
            if user and user.ai_schedule and user.ai_schedule.get("enabled", False):
                schedule_active = is_ai_schedule_active(user.ai_schedule, user.timezone)
                print(f"📅 AI Schedule check: {schedule_active}")
                if not schedule_active:
                    print(f"❌ AI not active due to schedule restrictions")
                    return False
            
            latest_incoming = new_messages.get("body", "")
            print(f"📝 Processing message: {latest_incoming}")

            with ThreadPoolExecutor() as executor:
                future_previous_conversation = executor.submit(get_previous_conversation, new_messages)
                future_property_details = executor.submit(get_property_details, new_messages)
                future_amenities_detail = executor.submit(get_amenities_detail, new_messages)
                reservation = executor.submit(get_reservations, user_id, listingMapId)
                previous_conversation = future_previous_conversation.result()
                property_details = future_property_details.result()
                amenities_detail = future_amenities_detail.result()
                reservation_details = reservation.result()

            prompt = generate_prompt(previous_conversation, latest_incoming, property_details, amenities_detail, reservation_details)
            print(f"🎯 Generated prompt length: {len(prompt)}")
            
            gpt_response = get_ai_response(prompt, latest_incoming, user_id)
            print(f"🤖 GPT Response: {gpt_response}")

            result = await send_message(new_messages, gpt_response, latest_incoming, user_id, listingMapId)
            print(f"📤 Message sent result: {result}")
            return result
        else:
            print(f"❌ No user ID found for account: {new_messages.get('accountId')}")
            return False

    except Exception as e:
        print(f"❌ Error in send_auto_ai_messages: {e}")
        return f"Error: {e}"
