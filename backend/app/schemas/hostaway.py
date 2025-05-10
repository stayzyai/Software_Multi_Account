from pydantic import BaseModel
from typing import Optional

class HostawayAuthentication(BaseModel):
    account_id: str
    secret_id: str

class UpsellData(BaseModel):
    id: Optional[int] = None
    name: str
    discount: str
    detect_upsell_days: str
    upsell_message: str
    nights_exist: int
    gap_time: str

class UpsellStatusUpdate(BaseModel):
    upsell_id: int
    enabled: bool
