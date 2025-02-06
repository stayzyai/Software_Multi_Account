import logging

def get_prompt(data):
    try:
        prompt = f"""
        Summarize nearby places in a clear, engaging, and to-the-point manner. List restaurants, shopping malls, parks, and tourist attractions, including their names, addresses, and distances (in meters or kilometers).

        Format strictly as:
         - ‘There’s [Restaurant Name] at [Address], just [X meters] away.’
         - ‘You’ll find [Mall Name] at [Address], about [X km] from here.’
         - Avoid extra commentary—keep it direct and concise.

        Do NOT format like this:**
         - Avoid introductions like ‘Let me take you on a tour’ or ‘Here are some spots you might like.’
         - No unnecessary adjectives or descriptions like ‘cozy and European’ or ‘a great spot to unwind.’
         - Skip lengthy explanations—just list the places as shown above.

        Ensure clarity, brevity, and an engaging yet straightforward tone.

        Here is the location data: {data}
        """
        return prompt

    except Exception as e:
        logging.error(f"Error in get_prompt: {e}")
        return "An error occurred while generating the prompt."

