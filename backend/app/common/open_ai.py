import os
import openai
from dotenv import load_dotenv
load_dotenv()

openai.api_key = os.environ.get("CHAT_GPT_API_KEY")

def get_gpt_response(mode_id, prompt, content):
    try:
        chat_completion = openai.ChatCompletion.create(
            model=mode_id,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": content}
            ]
        )
        return chat_completion
    except Exception as e:
        print(f"Error at get gpt response: {e}")
        return None
