import json
import os
import logging
import math

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
