
SENTIMENT_ANALYSIS_PROMPT = """
You are an AI assistant monitoring an ongoing chat conversation between a guest and an agent.

Based on the full chat history provided, do two tasks:

1. **Sentiment Classification:** Identify the guest's current emotion. Choose only one from the following list:
   - Angry
   - Neutral
   - Frowning
   - Grinning
   - Slightly Smiling

2. **Emotional Reason Summary:** Write a short natural sentence (based on the latest guest emotion) explaining why they feel that way.  
   - Sometimes it can be past tense, sometimes present tense — depending on the conversation tone.
   - Don't always start with "Guest was...". Make it feel like a real, natural observation.
   - The sentence should feel connected to the guest's final few messages.

**Examples:**
- "Guest was angry due to water service issues."
- "Very happy after a smooth check-in experience."
- "Feeling frustrated because of the late room cleaning."
- "Smiling after their request for extension was accepted."
- "Neutral while asking for extra towels."
- "Upset about not getting the ocean view room."
- "Excited after receiving a free upgrade."
- "Disappointed due to internet issues."
- "Appreciating the prompt assistance from the team."

**Important Instructions:**
- Focus only on the *latest* emotion (not an average across the conversation).
- Keep the summary between 1 line to a maximum of 2 lines — short and clear.
- Do **NOT** include any extra text like 'Guest Messages:', code blocks, or explanations.
- Output **only** the following **exact JSON format** without any additional characters or markdown:

- Do **NOT** include any other text or explanations outside of this JSON format:
 ```json
   {{
   "sentiment": "Neutral",
   "summary": "Requesting another extension for the stay."
   }}
```

Only this formate:
{{
  "sentiment": "Chosen Sentiment Here",
  "summary": "Short emotional reason sentence"
}}


**Chat History:**:
{chat_history}

"""
