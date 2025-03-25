#!/usr/bin/env python3
"""
Utility script to batch evaluate chat interactions from an existing JSONL file.
"""

import json
import os
import logging
import sys
import argparse
from common.chat_query import evaluate_chat_response, CHAT_DATA_FILE

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

def batch_evaluate(input_file=None, sample_size=None):
    """
    Evaluate all chat interactions in the input file.
    
    Args:
        input_file (str): Path to the input JSONL file
        sample_size (int): Number of interactions to evaluate (None for all)
    """
    file_to_read = input_file if input_file else CHAT_DATA_FILE
    
    if not os.path.exists(file_to_read):
        logging.error(f"Input file not found: {file_to_read}")
        return
    
    logging.info(f"Reading chat interactions from {file_to_read}")
    
    interactions = []
    with open(file_to_read, 'r') as f:
        for line in f:
            try:
                interaction = json.loads(line.strip())
                interactions.append(interaction)
            except json.JSONDecodeError:
                logging.error(f"Invalid JSON line: {line}")
    
    if sample_size and sample_size < len(interactions):
        import random
        interactions = random.sample(interactions, sample_size)
    
    logging.info(f"Evaluating {len(interactions)} chat interactions")
    
    for i, interaction in enumerate(interactions):
        try:
            messages = interaction.get('messages', [])
            if len(messages) >= 2:
                user_message = next((m['content'] for m in messages if m['role'] == 'user'), None)
                assistant_message = next((m['content'] for m in messages if m['role'] == 'assistant'), None)
                
                if user_message and assistant_message:
                    logging.info(f"Evaluating interaction {i+1}/{len(interactions)}")
                    evaluate_chat_response(user_message, assistant_message)
        except Exception as e:
            logging.error(f"Error evaluating interaction {i+1}: {str(e)}")
    
    logging.info("Batch evaluation completed")

def main():
    parser = argparse.ArgumentParser(description='Batch evaluate chat interactions')
    parser.add_argument('--input', type=str, help='Path to input JSONL file')
    parser.add_argument('--sample', type=int, help='Number of interactions to evaluate')
    
    args = parser.parse_args()
    batch_evaluate(args.input, args.sample)

if __name__ == "__main__":
    main()
