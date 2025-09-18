from pydantic import BaseModel
from typing import Optional, List

class HostawayAuthentication(BaseModel):
    account_id: str
    secret_id: str
    account_name: Optional[str] = None  # User-friendly name

class HostawayAccountResponse(BaseModel):
    id: int
    account_id: str
    secret_id: str
    account_name: Optional[str]
    is_active: bool
    created_at: str
    expires_at: str

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
