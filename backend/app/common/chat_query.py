import json
import os
import logging

CHAT_DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "chat_interaction.jsonl")

def store_chat(interaction_data):
    with open(CHAT_DATA_FILE, "a") as file:
        chat_format = {
        "messages": [
            {"role": "user", "content": interaction_data["prompt"]},
            {"role": "assistant", "content": interaction_data["completion"]}
            ]
        }
        json.dump(chat_format, file)
        file.write("\n")
    logging.info("Chat response saved in JSON file.")
