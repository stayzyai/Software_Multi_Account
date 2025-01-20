from sqlalchemy import Column, Integer, String, Enum, DateTime, func, ForeignKey
from app.database.db import Base
import enum

class Role(enum.Enum):
    user = "user"
    admin = "admin"

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True, nullable=False)
    firstname = Column(String, nullable=False)
    lastname = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(Role), default=Role.user)
    refresh_token = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<User(id={self.id}, firstname={self.firstname}, lastname={self.lastname}, email={self.email}, role={self.role})>"
class ChromeExtensionToken(Base):
    __tablename__ = "chrome_extension_token"
    id = Column(Integer, primary_key=True, nullable=False)
    key = Column(String, unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

class HostawayAccount(Base):
    __tablename__ = "hostawayaccounts"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String, nullable=False)
    secret_id = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    hostaway_token = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    expires_at = Column(DateTime, nullable=False)

    def __repr__(self):
        return f"<HostawayAccount(id={self.id}, account_id={self.account_id}, user_id={self.user_id})>"
