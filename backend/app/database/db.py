import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

# for local development uncomment the following code

from dotenv import load_dotenv 
load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv('SQLALCHEMY_DATABASE_URL')

# For local development, use SQLite if PostgreSQL connection fails
if not SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
    logger.warning("Using SQLite database for local development")

# SQLALCHEMY_DATABASE_URL = os.getenv('DATABASE_URL') # comment this line for local development

# Try to create engine with PostgreSQL, fallback to SQLite if connection fails
try:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_size=10,           # Base number of connections to maintain
        max_overflow=20,        # Additional connections beyond pool_size
        pool_timeout=30,        # Seconds to wait for connection from pool
        pool_recycle=3600,      # Recycle connections after 1 hour
        pool_pre_ping=True      # Verify connections before use
    )
    # Test the connection
    with engine.connect() as conn:
        logger.info("Successfully connected to PostgreSQL database")
except Exception as e:
    logger.warning(f"PostgreSQL connection failed: {e}")
    logger.info("Falling back to SQLite for local development")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}  # SQLite specific
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        # Log pool status for monitoring
        pool = engine.pool
        logger.debug(f"Pool status - Size: {pool.size()}, Checked out: {pool.checkedout()}, Overflow: {pool.overflow()}")
        yield db
    except Exception as e:
        logger.error(f"Database session error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()
