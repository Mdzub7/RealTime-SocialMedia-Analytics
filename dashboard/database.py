from sqlalchemy import create_engine, Column, Integer, String, DateTime, text
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime
import logging
import time
from sqlalchemy.exc import OperationalError

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def get_db_connection(max_retries=5, retry_delay=2):
    retry_count = 0
    while retry_count < max_retries:
        try:
            DB_URL = "postgresql://admin:admin@localhost:5432/twitter_data"
            engine = create_engine(DB_URL)
            # Test connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                logger.info("Database connection successful!")
            return engine
        except OperationalError as e:
            retry_count += 1
            logger.warning(f"Database connection attempt {retry_count} failed. Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
    
    raise Exception("Failed to connect to database after multiple attempts")

engine = get_db_connection()
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class Tweet(Base):
    __tablename__ = "tweets"
    id = Column(Integer, primary_key=True, autoincrement=True)
    text = Column(String, nullable=False)
    sentiment = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

def save_tweet(text, sentiment):
    session = SessionLocal()
    try:
        tweet = Tweet(text=text, sentiment=sentiment)
        session.add(tweet)
        session.commit()
        logger.info(f"Tweet saved successfully: {text[:50]}...")
    except Exception as e:
        session.rollback()
        logger.error(f"Error saving tweet: {str(e)}")
    finally:
        session.close()

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