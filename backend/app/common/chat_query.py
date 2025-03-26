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

CHAT_DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "chat_interaction.jsonl")
EVAL_RESULTS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "eval_results.jsonl")

def evaluate_chat_response(prompt, completion, reference_answer=None, context=None, retrieval_context=None):

    if not DEEPEVAL_AVAILABLE:
        store_evaluation_results(prompt, completion, results)
        return results
    
    try:        
        # For v2.6.3, use the proper retrieval_context parameter
        test_case = LLMTestCase(
            input=prompt,
            actual_output=completion,
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
            store_evaluation_results(prompt, completion, results)
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
    
    if total_metrics > 0:
        average_score = sum(v.get("score", 0) for v in results.values() if isinstance(v, dict) and v.get("score") is not None) / sum(1 for v in results.values() if isinstance(v, dict) and v.get("score") is not None)
        logger.info(f"Evaluation summary: {passed_metrics}/{total_metrics} metrics passed with average score {average_score:.2f}")
    
    store_evaluation_results(prompt, completion, results)
    
    return results

def store_evaluation_results(prompt, completion, results):
    try:
        logger.debug(f"Preparing to store evaluation results in: {EVAL_RESULTS_FILE}")
        eval_data = {
            "prompt": prompt,
            "completion": completion,
            "evaluation": results,
            "timestamp": get_current_time()
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
        
        print(f"Evaluation results summary: {', '.join(result_items)}")
    except Exception as e:
        logger.error(f"Error storing evaluation results: {str(e)}")
        logger.debug(f"Store results exception traceback: {traceback.format_exc()}")
        logger.debug(f"Was trying to write to: {os.path.abspath(EVAL_RESULTS_FILE)}")
        
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
    """
    Calculate the great-circle distance between two points
    on the Earth (specified in decimal degrees).
    Returns distance in meters.
    """
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

def get_average_response_quality(days=30):
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

        # Compute overall averages
        overall_avg = {period: 0 for period in ["previous", "recent"]}
        for period in ["previous", "recent"]:
            if metrics_averages[period]:
                overall_avg[period] = sum(metrics_averages[period].values()) / len(metrics_averages[period])

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

def get_message_stats(days=30):
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
        
        logger.info(f"Counted {current_period_messages} automated messages in the last {days} days")
        return {"total_messages": current_period_messages, "percentage_change": percentage_change}

    except Exception as e:
        logger.error(f"Error counting messages: {str(e)}")
        logger.debug(f"Count messages exception traceback: {traceback.format_exc()}")
        return {"total_messages": 0, "percentage_change": None, "error": str(e)}

def store_chat(interaction_data):
    try:
        # Ensure data directory exists
        data_dir = os.path.dirname(CHAT_DATA_FILE)
        if not os.path.exists(data_dir):
            logger.debug(f"Creating data directory: {data_dir}")
            os.makedirs(data_dir, exist_ok=True)
            
        with open(CHAT_DATA_FILE, "a") as file:
            chat_format = {
                "messages": [
                    {"role": "user", "content": interaction_data["prompt"]},
                    {"role": "assistant", "content": interaction_data["completion"]}
                ]
            }
            json.dump(chat_format, file)
            file.write("\n")
            
        logger.info("Chat response saved in JSON file.")
        logger.debug(f"Chat data saved to: {os.path.abspath(CHAT_DATA_FILE)}")

        # Run evaluation after storing the chat
        if interaction_data.get("evaluate", False):
            logger.debug("Evaluation flag is True, proceeding with evaluation")
            evaluate_chat_response(interaction_data["prompt"], interaction_data["completion"])
        else:
            logger.debug("Evaluation flag not set, skipping evaluation")
            evaluate_chat_response(interaction_data["prompt"], interaction_data["completion"])
    except Exception as e:
        logger.error(f"Error storing chat data: {str(e)}")
        logger.debug(f"Store chat exception traceback: {traceback.format_exc()}")


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
