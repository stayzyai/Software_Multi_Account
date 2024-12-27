import os
import openai
import time
from dotenv import load_dotenv
import logging

load_dotenv()
openai.api_key = os.getenv("CHAT_GPT_API_KEY")

CHAT_DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "chat_interaction.jsonl")


def get_latest_model_id():
    try:
        models = openai.Model.list()
        stayzy_models = [model for model in models['data'] if model.get("owned_by") == "stayzy"]
        if stayzy_models:
            latest_model = max(stayzy_models, key=lambda model: model['created'])
            print(latest_model)
            return latest_model["id"]
    except Exception as e:
        print(f"Error retrieving models: {e}")
