from sqlalchemy import create_engine, Column, Integer, String, DateTime, text
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime
import logging
import time
from sqlalchemy.exc import OperationalError

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Update database URL to use Docker container
DATABASE_URL = "postgresql://postgres:postgres@postgres:5432/social_media_analytics"

def get_db_connection(max_retries=5, retry_delay=2):
    retry_count = 0
    while retry_count < max_retries:
        try:
            engine = create_engine(DATABASE_URL)
            # Test connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                logger.info("Successfully connected to PostgreSQL database!")
            return engine
        except OperationalError as e:
            retry_count += 1
            logger.warning(f"Database connection attempt {retry_count} failed. Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
    
    raise Exception("Failed to connect to database after multiple attempts")

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import logging
import time
from sqlalchemy.exc import OperationalError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/social_media_analytics"

# Create engine and session factory
engine = create_engine(DATABASE_URL)
session_factory = sessionmaker(bind=engine)
SessionLocal = scoped_session(session_factory)

# Create base class for declarative models
Base = declarative_base()
Base.query = SessionLocal.query_property()

class Tweet(Base):
    __tablename__ = 'tweets'
    
    id = Column(Integer, primary_key=True)
    text = Column(Text, nullable=False)
    sentiment = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

def get_db_connection(max_retries=5, retry_delay=2):
    retry_count = 0
    while retry_count < max_retries:
        try:
            with engine.connect() as conn:
                conn.execute(Text("SELECT 1"))
                logger.info("Successfully connected to PostgreSQL database!")
            return engine
        except OperationalError as e:
            retry_count += 1
            logger.warning(f"Database connection attempt {retry_count} failed. Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
    
    raise Exception("Failed to connect to database after multiple attempts")

def save_tweet(text, sentiment):
    session = SessionLocal()
    try:
        tweet = Tweet(text=text, sentiment=sentiment)
        session.add(tweet)
        session.flush()
        session.refresh(tweet)
        session.commit()
        return tweet
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.remove()

def init_db():
    try:
        Base.metadata.create_all(engine)
        session = SessionLocal()
        try:
            count = session.query(Tweet).count()
            logger.info(f"Found {count} tweets in database")
            if count > 0:
                sample = session.query(Tweet).first()
                logger.info(f"Sample tweet: {sample.text[:50]}...")
            return True
        finally:
            session.remove()
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        return False