import logging
from fastapi import HTTPException
from app.data.sentiment_prompt import SENTIMENT_ANALYSIS_PROMPT

def get_sentiment_prompt(chat_data):
    try:
        prompt = SENTIMENT_ANALYSIS_PROMPT.format(chat_history=chat_data)
        return prompt
    except Exception as e:
        logging.error(f"Error at issue detection {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
