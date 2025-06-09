from datetime import timedelta
from app.common.hostaway_setup import hostaway_post_request, hostaway_get_request
import time
import json


def process_upsell_opportunities(reservations, upsells, today, hostaway_token):
    reservations.sort(key=lambda x: x['arrivalDate'])

    for i, res in enumerate(reservations):
        guest_name = res['guestName']
        arrival = res['arrivalDate'].date()
        departure = res['departureDate'].date()
        stay_nights = (departure - arrival).days

        # === PRE-STAY GAP ===
        if i > 0:
            prev_departure = reservations[i - 1]['departureDate'].date()
            gap_before = (arrival - prev_departure).days
            if gap_before >= 1:
                for upsell in upsells:
                    if upsell.name.lower() == "pre-stay gap night" and upsell.enabled:
                        # Check minimum gap nights required
                        if gap_before >= upsell.nights_exist:
                            detect_day = arrival - timedelta(days=int(upsell.detect_upsell_days.split()[0]))
                            if today == detect_day:
                                message = upsell.upsell_message.format(
                                    guest_name=guest_name,
                                    discount=f"{upsell.discount}%"
                                )
                                print(f"📩 PRE-STAY upsell to {guest_name}: {message}")
                                conversations_response = hostaway_get_request(hostaway_token, "conversations")
                                conversations = json.loads(conversations_response).get('result', [])
                                matching_ids = [conv["id"] for conv in conversations if conv["reservationId"] == res['id']]
                                print("------matching_ids--------------", matching_ids)
                                conversationId = matching_ids[0]
                                body = {"body": message, "communicationType": "channel"}
                                if conversationId:
                                    hostaway_post_request(hostaway_token, f"conversations/{conversationId}/messages", body)
                                    print("message sent successfully for this guest", guest_name)
                                print("------res--------------", res)

        # === POST-STAY GAP ===
        if i < len(reservations) - 1:
            next_arrival = reservations[i + 1]['arrivalDate'].date()
            gap_after = (next_arrival - departure).days
            if gap_after >= 1:
                for upsell in upsells:
                    if upsell.name.lower() == "post stay gap night" and upsell.enabled:
                        if gap_after >= upsell.nights_exist:
                            detect_day = departure - timedelta(days=int(upsell.detect_upsell_days.split()[0]))
                            if today == detect_day:
                                message = upsell.upsell_message.format(
                                    guest_name=guest_name,
                                    discount=f"{upsell.discount}%"
                                )
                                print(f"📩 POST-STAY upsell to {guest_name}: {message}")
                                conversations_response = hostaway_get_request(hostaway_token, "conversations")
                                conversations = json.loads(conversations_response).get('result', [])
                                matching_ids = [conv["id"] for conv in conversations if conv["reservationId"] == res['id']]
                                print("------matching_ids--------------", matching_ids)
                                conversationId =  matching_ids[0]
                                body = {"body": message, "communicationType": "channel"}
                                if conversationId:
                                    hostaway_post_request(hostaway_token, f"conversations/{conversationId}/messages", body)
                                    print("message sent successfully for this guest", guest_name)
                                print("------res--------------", res)

        # === LATE CHECKOUT (current staying guest) ===
        if arrival <= today < departure:
            for upsell in upsells:
                if upsell.name.lower() == "late checkout" and upsell.enabled:
                    if stay_nights >= upsell.nights_exist:
                        detect_day = departure - timedelta(days=int(upsell.detect_upsell_days.split()[0]))
                        if today == detect_day:
                            message = upsell.upsell_message.format(
                                guest_name=guest_name,
                                discount=f"{upsell.discount}%",
                                listing_city=res.get('city', 'your city')
                            )
                            print(f"📩 LATE CHECKOUT upsell to {guest_name}: {message}")
                            conversations_response = hostaway_get_request(hostaway_token, "conversations")
                            conversations = json.loads(conversations_response).get('result', [])
                            matching_ids = [conv["id"] for conv in conversations if conv["reservationId"] == res['id']]
                            print("------matching_ids--------------", matching_ids)
                            conversationId = matching_ids[0]
                            body = {"body": message, "communicationType": "channel"}
                            if conversationId:
                                hostaway_post_request(hostaway_token, f"conversations/{conversationId}/messages", body)
                                print("message sent successfully for this guest", guest_name)
                            print("------res--------------", res)

        # === EARLY CHECK-IN ===
        if i > 0:
            prev_departure = reservations[i - 1]['departureDate'].date()
            gap_before = (arrival - prev_departure).days
            if gap_before >= 1:
                for upsell in upsells:
                    if upsell.name.lower() == "early check in" and upsell.enabled:
                        if gap_before >= upsell.nights_exist:
                            detect_day = arrival - timedelta(days=int(upsell.detect_upsell_days.split()[0]))
                            if today == detect_day:
                                message = upsell.upsell_message.format(
                                    guest_name=guest_name,
                                    discount=f"{upsell.discount}%"
                                )
                                print(f"📩 EARLY CHECK-IN upsell to {guest_name}: {message}")
                                conversations_response = hostaway_get_request(hostaway_token, "conversations")
                                conversations = json.loads(conversations_response).get('result', [])
                                matching_ids = [conv["id"] for conv in conversations if conv["reservationId"] == res['id']]
                                print("------matching_ids--------------", matching_ids)
                                conversationId = matching_ids[0]
                                body = {"body": message, "communicationType": "channel"}
                                if conversationId:
                                    hostaway_post_request(hostaway_token, f"conversations/{conversationId}/messages", body)
                                    print("message sent successfully for this guest", guest_name)
                                print("------res--------------", res)
