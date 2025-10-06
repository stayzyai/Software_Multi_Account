from sqlalchemy import Column, Integer, String, Enum, DateTime, func, ForeignKey, Boolean, JSON
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
    profile_url = Column(String, default=None)
    ai_schedule = Column(JSON, nullable=True)  # AI schedule settings
    twilio_settings = Column(JSON, nullable=True)  # Twilio WhatsApp settings

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
    account_name = Column(String, nullable=True)  # User-friendly name for the account
    is_active = Column(Boolean, default=True, nullable=False)  # Active/inactive status
    created_at = Column(DateTime, default=func.now(), nullable=False)
    expires_at = Column(DateTime, nullable=False)

    def __repr__(self):
        return f"<HostawayAccount(id={self.id}, account_id={self.account_id}, user_id={self.user_id}, account_name={self.account_name})>"
    
# class Listings(Base):
#     __tablename__ = "listings"
#     id = Column(Integer, primary_key=True, index=True)
#     listing_id = Column(Integer, unique=True, index=True)
#     is_active = Column(Boolean, default=False, nullable=False)
#     user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)

class Subscription(Base):
    __tablename__ = 'subscriptions'

    id = Column(Integer, primary_key=True, index=True, nullable=False)
    stripe_subscription_id = Column(String, unique=True, nullable=False)
    stripe_customer_id = Column(String, nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    email = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    payment_at = Column(DateTime, nullable=False)
    expire_at = Column(DateTime, nullable=False)

    def __repr__(self):
        return (
            f"<Subscription(id={self.id}, "
            f"stripe_subscription_id={self.stripe_subscription_id}, "
            f"stripe_customer_id={self.stripe_customer_id}, "
            f"is_active={self.is_active}, "
            f"user_id={self.user_id}, "
            f"created_at={self.created_at}, "
            f"payment_at={self.payment_at}, "
            f"expire_at={self.expire_at}, "
        )

class Upsell(Base):
    __tablename__ = "upsell_offers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    discount = Column(String, index=True)
    detect_upsell_days = Column(String)
    upsell_message = Column(String)
    enabled = Column(Boolean, default=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    nights_exist = Column(Integer, default=1)
    gap_time = Column(String, default=None)

class ChatAIStatus(Base):
    __tablename__ = "chat_ai_status"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    chat_id = Column(Integer, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)
    ai_enabled = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)

class UserError(Base):
    __tablename__ = "user_errors"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    error_type = Column(String, nullable=False)  # e.g., "Authentication", "API", "Data Sync"
    error_message = Column(String, nullable=False)
    endpoint = Column(String, nullable=True)  # Which API endpoint had the error
    is_resolved = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<UserError(id={self.id}, user_id={self.user_id}, error_type={self.error_type}, is_resolved={self.is_resolved})>"
    