from pydantic import BaseModel, EmailStr, Field
from enum import Enum
from typing import Optional, List
from datetime import datetime
import uuid

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
    # New fields with defaults to maintain backward compatibility
    text: Optional[str] = None
    user_id: Optional[str] = None
    thread_id: Optional[str] = None
    listingName: Optional[str] = None
    listingMapId: Optional[int] = None

    # Original fields
    prompt: Optional[str] = ""
    max_tokens: int = 300
    messsages: Optional[str] = None
    username: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    class Config:
        from_attributes = True
    
    def __init__(self, **data):
        super().__init__(**data)
        # If text is not provided but prompt is, use prompt as text
        if self.text is None and self.prompt:
            self.text = self.prompt
        # If text is not provided and prompt is empty, set a default
        elif self.text is None and not self.prompt:
            self.text = ""
        
        # If no user_id is provided, create a default
        if self.user_id is None:
            self.user_id = str(uuid.uuid4())

class EmailRequest(BaseModel):
    userEmail: EmailStr
    subject: str
    body: str
