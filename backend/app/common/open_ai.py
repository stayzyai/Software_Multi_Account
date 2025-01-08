import os
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()
import logging
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
