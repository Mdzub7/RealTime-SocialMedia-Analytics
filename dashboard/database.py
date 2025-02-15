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
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Database configuration
DB_USER = os.getenv('DB_USER', 'admin')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'admin')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'twitter_data')

# Single database URL configuration
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/social_media_analytics"

# Database configuration
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def get_db_connection():
    try:
        engine = create_engine(DATABASE_URL)  # Changed from DB_URL to DATABASE_URL
        engine.connect()
        logger.info("Successfully connected to PostgreSQL database!")
        return engine
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        raise

Base = declarative_base()

class Tweet(Base):
    __tablename__ = 'tweets'
    
    id = Column(Integer, primary_key=True)
    text = Column(Text, nullable=False)
    sentiment = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

engine = get_db_connection()
SessionLocal = sessionmaker(bind=engine)

def init_db():
    try:
        Base.metadata.create_all(engine)
        logger.info("Database tables created successfully!")
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")
        raise

def save_tweet(text, sentiment):
    db = SessionLocal()
    try:
        tweet = Tweet(text=text, sentiment=sentiment)
        db.add(tweet)
        db.commit()
        return tweet
    finally:
        db.close()

def init_db():
    try:
        Base.metadata.create_all(engine)
        session = SessionLocal()
        # Test if tweets table exists and has data
        count = session.query(Tweet).count()
        logger.info(f"Found {count} tweets in database")
        if count > 0:
            sample = session.query(Tweet).first()
            logger.info(f"Sample tweet: {sample.text[:50]}...")
        session.close()
        return True
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        return False