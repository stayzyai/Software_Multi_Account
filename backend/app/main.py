from fastapi import FastAPI
from app.database.db import Base, engine
from app.routers.main import main_router
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.common.chat_gpt_assistant import train_chat_gpt
from apscheduler.schedulers.background import BackgroundScheduler
from app.service.send_upshell_opportunity import check_and_send_upsells
from app.websocket import sio_app

Base.metadata.create_all(bind=engine)
app = FastAPI()

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__) 

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(main_router)

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(check_and_send_upsells, 'cron', hour=11, minute=55)
    scheduler.start()

@app.on_event("startup")
async def startup_event():
    start_scheduler()

app.mount("/", sio_app)

@app.get("/api")
async def root():
   return {"message": "working"}
