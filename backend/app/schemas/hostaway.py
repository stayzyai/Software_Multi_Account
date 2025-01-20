from pydantic import BaseModel
from typing import Optional

class HostawayAuthentication(BaseModel):
    account_id: str
    secret_id: str
