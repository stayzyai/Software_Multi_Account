import socketio
from app.service.ai_enable import send_auto_ai_messages

# sio_server = socketio.AsyncServer(async_mode='asgi',cors_allowed_origins='*')
sio_server = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins="*")
sio_app = socketio.ASGIApp(sio_server)

@sio_server.event
def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio_server.event
async def disconnect(sid, reason):
    await sio_server.emit("user_disconnected", {"sid": sid}, skip_sid=sid)
    # print(f"Client disconnected: {sid}")

async def handle_webhook(data):
    send_auto_ai_messages(data)
    await sio_server.emit("received_message", data)

@sio_server.event
async def send_message(sid, message):
    print(f"Message received from {sid}: {message}")
    await sio_server.emit("notify", {"message": message})

@sio_server.event
async def handle_reservation(reservation):
    print(f"Message reservation received from: {reservation}")
    await sio_server.emit("new_reservation", {"reservation": reservation})

async def update_checkout_date(data):
    print(f"Checkout date updated : {data}")
    await sio_server.emit("checkout_date_updated", {"data": data})
