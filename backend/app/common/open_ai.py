import os
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()
import logging
from app.data.prompt import get_prompt
client = OpenAI(api_key=os.getenv("CHAT_GPT_API_KEY"))

def get_gpt_response(mode_id, prompt, content):
    try:
        chat_completion = client.chat.completions.create(
            model=mode_id,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": content}
            ]
        )
        response = chat_completion.choices[0].message.content
        return response
    except Exception as e:
        logging.info(f"Error at get gpt response {e}")
        return None

def nearby_spots_gpt_response(data, max_tokens=200):
    try:
        prompt = get_prompt(data)
        chat_completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens = max_tokens
        )
        response = chat_completion.choices[0].message.content
        return response
    except Exception as e:
        logging.error(f"Error in get_gpt_response: {e}")
        return None


def gpt_taskCreation(prompt, max_tokens=300):
    try:
        chat_completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens = max_tokens
        )
        response = chat_completion.choices[0].message.content
        return response
    except Exception as e:
        logging.error(f"Error in get_gpt_response: {e}")
        return None
