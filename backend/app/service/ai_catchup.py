import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.user import ChatAIStatus, HostawayAccount
from app.common.hostaway_setup import hostaway_get_request
from app.service.ai_enable import get_hostaway_token
from app.service.ai_enable import (
    get_parsed_conversation, 
    get_ai_response, 
    send_message,
    get_property_details,
    get_amenities_detail,
    get_reservations,
    generate_prompt
)
from app.common.open_ai import get_gpt_response
from app.common.chat_gpt_assistant import get_latest_model_id

logger = logging.getLogger(__name__)

class AICatchupService:
    """Service to handle AI catch-up when AI is toggled back on"""
    
    def __init__(self):
        self.max_lookback_hours = 72  # Look back max 3 days for unanswered messages
        self.max_conversations_per_batch = 5  # Process max 5 conversations at once
        
    def find_unanswered_messages(self, conversation: List[Dict], user_id: int) -> Tuple[List[Dict], int]:
        """
        Find unanswered guest messages from the last response (AI or owner).
        
        Args:
            conversation: List of messages with role and content
            user_id: User ID for logging
            
        Returns:
            Tuple of (unanswered_messages, last_response_index)
        """
        try:
            if not conversation:
                return [], -1
                
            # Find the last assistant (AI/owner) response
            last_response_index = -1
            for i in range(len(conversation) - 1, -1, -1):
                if conversation[i].get("role") == "assistant":
                    last_response_index = i
                    break
            
            # If no assistant response found, all user messages are unanswered
            if last_response_index == -1:
                unanswered = [msg for msg in conversation if msg.get("role") == "user"]
                logger.info(f"🔍 No previous assistant response found for user {user_id}. {len(unanswered)} total user messages")
                return unanswered, -1
            
            # Get all user messages after the last assistant response
            unanswered_messages = []
            for i in range(last_response_index + 1, len(conversation)):
                if conversation[i].get("role") == "user":
                    unanswered_messages.append(conversation[i])
            
            logger.info(f"🔍 Found {len(unanswered_messages)} unanswered messages after last response for user {user_id}")
            return unanswered_messages, last_response_index
            
        except Exception as e:
            logger.error(f"❌ Error finding unanswered messages for user {user_id}: {e}")
            return [], -1
    
    def analyze_catchup_context(self, unanswered_messages: List[Dict], conversation_context: List[Dict], user_id: int) -> Optional[str]:
        """
        Use AI to analyze unanswered messages and determine if/how to respond.
        
        Args:
            unanswered_messages: List of unanswered user messages
            conversation_context: Full conversation context for reference
            user_id: User ID for logging
            
        Returns:
            AI decision on whether to respond and what type of response needed
        """
        try:
            if not unanswered_messages:
                return None
                
            # Focus on the most recent 1-2 messages as requested
            recent_messages = unanswered_messages[-2:] if len(unanswered_messages) >= 2 else unanswered_messages
            
            # Create analysis prompt
            analysis_prompt = f"""
You are an AI assistant analyzing a conversation where the AI was temporarily disabled and guest messages went unanswered.

CONVERSATION CONTEXT (for reference):
{json.dumps(conversation_context[-10:], indent=2)}

UNANSWERED MESSAGES TO ANALYZE:
{json.dumps(recent_messages, indent=2)}

ALL UNANSWERED MESSAGES (for context):
{json.dumps(unanswered_messages, indent=2)}

TASK: Analyze if these unanswered messages need a response. Consider:

1. Are the recent messages just trying to get attention? (e.g., "Hello?", "Are you there?")
2. Is there an underlying question or issue that still needs addressing?
3. Has the guest already resolved their issue or moved on?
4. Is the matter time-sensitive or still relevant?

RESPOND WITH ONE OF:
- "RESPOND_WITH_CONTEXT" - If you should respond and address both the attention-seeking messages AND the underlying issue
- "RESPOND_SIMPLE" - If you should respond but only to acknowledge the recent messages
- "NO_RESPONSE" - If no response is needed (issue resolved, too old, etc.)

If responding, also provide the type of issue to address (e.g., "early_checkin", "wifi_issue", "general_inquiry").

FORMAT: [DECISION]|[ISSUE_TYPE]|[REASON]

Example: RESPOND_WITH_CONTEXT|early_checkin|Guest asked about early check-in and then tried to get attention when no response came
"""

            # Get AI analysis
            model_id = get_latest_model_id()
            analysis_response = get_gpt_response(model_id, analysis_prompt, "Analyze these unanswered messages")
            
            logger.info(f"🤖 Catchup analysis for user {user_id}: {analysis_response}")
            return analysis_response
            
        except Exception as e:
            logger.error(f"❌ Error analyzing catchup context for user {user_id}: {e}")
            return None
    
    def generate_catchup_response(self, analysis: str, unanswered_messages: List[Dict], 
                                conversation_context: List[Dict], property_details: Dict, 
                                amenities_detail: List, reservation_details: Dict, user_id: int) -> Optional[str]:
        """
        Generate appropriate catchup response based on analysis.
        
        Args:
            analysis: AI analysis result
            unanswered_messages: List of unanswered messages
            conversation_context: Full conversation for context
            property_details: Property information
            amenities_detail: Amenities information
            reservation_details: Reservation information
            user_id: User ID for logging
            
        Returns:
            Generated response or None if no response needed
        """
        try:
            if not analysis or "NO_RESPONSE" in analysis:
                logger.info(f"🤖 No catchup response needed for user {user_id}")
                return None
                
            # Parse analysis
            parts = analysis.split("|")
            decision = parts[0] if len(parts) > 0 else ""
            issue_type = parts[1] if len(parts) > 1 else ""
            reason = parts[2] if len(parts) > 2 else ""
            
            # Create catchup prompt
            recent_messages = unanswered_messages[-2:] if len(unanswered_messages) >= 2 else unanswered_messages
            
            catchup_prompt = f"""
You are a helpful property management AI assistant. You were temporarily unavailable and missed some guest messages. 
Now you need to catch up and provide an appropriate response.

SITUATION:
- You were offline/disabled when the guest sent messages
- The guest may have been trying to get your attention
- You need to acknowledge the delay and address their needs

ANALYSIS RESULT: {analysis}

CONVERSATION CONTEXT:
{json.dumps(conversation_context[-10:], indent=2)}

RECENT UNANSWERED MESSAGES:
{json.dumps(recent_messages, indent=2)}

ALL UNANSWERED MESSAGES:
{json.dumps(unanswered_messages, indent=2)}

PROPERTY DETAILS:
{json.dumps(property_details, indent=2)}

RESERVATION DETAILS:
{json.dumps(reservation_details, indent=2)}

INSTRUCTIONS:
1. Apologize for the delayed response (keep it brief)
2. Address the guest's original question/concern if still relevant
3. Acknowledge if they were trying to get your attention
4. Provide helpful information based on their needs
5. Be warm, professional, and solution-focused

Generate a response that addresses both the delay and their actual needs.
"""

            # Generate the actual response
            latest_message = recent_messages[-1].get("content", "") if recent_messages else ""
            response = get_ai_response(catchup_prompt, latest_message, user_id)
            
            if response and response.get("answer"):
                logger.info(f"✅ Generated catchup response for user {user_id}")
                return response.get("answer")
            else:
                logger.warning(f"⚠️ Failed to generate catchup response for user {user_id}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error generating catchup response for user {user_id}: {e}")
            return None
    
    async def process_conversation_catchup(self, conversation_id: int, user_id: int, 
                                         account_id: str, listing_map_id: int) -> bool:
        """
        Process catchup for a single conversation.
        
        Args:
            conversation_id: Hostaway conversation ID
            user_id: User ID
            account_id: Hostaway account ID
            listing_map_id: Property listing ID
            
        Returns:
            True if catchup was processed successfully
        """
        try:
            logger.info(f"🔄 Processing catchup for conversation {conversation_id}, user {user_id}")
            
            db = next(get_db())
            
            # Get conversation messages
            hostaway_token = get_hostaway_token(account_id, db)
            if not hostaway_token:
                logger.error(f"❌ No Hostaway token found for account {account_id}")
                return False
            
            # Fetch conversation
            response = hostaway_get_request(hostaway_token, f"conversations/{conversation_id}/messages")
            conversation = get_parsed_conversation(response)
            
            if not conversation:
                logger.info(f"ℹ️ No conversation found for {conversation_id}")
                return False
            
            # Find unanswered messages
            unanswered_messages, last_response_index = self.find_unanswered_messages(conversation, user_id)
            
            if not unanswered_messages:
                logger.info(f"ℹ️ No unanswered messages in conversation {conversation_id}")
                return True
            
            # Analyze if response is needed
            analysis = self.analyze_catchup_context(unanswered_messages, conversation, user_id)
            
            if not analysis:
                logger.warning(f"⚠️ Could not analyze conversation {conversation_id}")
                return False
            
            # Get additional context for response generation
            new_message_context = {
                "accountId": account_id,
                "conversationId": conversation_id,
                "listingMapId": listing_map_id
            }
            
            property_details = get_property_details(new_message_context)
            amenities_detail = get_amenities_detail(new_message_context)
            reservation_details = get_reservations(user_id, listing_map_id)
            
            # Generate catchup response
            catchup_response = self.generate_catchup_response(
                analysis, unanswered_messages, conversation, 
                property_details, amenities_detail, reservation_details, user_id
            )
            
            if catchup_response:
                # Send the catchup response
                message_data = {
                    "accountId": account_id,
                    "conversationId": conversation_id,
                    "listingMapId": listing_map_id,
                    "body": catchup_response
                }
                
                gpt_response_data = {"answer": catchup_response}
                latest_message = unanswered_messages[-1].get("content", "") if unanswered_messages else ""
                
                result = await send_message(message_data, gpt_response_data, latest_message, user_id, listing_map_id)
                
                if result:
                    logger.info(f"✅ Sent catchup response for conversation {conversation_id}")
                    return True
                else:
                    logger.error(f"❌ Failed to send catchup response for conversation {conversation_id}")
                    return False
            else:
                logger.info(f"ℹ️ No catchup response needed for conversation {conversation_id}")
                return True
                
        except Exception as e:
            logger.error(f"❌ Error processing catchup for conversation {conversation_id}: {e}")
            return False
    
    async def trigger_ai_catchup(self, user_id: int, chat_id: int) -> Dict:
        """
        Main function to trigger AI catchup when AI is toggled back on.
        
        Args:
            user_id: User ID
            chat_id: Chat/conversation ID that was just enabled
            
        Returns:
            Dictionary with catchup results
        """
        try:
            logger.info(f"🚀 Starting AI catchup for user {user_id}, chat {chat_id}")
            
            db = next(get_db())
            
            # Get user's Hostaway accounts
            hostaway_accounts = db.query(HostawayAccount).filter(
                HostawayAccount.user_id == user_id,
                HostawayAccount.is_active == True
            ).all()
            
            if not hostaway_accounts:
                logger.warning(f"⚠️ No active Hostaway accounts for user {user_id}")
                return {"success": False, "message": "No active Hostaway accounts found"}
            
            results = {
                "success": True,
                "processed_conversations": 0,
                "sent_responses": 0,
                "errors": []
            }
            
            # Process catchup for each account
            for account in hostaway_accounts:
                try:
                    # For now, we'll process the specific chat_id
                    # In a full implementation, you might want to get all conversations
                    # and filter for ones that need catchup
                    
                    # Get listing_map_id - this would need to be passed or retrieved
                    # For now, using a placeholder - you'll need to get this from the conversation context
                    listing_map_id = 0  # TODO: Get actual listing_map_id
                    
                    success = await self.process_conversation_catchup(
                        chat_id, user_id, account.account_id, listing_map_id
                    )
                    
                    results["processed_conversations"] += 1
                    if success:
                        results["sent_responses"] += 1
                        
                except Exception as e:
                    error_msg = f"Error processing account {account.account_id}: {str(e)}"
                    logger.error(f"❌ {error_msg}")
                    results["errors"].append(error_msg)
            
            logger.info(f"✅ AI catchup completed for user {user_id}. Processed: {results['processed_conversations']}, Sent: {results['sent_responses']}")
            return results
            
        except Exception as e:
            logger.error(f"❌ Error in AI catchup for user {user_id}: {e}")
            return {"success": False, "message": f"Catchup failed: {str(e)}"}

# Global instance
ai_catchup_service = AICatchupService()
