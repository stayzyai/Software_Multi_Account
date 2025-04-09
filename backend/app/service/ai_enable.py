from concurrent.futures import ThreadPoolExecutor
from app.data.chat_prompt import SYSTEM_PROMPT
from app.data.task_create_prompt import TASK_GENERATION_PROMPT
from app.common.hostaway_setup import hostaway_get_request, hostaway_post_request
from app.database.db import get_db
from app.models.user import HostawayAccount, ChatAIStatus
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.common.chat_gpt_assistant import get_latest_model_id
from app.common.chat_query import store_chat
from app.common.open_ai import get_gpt_response, gpt_taskCreation
from app.common.send_email import send_email
import json


def generate_prompt(previous_conversation, latest_message, property_details, amenities_detail):
    try:
        return SYSTEM_PROMPT.format(
            previous_conversation=previous_conversation,
            latest_message=latest_message,
            property_details=property_details,
            amenities_detail=amenities_detail
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
        hostaway_account = db.query(HostawayAccount).filter(HostawayAccount.account_id == str(accountId)).first()
        return hostaway_account.user_id if hostaway_account else None
    except Exception as e:
        return None

def check_ai_status(user_id, chat_id, db: Session):
    try:
        chat_status = db.query(ChatAIStatus).filter(ChatAIStatus.user_id == user_id, ChatAIStatus.chat_id == chat_id).first()
        print(f"Chat status for user {user_id} and chat {chat_id}: {chat_status}")
        if chat_status and chat_status.ai_enabled:
            return True
        return False
    except Exception as e:
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

def get_ai_response(prompt, messsages):
    try:
        model_id = get_latest_model_id()
        gpt_response = get_gpt_response(model_id, prompt, messsages)
        if gpt_response is None:
            raise HTTPException(status_code=400, detail="Some error occurred. Please try again.")
        interaction_data = {
                "prompt": messsages,
                "completion": gpt_response
                }
        store_chat(interaction_data)
        
        return {"model": model_id, "answer": gpt_response}
    except Exception as e:
        return {"model": model_id, "answer": ""}

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
        print("Task data ready to create task:\n", task_data)
        create_task = hostaway_post_request(hostaway_token, "tasks", task_data)
        print("Task create successfully....", create_task)
        task_data = json.loads(create_task)
        if task_data['status'] == 'success':
            email_response = send_email(email_data["userEmail"], email_data["subject"], email_data["body"])
            print("Email send successfully....", email_response)
    except Exception as e:
        return {"status": "error", "message": str(e)}

def send_message(new_message, gpt_response):
    try:
        db = next(get_db())
        accountId = new_message.get("accountId")
        conversationId = new_message.get("conversationId")
        hostaway_token = get_hostaway_token(accountId, db)
        answer_data = gpt_response.get("answer", "")
        if isinstance(answer_data, str):
            try:
                parsed_answer = json.loads(answer_data)
                if isinstance(parsed_answer, dict) and "response" in parsed_answer:
                    messageBody = parsed_answer["response"]
                    issue_detected = parsed_answer.get("issues") == "Yes, issue detected"
                else:
                    messageBody = answer_data
                    issue_detected = False
            except json.JSONDecodeError:
                messageBody = answer_data
                issue_detected = False
        else:
            print("Error: Unexpected format for 'answer'.")
            return False

        payload = {
            "body": messageBody,
            "communicationType": "channel"
        }
        response = hostaway_post_request(hostaway_token, f"conversations/{conversationId}/messages", payload)
        data = json.loads(response)
        if data.get("status") == "success":
            print("Message sent successfully.")
            if issue_detected:
                create_issue_ticket(new_message)
            return True
        else:
            print("Some error occurred while sending the message.")
            return True
    except Exception as e:
        print(f"Error sending message: {e}")

def send_auto_ai_messages(new_messages):
    try:
        user_id = chack_ai_enable(new_messages, next(get_db()))
        if user_id:
            consversationsId = new_messages.get("conversationId")
            print(f"User ID: {user_id}, Conversation ID: {consversationsId}")
            is_ai_enabled = check_ai_status(user_id, consversationsId, next(get_db()))
            print(f"AI status for user {user_id} and conversation {consversationsId}: {is_ai_enabled}")
            if not is_ai_enabled:
                print(f"AI is not Enable for Id: {consversationsId}")
                return False
            else :
                print(f"AI is Enable for Id: {consversationsId}")
                latest_incoming = new_messages.get("body", "")

                with ThreadPoolExecutor() as executor:
                    future_previous_conversation = executor.submit(get_previous_conversation, new_messages)
                    future_property_details = executor.submit(get_property_details, new_messages)
                    future_amenities_detail = executor.submit(get_amenities_detail, new_messages)
                    previous_conversation = future_previous_conversation.result()
                    property_details = future_property_details.result()
                    amenities_detail = future_amenities_detail.result()

                prompt = generate_prompt(previous_conversation, latest_incoming, property_details, amenities_detail)
                gpt_response = get_ai_response(prompt, latest_incoming)
                return send_message(new_messages, gpt_response)
        else:
            print(f"AI is not Enable for Id: {consversationsId}")
            return False

    except Exception as e:
        return f"Error: {e}"
