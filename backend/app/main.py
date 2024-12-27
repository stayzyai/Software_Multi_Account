from fastapi import FastAPI
from app.database.db import Base, engine
from app.routers.main import main_router
from fastapi.middleware.cors import CORSMiddleware
import logging

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

@app.get("/")
async def root():
   return {"message": "working"}
