from pydantic import BaseModel
import enum
from typing import List
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
class Role(str, enum.Enum):
    user = "user"
    admin = "admin"
class UserList(BaseModel):
    id: int
    firstname: str
    lastname: str
    email: str
    role: Role
    created_at: datetime
    class Config:
        from_attributes = True
class UserResponse(BaseModel):
    message: str
    data: List[UserList]
    total_count: int
class UsersDetailResponse(BaseModel):
    detail: UserResponse
class UserUpdateSchema(BaseModel):
    id: int
    email: Optional[str] = None
    firstname: Optional[str] = None
    lastname: Optional[str] = None 
    password: Optional[str] = None 
    class Config:
        from_attributes = True
