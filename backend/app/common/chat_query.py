import json
import os
import logging
import math
import traceback
from datetime import datetime, timedelta
import deepeval
from dotenv import load_dotenv

load_dotenv()
# Set up more detailed logging
logging.basicConfig(
    level=logging.DEBUG, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('deepeval_integration')

# Handle possible DeepEval import errors
try:
    # Try to import from DeepEval 2.6.3
    try:
        logger.debug("Attempting to import from DeepEval 2.6.3...")
        # Use the imports from the __init__ files which should expose the classes
        from deepeval.metrics import AnswerRelevancyMetric
        from deepeval.metrics import FaithfulnessMetric
        from deepeval.metrics import HallucinationMetric
        from deepeval.test_case import LLMTestCase
        
        # Set flags based on successful imports
        DEEPEVAL_AVAILABLE = True
        HALLUCINATION_METRIC_AVAILABLE = True
        
        # Map the new metrics to the old names for compatibility
        RelevanceMetric = AnswerRelevancyMetric
        FactualConsistencyMetric = FaithfulnessMetric
        CoherenceMetric = None  # No direct equivalent
        FluencyMetric = None    # No direct equivalent
        
        logger.info("Using DeepEval v2.6.3")
            
    except ImportError as v2_error:
        try:
            from deepeval.metrics import (
                RelevanceMetric,
                FactualConsistencyMetric,
                CoherenceMetric,
                FluencyMetric,
            )
            from deepeval.test_case import LLMTestCase
            
            # Check if HallucinationMetric is available
            try:
                from deepeval.metrics import HallucinationMetric
                HALLUCINATION_METRIC_AVAILABLE = True
                logger.debug("HallucinationMetric successfully imported")
            except ImportError:
                HALLUCINATION_METRIC_AVAILABLE = False
                logger.debug("HallucinationMetric not available in v0.20.2")
                
            DEEPEVAL_AVAILABLE = True
            logger.info("Using DeepEval v0.20.2")
                
        except ImportError as v02_error:
            logger.warning(f"DeepEval could not be imported. v2.x error: {str(v2_error)}, v0.20.2 error: {str(v02_error)}")
            DEEPEVAL_AVAILABLE = False
            HALLUCINATION_METRIC_AVAILABLE = False
except Exception as e:
    logger.warning(f"Unexpected error while importing DeepEval: {str(e)}")
    logger.debug(f"Import exception traceback: {traceback.format_exc()}")
    DEEPEVAL_AVAILABLE = False
    HALLUCINATION_METRIC_AVAILABLE = False

# Use the real data file instead of test data
CHAT_DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "chat_interaction.jsonl")
EVAL_RESULTS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "eval_results.jsonl")

def store_chat(interaction_data):
    """
    Store chat interaction data in a JSONL file and optionally evaluate the response.

    Args:
        interaction_data (dict): Dictionary containing:
            - prompt: The user's message
            - completion: The assistant's response
            - received_timestamp: When the user message was received (optional)
            - response_timestamp: When the response was generated (optional)
            - evaluate: Whether to evaluate the response (optional)
    """
    logger.debug(f"Storing chat interaction in: {CHAT_DATA_FILE}")
    logger.debug(f"Interaction data keys: {interaction_data.keys()}")

    try:
        # Ensure data directory exists
        data_dir = os.path.dirname(CHAT_DATA_FILE)
        if not os.path.exists(data_dir):
            logger.debug(f"Creating data directory: {data_dir}")
            os.makedirs(data_dir, exist_ok=True)

        # Get current time as default timestamp
        current_time = datetime.now().isoformat()

        # Get timestamps from interaction_data or use current time as fallback
        received_timestamp = interaction_data.get("received_timestamp", current_time)
        response_timestamp = interaction_data.get("response_timestamp", current_time)
        user_id = interaction_data.get("user_id", None)

        # Log the timestamps for debugging
        logger.debug(f"Message received at: {received_timestamp}")
        logger.debug(f"Response generated at: {response_timestamp}")

        with open(CHAT_DATA_FILE, "a") as file:
            chat_format = {
                "messages": [
                    {"role": "user", "content": interaction_data["prompt"], "timestamp": received_timestamp},
                    {"role": "assistant", "content": interaction_data["completion"], "timestamp": response_timestamp}
                ],
                "timestamp": current_time,
                "received_timestamp": received_timestamp,
                "response_timestamp": response_timestamp,
                "user_id": user_id
            }
            logger.debug(f"Formatted chat data for storage with {len(chat_format['messages'])} messages")
            json.dump(chat_format, file)
            file.write("\n")

        logger.info("Chat response saved in JSON file.")
        logger.debug(f"Chat data saved to: {os.path.abspath(CHAT_DATA_FILE)}")

        # Run evaluation after storing the chat
        if interaction_data.get("evaluate", False):
            logger.debug("Evaluation flag is True, proceeding with evaluation")
            evaluate_chat_response(interaction_data["prompt"], interaction_data["completion"], user_id=user_id)
        else:
            logger.debug("Evaluation flag not set, skipping evaluation")
            evaluate_chat_response(interaction_data["prompt"], interaction_data["completion"], user_id=user_id)
    except Exception as e:
        logger.error(f"Error storing chat data: {str(e)}")
        logger.debug(f"Store chat exception traceback: {traceback.format_exc()}")

def evaluate_chat_response(prompt, completion, reference_answer=None, context=None, retrieval_context=None, user_id=None):

    if not DEEPEVAL_AVAILABLE:
        store_evaluation_results(prompt, completion, results, user_id)
        return results

    try:
        # Create a test case for evaluation - adapting to both v0.20.2 and v2.6.3 APIs
        logger.debug("Creating LLMTestCase with parameters:")
        logger.debug(f"  input: {prompt[:50]}...")

        # Handle the case where completion is a dictionary
        if isinstance(completion, dict):
            logger.debug(f"  actual_output: {str(completion)[:100]}...")
            actual_output = str(completion)
        else:
            logger.debug(f"  actual_output: {completion[:50]}...")
            actual_output = completion

        # For v2.6.3, use the proper retrieval_context parameter
        test_case = LLMTestCase(
            input=prompt,
            actual_output=actual_output,
            expected_output=reference_answer if reference_answer else None,
            context=context if context else None,
            retrieval_context=retrieval_context if retrieval_context else context  # Use context as retrieval_context if not provided
        )        
        # Set up evaluation metrics based on available classes
        metrics = []
        logger.debug("Setting up metrics...")

        # Add metrics based on what's available (handle both v0.20.2 and v2.6.3)
        if RelevanceMetric is not None:
            openai_api_key = os.environ.get("OPENAI_API_KEY")
            logger.debug(f"OpenAI API key available: {openai_api_key is not None}")
            metrics.append(RelevanceMetric(threshold=0.7))
            logger.debug(f"RelevanceMetric initialized with threshold=0.7")
        else:
            logger.debug("RelevanceMetric is not available")
        if FactualConsistencyMetric is not None:
            # For v2.6.3, FaithfulnessMetric requires retrieval_context
            has_retrieval_context = (retrieval_context is not None) or (context is not None)

            if has_retrieval_context:
                logger.debug("Adding FactualConsistencyMetric with threshold=0.5")
                metrics.append(FactualConsistencyMetric(threshold=0.5))
            else:
                logger.debug("Skipping FactualConsistencyMetric - no retrieval_context available")
        else:
            logger.debug("FactualConsistencyMetric is not available")

        # Only add CoherenceMetric if it's available (v0.20.2)
        if CoherenceMetric is not None:
            metrics.append(CoherenceMetric(threshold=0.7))  # Check coherence
        else:
            logger.debug("CoherenceMetric is not available")

        if FluencyMetric is not None:
            logger.debug("Adding FluencyMetric with threshold=0.7")
            metrics.append(FluencyMetric(threshold=0.7))  # Check fluency
        else:
            logger.debug("FluencyMetric is not available")

        # Add hallucination metric if context is provided and the metric is available
        if context and HALLUCINATION_METRIC_AVAILABLE:
            logger.debug("Adding HallucinationMetric with threshold=0.5")
            metrics.append(HallucinationMetric(threshold=0.5))
        else:
            logger.debug(f"Skipping HallucinationMetric - context exists: {context is not None}, metric available: {HALLUCINATION_METRIC_AVAILABLE}")

        logger.debug(f"Created {len(metrics)} metrics for evaluation")

        # If no metrics are available, log a warning
        if not metrics:
            logger.warning("No metrics could be initialized. Check DeepEval version compatibility.")
            results = {
                "error": "No metrics could be initialized. Check DeepEval version compatibility."
            }
            store_evaluation_results(prompt, completion, results, user_id)
            return results

        # Run evaluation
        results = {}
        for metric in metrics:
            try:
                metric_name = metric.__class__.__name__
                logger.debug(f"Evaluating with {metric_name}")
                logger.debug(f"Metric object: {metric}")

                # Handle both v0.20.2 'measure()' and v2.6.3 'evaluate()' methods
                if hasattr(metric, 'measure'):
                    logger.debug(f"Using 'measure' method for {metric_name}")
                    metric.measure(test_case)
                elif hasattr(metric, 'evaluate'):
                    logger.debug(f"Using 'evaluate' method for {metric_name}")
                    metric.evaluate(test_case)
                else:
                    logger.warning(f"Metric {metric_name} has no evaluate/measure method")
                    continue

                # Extract results - format may differ between versions
                metric_result = {
                    "score": getattr(metric, "score", None),
                    "passed": getattr(metric, "passed", False)
                }

                logger.debug(f"{metric_name} evaluation result - score: {metric_result['score']}, passed: {metric_result['passed']}")

                # For DeepEval v2.6.3, manually check if the score meets the threshold
                # since the "passed" flag might not be correctly set
                if metric_result["score"] is not None and hasattr(metric, "threshold"):
                    threshold = getattr(metric, "threshold", 0.7)  # Default threshold
                    manually_passed = metric_result["score"] >= threshold

                    # If the auto-passed flag doesn't match what we expect, override it
                    if manually_passed != metric_result["passed"]:
                        logger.debug(f"Overriding 'passed' status for {metric_name}: {metric_result['passed']} -> {manually_passed} (score: {metric_result['score']}, threshold: {threshold})")
                        metric_result["passed"] = manually_passed

                # Add reason if available
                if hasattr(metric, "reason"):
                    metric_result["reason"] = metric.reason
                    logger.debug(f"{metric_name} reason: {metric.reason}")
                elif hasattr(metric, "reasons"):
                    metric_result["reason"] = "; ".join(metric.reasons)
                    logger.debug(f"{metric_name} reasons: {metric.reasons}")
                else:
                    logger.debug(f"{metric_name} has no reason/reasons attribute")

                results[metric_name] = metric_result
            except Exception as e:
                logger.error(f"Error evaluating with {metric.__class__.__name__}: {str(e)}")
                logger.debug(f"Evaluation exception traceback: {traceback.format_exc()}")
                results[metric.__class__.__name__] = {
                    "error": str(e)
                }
    except Exception as e:
        logger.error(f"Error during evaluation: {str(e)}")
        logger.debug(f"Evaluation exception traceback: {traceback.format_exc()}")
        results = {
            "error": f"Evaluation failed: {str(e)}"
        }

    # Store evaluation results
    logger.debug(f"Storing evaluation results: {results}")

    # Summarize evaluation results
    total_metrics = len(results)
    passed_metrics = sum(1 for v in results.values() if isinstance(v, dict) and v.get("passed", False))

    # Count metrics with valid scores
    metrics_with_scores = sum(1 for v in results.values() if isinstance(v, dict) and v.get("score") is not None)

    if total_metrics > 0 and metrics_with_scores > 0:
        average_score = sum(v.get("score", 0) for v in results.values() if isinstance(v, dict) and v.get("score") is not None) / metrics_with_scores
        logger.info(f"Evaluation summary: {passed_metrics}/{total_metrics} metrics passed with average score {average_score:.2f}")
    else:
        logger.info(f"Evaluation summary: {passed_metrics}/{total_metrics} metrics passed, but no metrics with scores")

    store_evaluation_results(prompt, completion, results, user_id)

    return results

def store_evaluation_results(prompt, completion, results, user_id=None):
    try:
        logger.debug(f"Preparing to store evaluation results in: {EVAL_RESULTS_FILE}")
        eval_data = {
            "prompt": prompt,
            "completion": completion,
            "evaluation": results,
            "timestamp": get_current_time(),
            "user_id": user_id
        }
        logger.debug(f"Serializing evaluation data with timestamp: {eval_data['timestamp']}")
        
        with open(EVAL_RESULTS_FILE, "a") as file:
            json.dump(eval_data, file)
            file.write("\n")
            
        logger.info("Evaluation results saved successfully.")
        logger.debug(f"Results saved to: {os.path.abspath(EVAL_RESULTS_FILE)}")
        
        # Print condensed version of results for console visibility
        result_items = []
        for k, v in results.items():
            if isinstance(v, dict) and "score" in v:
                result_items.append(f"{k}: {v['score']}")
            else:
                result_items.append(f"{k}: {v}")
        
    except Exception as e:
        logger.error(f"Error storing evaluation results: {str(e)}")

        # Check if directory exists and is writable
        eval_dir = os.path.dirname(EVAL_RESULTS_FILE)
        logger.debug(f"Evaluation directory exists: {os.path.exists(eval_dir)}")
        if os.path.exists(eval_dir):
            logger.debug(f"Evaluation directory is writable: {os.access(eval_dir, os.W_OK)}")

def get_current_time():
    """
    Get the current timestamp
    """
    return datetime.now().isoformat()

def haversine_distance(lat1, lon1, lat2, lon2):

    R = 6371000
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = R * c
    return distance

def calculate_percentage_change(previous_avg, recent_avg):
    if previous_avg == 0:
        return "N/A", True
    change = round(((recent_avg - previous_avg) / previous_avg) * 100, 2)
    return change, change > 0

def get_average_response_quality(days=30, user_id=None):
    """
    Calculate the average response quality and percentage change.
    
    Args:
        days (int): Number of days to include in the calculation
        
    Returns:
        dict: Average quality metrics including overall score, individual metric scores, and percentage change
    """
    try:
        if not os.path.exists(EVAL_RESULTS_FILE):
            logger.warning(f"Evaluation results file does not exist: {EVAL_RESULTS_FILE}")
            return {"average_score": 0, "total_evaluations": 0, "metrics": {}, "percentage_change": "N/A"}
        
        cutoff_date = datetime.now() - timedelta(days=days)
        mid_date = cutoff_date + timedelta(days=days // 2)

        results = {"previous": [], "recent": []}
        metrics_totals = {"previous": {}, "recent": {}}
        metrics_counts = {"previous": {}, "recent": {}}

        with open(EVAL_RESULTS_FILE, "r") as file:
            for line in file:
                try:
                    result = json.loads(line.strip())
                    if user_id is not None and str(result.get("user_id")) != str(user_id):
                        continue
                    timestamp = result.get("timestamp", "")
                    if not timestamp:
                        continue

                    date_obj = datetime.fromisoformat(timestamp)
                    period = "recent" if date_obj >= mid_date else "previous"

                    for metric_name, metric_data in result.get("evaluation", {}).items():
                        if isinstance(metric_data, dict) and "score" in metric_data:
                            score = metric_data["score"]
                            if score is not None:
                                metrics_totals[period][metric_name] = metrics_totals[period].get(metric_name, 0) + score
                                metrics_counts[period][metric_name] = metrics_counts[period].get(metric_name, 0) + 1
                    results[period].append(result)
                except json.JSONDecodeError:
                    logger.error(f"Error parsing evaluation result: {line}")
                    continue

        # Compute averages
        metrics_averages = {"previous": {}, "recent": {}}
        for period in ["previous", "recent"]:
            for metric_name in metrics_totals[period]:
                if metrics_counts[period][metric_name] > 0:
                    metrics_averages[period][metric_name] = metrics_totals[period][metric_name] / metrics_counts[period][metric_name]

        if not metrics_averages["recent"]:
            logger.warning("No valid scores found in recent evaluations.")
            return {
                "average_score": "N/A",
                "total_evaluations": len(results["recent"]) + len(results["previous"]),
                "metrics": {},
                "percentage_change": 0,
                "is_increase": False
            }

        # Compute overall averages
        overall_avg = {period: 0 for period in ["previous", "recent"]}
        for period in ["previous", "recent"]:
            if metrics_averages[period]:
                overall_avg[period] = sum(metrics_averages[period].values()) / len(metrics_averages[period])

        # If no recent evaluations, return fallback
        if not results["recent"]:
            logger.warning("No recent evaluations found for the specified period.")
            return {
                "average_score": "N/A",
                "total_evaluations": len(results["previous"]),
                "metrics": {},
                "percentage_change": 0,
                "is_increase": False
            }

        # Scale to 0-10 range for frontend display
        overall_score_recent = round(overall_avg["recent"] * 10, 1)
        percentage_change, is_increase = calculate_percentage_change(overall_avg["previous"], overall_avg["recent"])

        logger.info(f"Calculated average response quality: {overall_score_recent}/10 from {len(results['recent'])} recent evaluations")

        return {
            "average_score": f"{overall_score_recent} / 10",
            "total_evaluations": len(results["recent"]) + len(results["previous"]),
            "metrics": {k: f"{round(v * 10, 1)}/10" for k, v in metrics_averages["recent"].items()},
            "percentage_change": f"{percentage_change}%" if percentage_change != "N/A" else 0,
            "is_increase": is_increase
        }
    except Exception as e:
        logger.error(f"Error calculating average response quality: {str(e)}")
        logger.debug(f"Calculation exception traceback: {traceback.format_exc()}")
        return {"average_score": 0, "total_evaluations": 0, "error": str(e), "percentage_change": 0, "is_increase": False}

def get_message_stats(days=30, user_id=None):
    """
    Calculate statistics about automated messages.
    
    Args:
        days (int): Number of days to include in the calculation
        
    Returns:
        dict: Statistics about automated messages, including percentage change from the previous period.
    """
    try:
        if not os.path.exists(EVAL_RESULTS_FILE):
            logger.warning(f"Chat data file does not exist: {EVAL_RESULTS_FILE}")
            return {"total_messages": 0, "percentage_change": None}
        
        # Get the cutoff dates
        now = datetime.now()
        current_period_start = (now - timedelta(days=days)).isoformat()
        previous_period_start = (now - timedelta(days=2 * days)).isoformat()
        
        # Count messages in both periods
        current_period_messages = 0
        previous_period_messages = 0

        with open(EVAL_RESULTS_FILE, "r") as file:
            for line in file:
                try:
                    chat_data = json.loads(line.strip())
                    if user_id is not None and chat_data.get("user_id") != str(user_id):
                        continue
                    timestamp = chat_data.get("timestamp", "")
                    
                    if timestamp:
                        if timestamp >= current_period_start:
                            current_period_messages += 1
                        elif timestamp >= previous_period_start:
                            previous_period_messages += 1
                except json.JSONDecodeError:
                    logger.error(f"Error parsing chat data: {line}")
                    continue
        
        if previous_period_messages == 0:
            percentage_change = None if current_period_messages == 0 else 100.0
        else:
            percentage_change = ((current_period_messages - previous_period_messages) / previous_period_messages) * 100
        is_increase = percentage_change is not None and percentage_change > 0
        logger.info(f"Counted {current_period_messages} automated messages in the last {days} days")
        return {"total_messages": current_period_messages, "is_increase": is_increase, "percentage_change": percentage_change}

    except Exception as e:
        logger.error(f"Error counting messages: {str(e)}")
        logger.debug(f"Count messages exception traceback: {traceback.format_exc()}")
        return {"total_messages": 0, "percentage_change": None, "is_increase": False, "error": str(e)}

def count_task(days, tasks):
    today = datetime.utcnow()
    start_date = today - timedelta(days=days)

    task_dates = []
    for task in tasks.get('result', []):
        can_start_from = task.get("canStartFrom")
        if can_start_from:
            task_date = datetime.strptime(can_start_from, "%Y-%m-%d %H:%M:%S")
            task_dates.append(task_date)

    total_tasks = len(task_dates)
    recent_tasks = sum(1 for date in task_dates if date >= start_date)

    prev_start_date = start_date - timedelta(days=days)
    prev_total_tasks = sum(1 for date in task_dates if prev_start_date <= date < start_date)

    if prev_total_tasks == 0:
        percentage_change = 100 if recent_tasks > 0 else 0
    else:
        percentage_change = ((recent_tasks - prev_total_tasks) / prev_total_tasks) * 100

    return {
        "total_tasks": total_tasks,
        "recent_tasks": recent_tasks,
        "previous_total": prev_total_tasks,
        "percentage_change": round(percentage_change, 2),
        "is_increase": recent_tasks > prev_total_tasks
    }

def get_conversation_time_stats(days=30, user_id=None):
    """
    Calculate statistics about conversation response time (time between receiving a message and sending a response).
    For each conversation, calculate time of response - time of user message.

    Args:
        days (int): Number of days to include in the calculation

    Returns:
        dict: Statistics about conversation response time based on actual data
    """
    try:
        if not os.path.exists(CHAT_DATA_FILE):
            logger.warning(f"Chat data file does not exist: {CHAT_DATA_FILE}")
            return {"average_response_time": 0, "is_increase": False, "percentage_change": 0, "total_conversations": 0}

        # Count total conversations
        total_conversations = sum(1 for _ in open(CHAT_DATA_FILE))
        logger.info(f"Found {total_conversations} total conversations in the data file")

        # Get the cutoff date for filtering
        from datetime import datetime, timedelta
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        previous_cutoff_date = (datetime.now() - timedelta(days=days*2)).isoformat()

        logger.info(f"Analyzing conversation times from {cutoff_date} to now")
        logger.info(f"Previous period: {previous_cutoff_date} to {cutoff_date}")

        # Variables to store response times
        current_period_times = []
        previous_period_times = []

        # Flag to check if we found any conversations with timestamp data
        found_timestamps = False

        with open(CHAT_DATA_FILE, "r") as file:
            for line in file:
                try:
                    chat_data = json.loads(line.strip())
                    if user_id is not None and str(chat_data.get("user_id")) != str(user_id):
                        continue
                    timestamp = chat_data.get("timestamp", "")

                    logger.debug(f"Processing conversation with timestamp: {timestamp}")
                    logger.debug(f"Available keys in chat_data: {list(chat_data.keys())}")

                    # Skip entries outside our time range if timestamp exists
                    if timestamp and timestamp < previous_cutoff_date:
                        logger.debug(f"Skipping conversation - outside time range")
                        continue

                    # Calculate response time from messages
                    if "messages" in chat_data and len(chat_data["messages"]) >= 2:
                        logger.debug(f"Found {len(chat_data['messages'])} messages in conversation")
                        user_messages = [msg for msg in chat_data["messages"] if msg.get("role") == "user"]
                        assistant_messages = [msg for msg in chat_data["messages"] if msg.get("role") == "assistant"]

                        logger.debug(f"User messages: {len(user_messages)}, Assistant messages: {len(assistant_messages)}")

                        # For each user-assistant message pair in the conversation
                        for i in range(min(len(user_messages), len(assistant_messages))):
                            # Get timestamps - first check if messages have timestamps
                            user_timestamp = user_messages[i].get("timestamp")
                            assistant_timestamp = assistant_messages[i].get("timestamp")

                            logger.debug(f"Message pair {i+1}: User timestamp: {user_timestamp}, Assistant timestamp: {assistant_timestamp}")

                            # If messages don't have timestamps, use conversation-level timestamps as fallback
                            if user_timestamp is None and "received_timestamp" in chat_data:
                                user_timestamp = chat_data["received_timestamp"]
                                logger.debug(f"Using conversation received_timestamp as fallback: {user_timestamp}")

                            if assistant_timestamp is None and "response_timestamp" in chat_data:
                                assistant_timestamp = chat_data["response_timestamp"]
                                logger.debug(f"Using conversation response_timestamp as fallback: {assistant_timestamp}")

                            # Skip if we don't have both timestamps
                            if not user_timestamp or not assistant_timestamp:
                                logger.debug(f"Skipping message pair - missing timestamp(s)")
                                continue

                            # Convert timestamps to datetime objects if they're strings
                            if isinstance(user_timestamp, str):
                                try:
                                    user_timestamp = datetime.fromisoformat(user_timestamp)
                                except ValueError as e:
                                    logger.error(f"Invalid user timestamp format: {user_timestamp}, error: {str(e)}")
                                    continue

                            if isinstance(assistant_timestamp, str):
                                try:
                                    assistant_timestamp = datetime.fromisoformat(assistant_timestamp)
                                except ValueError as e:
                                    logger.error(f"Invalid assistant timestamp format: {assistant_timestamp}, error: {str(e)}")
                                    continue

                            # Calculate response time in seconds
                            if isinstance(user_timestamp, datetime) and isinstance(assistant_timestamp, datetime):
                                response_duration = (assistant_timestamp - user_timestamp).total_seconds()
                                logger.debug(f"Calculated response duration: {response_duration} seconds")
                                found_timestamps = True

                                # Only include positive durations (negative would indicate an issue with timestamps)
                                if response_duration > 0:
                                    # Determine which period this belongs to
                                    if not timestamp or timestamp >= cutoff_date:
                                        current_period_times.append(response_duration)
                                        logger.debug(f"Added to current period")
                                    else:  # It must be in the previous period
                                        previous_period_times.append(response_duration)
                                        logger.debug(f"Added to previous period")
                                else:
                                    logger.debug(f"Skipping negative response duration: {response_duration}")

                    # Handle legacy format where we only have conversation-level timestamps
                    elif "received_timestamp" in chat_data and "response_timestamp" in chat_data:
                        logger.debug(f"Using conversation-level timestamps (legacy format)")
                        received_time = chat_data["received_timestamp"]
                        response_time = chat_data["response_timestamp"]

                        logger.debug(f"Received timestamp: {received_time}, Response timestamp: {response_time}")

                        # Convert timestamps to datetime objects if they're strings
                        if isinstance(received_time, str):
                            try:
                                received_time = datetime.fromisoformat(received_time)
                            except ValueError as e:
                                logger.error(f"Invalid received_timestamp format: {received_time}, error: {str(e)}")
                                continue

                        if isinstance(response_time, str):
                            try:
                                response_time = datetime.fromisoformat(response_time)
                            except ValueError as e:
                                logger.error(f"Invalid response_timestamp format: {response_time}, error: {str(e)}")
                                continue

                        # Calculate response time in seconds
                        if isinstance(received_time, datetime) and isinstance(response_time, datetime):
                            response_duration = (response_time - received_time).total_seconds()
                            logger.debug(f"Calculated legacy response duration: {response_duration} seconds")
                            found_timestamps = True

                            # Only include positive durations
                            if response_duration > 0:
                                # Determine which period this belongs to
                                if not timestamp or timestamp >= cutoff_date:
                                    current_period_times.append(response_duration)
                                    logger.debug(f"Added to current period (legacy)")
                                else:  # It must be in the previous period
                                    previous_period_times.append(response_duration)
                                    logger.debug(f"Added to previous period (legacy)")
                            else:
                                logger.debug(f"Skipping negative response duration in legacy format: {response_duration}")
                    else:
                        logger.debug(f"No valid timestamps found for conversation. Messages: {'messages' in chat_data}, received_timestamp: {'received_timestamp' in chat_data}, response_timestamp: {'response_timestamp' in chat_data}")

                except (json.JSONDecodeError, ValueError) as e:
                    logger.error(f"Error parsing chat data for conversation time: {str(e)}")
                    continue

        logger.info(f"Processed {total_conversations} total conversations")
        logger.info(f"Found {len(current_period_times)} valid conversations with timestamps in current period")
        logger.info(f"Found {len(previous_period_times)} valid conversations with timestamps in previous period")

        # If no valid timestamps were found, return zeros instead of default values
        if not found_timestamps or not current_period_times:
            logger.warning("No usable timestamps found in conversations. Using zero values.")
            return {
                "average_response_time": 0,
                "is_increase": False,
                "percentage_change": 0,
                "total_conversations": total_conversations
            }

        # Calculate average response time
        average_response_time = 0
        if current_period_times:
            average_response_time = sum(current_period_times) / len(current_period_times)

        # Calculate percentage change
        previous_average = 0
        percentage_change = 0
        is_increase = False

        if previous_period_times:
            previous_average = sum(previous_period_times) / len(previous_period_times)
            if previous_average > 0:
                percentage_change = ((average_response_time - previous_average) / previous_average) * 100
                is_increase = average_response_time > previous_average
                logger.info(f"Previous period average: {previous_average:.2f} seconds")
                logger.info(f"Percentage change: {percentage_change:.1f}%, Is increase: {is_increase}")

        logger.info(f"Calculated average response time: {average_response_time:.2f} seconds from {len(current_period_times)} messages")

        return {
            "average_response_time": round(average_response_time, 2),  # No fallback value
            "is_increase": is_increase,
            "percentage_change": round(percentage_change, 1),
            "total_conversations": len(current_period_times) or total_conversations
        }
    except Exception as e:
        logger.error(f"Error calculating conversation time stats: {str(e)}")
        logger.debug(f"Calculation exception traceback: {traceback.format_exc()}")
        # Return zeros instead of default values
        return {"average_response_time": 0, "is_increase": False, "percentage_change": 0, "total_conversations": 0}
