from pydantic import BaseModel, EmailStr
from enum import Enum
from typing import Optional, List
from datetime import datetime

class Role(str, Enum):
    user = "user"
    admin = "admin"

class UserCreate(BaseModel):
    firstname: str
    lastname: str
    email: str
    password: str
    role: Optional[Role] = Role.user.value

class ChatAIStatusModel(BaseModel):
    id: int
    chat_id: int
    listing_id: int
    is_active: bool
    user_id: int
    ai_enabled: bool
    class Config:
        from_attributes = True  
        
class ListingModel(BaseModel):
    id: int
    listing_id: int
    is_active: bool
    user_id: int
    class Config:
        from_attributes = True        

class UserProfile(BaseModel):
    id: int
    firstname: str
    lastname: str
    email: str
    role: Role
    created_at: datetime
    ai_enable: Optional[bool]
    chat_list: List[ChatAIStatusModel] 

    class Config:
        from_attributes = True    

class UserLogin(BaseModel):
    email: str
    password: str
    role: str

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    id: int
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    email: str

class UserDelete(BaseModel):
    id: int
class ResetPasswordRequest(BaseModel):
    new_password: str
    token: str
class TokenRefreshRequest(BaseModel):
    token: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ChatRequest(BaseModel):
    prompt: str
    max_tokens: int = 300
    messsages: Optional[str] = None

class EmailRequest(BaseModel):
    userEmail: EmailStr
    subject: str
    body: str
