from datetime import timedelta, datetime
from app.common.hostaway_setup import hostaway_post_request, hostaway_get_request
import time
import json
from zoneinfo import ZoneInfo


def is_within_time_window(target_time, current_time, window_minutes=30):
    """Check if current time is within window_minutes of target time"""
    time_diff = abs((current_time - target_time).total_seconds() / 60)
    print("------time_diff--------------", time_diff)
    return time_diff <= window_minutes


def process_upsell_opportunities(reservations, upsells, today, hostaway_token):
    reservations.sort(key=lambda x: x['arrivalDate'])
    # Get current time in IST
    # print("------reservations--------------", reservations)
    current_time = datetime.now(ZoneInfo("Asia/Kolkata"))

    for i, res in enumerate(reservations):
        guest_name = res['guestName']
        print("------guest_name--------------", guest_name)
        arrival = res['arrivalDate'].date()
        departure = res['departureDate'].date()
        stay_nights = (departure - arrival).days
        print("------arrival--------------", arrival)
        print("------departure--------------", departure)
        print("------stay_nights--------------", stay_nights)   

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
                                # Parse gap_time from upsell and convert to IST
                                try:
                                    gap_time = datetime.strptime(upsell.gap_time.strip(), "%I:%M %p").time()
                                    target_datetime = datetime.combine(today, gap_time)
                                    target_datetime = target_datetime.replace(tzinfo=ZoneInfo("Asia/Kolkata"))
                                    print("------target_datetime--------------", target_datetime)
                                    print("------current_time--------------", current_time)
                                    
                                    if is_within_time_window(target_datetime, current_time):
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
                                            response = hostaway_post_request(hostaway_token, f"conversations/{conversationId}/messages", body)
                                            data = json.loads(response)
                                            if data['status'] == 'success':
                                                print("message sent successfully for this guest", guest_name)
                                                print("data----->", data)
                                            else:
                                                print("Message send failed: ", data)
                                        print("------res--------------", res)
                                except ValueError as e:
                                    print(f"Error parsing time format for upsell: {e}")
                                    continue

        # === POST-STAY GAP ===
        if i < len(reservations) - 1:
            print("------POST-STAY GAP --------")
            next_arrival = reservations[i + 1]['arrivalDate'].date()
            print("------next_arrival--------------", next_arrival)
            gap_after = (next_arrival - departure).days
            print("-  POST-STAY GAP-----gap_after--------------", gap_after)
            if gap_after >= 1:
                for upsell in upsells:
                    if upsell.name.lower() == "post stay gap night" and upsell.enabled:
                        print(f"Checking post-stay gap night for guest {guest_name}")
                        print(f"Departure date: {departure}")
                        print(f"Next arrival date: {next_arrival}")
                        print(f"Gap after: {gap_after}")
                        print(f"Upsell nights_exist: {upsell.nights_exist}")
                        print(f"Detect upsell days: {upsell.detect_upsell_days}")
                        if gap_after >= upsell.nights_exist:
                            detect_day = departure - timedelta(days=int(upsell.detect_upsell_days.split()[0]))
                            print(f"Detect day: {detect_day}")
                            print(f"Today: {today}")
                            print("detect_day from post stay gap night", detect_day, "offers:-->", upsell.discount)
                            if today == detect_day:
                                try:
                                    gap_time = datetime.strptime(upsell.gap_time.strip(), "%I:%M %p").time()
                                    print("gap_time------------>", gap_time)
                                    target_datetime = datetime.combine(today, gap_time)
                                    target_datetime = target_datetime.replace(tzinfo=ZoneInfo("Asia/Kolkata"))
                                    print("------target_datetime didiasjsa--------------", target_datetime)
                                    print("------current_tim sapaspase--------------", current_time)
                                    
                                    if is_within_time_window(target_datetime, current_time):
                                        message = upsell.upsell_message.format(
                                            guest_name=guest_name,
                                            discount=f"{upsell.discount}%"
                                        )
                                        print(f"📩 POST-STAY upsell to {guest_name}: {message}")
                                        conversations_response = hostaway_get_request(hostaway_token, "conversations")
                                        conversations = json.loads(conversations_response).get('result', [])
                                        matching_ids = [conv["id"] for conv in conversations if conv["reservationId"] == res['id']]
                                        print("------matching_ids--------------", matching_ids)
                                        conversationId = matching_ids[0]
                                        body = {"body": message, "communicationType": "channel"}
                                        if conversationId:
                                            response = hostaway_post_request(hostaway_token, f"conversations/{conversationId}/messages", body)
                                            data = json.loads(response)
                                            if data['status'] == 'success':
                                                print("message sent successfully for this guest", guest_name)
                                                print("data----->", data)
                                            else:
                                                print("Message send failed: ", data)
                                        print("------res--------------", res)
                                except ValueError as e:
                                    print(f"Error parsing time format for upsell: {e}")
                                    continue

        # === LATE CHECKOUT (current staying guest) ===
        if arrival <= today < departure:
            print("------LATE CHECKOUT --------")
            for upsell in upsells:
                if upsell.name.lower() == "late checkout" and upsell.enabled:
                    if stay_nights >= upsell.nights_exist:
                        detect_day = departure - timedelta(days=int(upsell.detect_upsell_days.split()[0]))
                        if today == detect_day:
                            try:
                                gap_time = datetime.strptime(upsell.gap_time.strip(), "%I:%M %p").time()
                                target_datetime = datetime.combine(today, gap_time)
                                target_datetime = target_datetime.replace(tzinfo=ZoneInfo("Asia/Kolkata"))
                                print("------target_datetime--------------", target_datetime)
                                print("------current_time--------------", current_time)
                                
                                if is_within_time_window(target_datetime, current_time):
                                    message = upsell.upsell_message.format(
                                        guest_name=guest_name,
                                        discount=f"{upsell.discount}%",
                                    )
                                    print(f"📩 LATE CHECKOUT upsell to {guest_name}: {message}")
                                    conversations_response = hostaway_get_request(hostaway_token, "conversations")
                                    conversations = json.loads(conversations_response).get('result', [])
                                    matching_ids = [conv["id"] for conv in conversations if conv["reservationId"] == res['id']]
                                    print("------matching_ids--------------", matching_ids)
                                    conversationId = matching_ids[0]
                                    body = {"body": message, "communicationType": "channel"}
                                    if conversationId:
                                        response = hostaway_post_request(hostaway_token, f"conversations/{conversationId}/messages", body)
                                        data = json.loads(response)
                                        if data['status'] == 'success':
                                            print("message sent successfully for this guest", guest_name)
                                            print("data----->", data)
                                        else:
                                            print("Message send failed: ", data)
                                    print("------res--------------", res)
                            except ValueError as e:
                                print(f"Error parsing time format for upsell: {e}")
                                continue

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
                                try:
                                    gap_time = datetime.strptime(upsell.gap_time.strip(), "%I:%M %p").time()
                                    target_datetime = datetime.combine(today, gap_time)
                                    target_datetime = target_datetime.replace(tzinfo=ZoneInfo("Asia/Kolkata"))
                                    print("------target_datetime--------------", target_datetime)
                                    print("------current_time--------------", current_time)
                                    
                                    if is_within_time_window(target_datetime, current_time):
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
                                            response = hostaway_post_request(hostaway_token, f"conversations/{conversationId}/messages", body)
                                            data = json.loads(response)
                                            if data['status'] == 'success':
                                                print("message sent successfully for this guest", guest_name)
                                                print("data----->", data)
                                            else:
                                                print("Message send failed: ", data)
                                            print("message sent successfully for this guest", guest_name)
                                        print("------res--------------", res)
                                except ValueError as e:
                                    print(f"Error parsing time format for upsell: {e}")
                                    continue
