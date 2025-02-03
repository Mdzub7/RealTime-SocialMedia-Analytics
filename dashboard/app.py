import matplotlib
matplotlib.use('Agg')  # Add this line at the very top before other imports

from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO
from kafka import KafkaConsumer
import json
import threading
from collections import Counter
import re
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import io
import base64
from database import save_tweet, SessionLocal, Tweet, init_db

from database import init_db, Tweet, SessionLocal
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize database tables
logger.info("Initializing database...")
init_db()

# Flask Setup
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'  # Add secret key
socketio = SocketIO(app, 
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True
)

# Kafka Configuration
KAFKA_TOPIC = "processed_tweets"
KAFKA_BROKER = "localhost:9092"

# Word Frequency Counter
word_counter = Counter()

def clean_text(text):
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-Z\s]", "", text)
    text = text.lower().strip()
    return text

# Add after existing imports
from sqlalchemy import Column, Integer, String, func
from collections import defaultdict

# Add new model in database.py first, then update app.py
def get_historical_word_counter():
    session = SessionLocal()
    try:
        tweets = session.query(Tweet).all()
        counter = Counter()
        for tweet in tweets:
            words = [w for w in clean_text(tweet.text).split() if len(w) > 3]
            counter.update(words)
        return counter
    finally:
        session.close()

# Update generate_wordcloud function
def generate_wordcloud(counter, width=800, height=400):
    try:
        plt.clf()
        if not counter:
            logger.warning("No words in counter for wordcloud")
            return None
            
        wordcloud = WordCloud(
            width=width, 
            height=height, 
            background_color='white',
            min_font_size=10
        ).generate_from_frequencies(counter)
        
        plt.figure(figsize=(10, 6))
        plt.imshow(wordcloud, interpolation='bilinear')
        plt.axis('off')
        
        img_io = io.BytesIO()
        plt.savefig(img_io, format='png', bbox_inches='tight', pad_inches=0)
        plt.close('all')
        img_io.seek(0)
        
        return base64.b64encode(img_io.getvalue()).decode('utf-8')
    except Exception as e:
        logger.error(f"Error generating wordcloud: {str(e)}")
        return None

# Add new route for historical wordcloud
@app.route("/get_historical_wordcloud")
def get_historical_wordcloud():
    try:
        historical_counter = get_historical_word_counter()
        wordcloud_image = generate_wordcloud(historical_counter)
        return jsonify({"image": wordcloud_image})
    except Exception as e:
        logger.error(f"Error generating historical wordcloud: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Update consume_kafka function
def consume_kafka():
    try:
        consumer = KafkaConsumer(
            KAFKA_TOPIC,
            bootstrap_servers=KAFKA_BROKER,
            auto_offset_reset='earliest',
            value_deserializer=lambda v: json.loads(v.decode('utf-8'))
        )
        
        for message in consumer:
            tweet = message.value
            text = clean_text(tweet["text"])
            sentiment = tweet["sentiment"]
            
            # Store in Database
            save_tweet(text, sentiment)
            
            # Update live word counter
            words = [w for w in text.split() if len(w) > 3]
            word_counter.update(words)
            
            # Generate and emit updates
            socketio.emit('new_tweet', {"text": text, "sentiment": sentiment})
            
            # Generate and emit both word clouds
            live_wordcloud = generate_wordcloud(word_counter)
            historical_wordcloud = generate_wordcloud(get_historical_word_counter())
            
            if live_wordcloud and historical_wordcloud:
                socketio.emit('wordcloud_update', {
                    "live_image": live_wordcloud,
                    "historical_image": historical_wordcloud
                })
            
            logger.info(f"Processed tweet: {text[:50]}...")
    except Exception as e:
        logger.error(f"Kafka consumer error: {str(e)}")

# Add new route to fetch stored tweets
from database import SessionLocal, Tweet, init_db

# Initialize database when app starts
init_db()

@app.route("/get_tweets")
def get_tweets():
    session = SessionLocal()
    try:
        # Test database connection
        test_query = session.query(Tweet).first()
        logger.info(f"Database connection test: {'Success' if test_query is not None else 'No data found'}")
        
        tweets = session.query(Tweet).order_by(Tweet.created_at.desc()).limit(20).all()
        logger.info(f"Retrieved {len(tweets)} tweets from database")
        
        tweet_data = [{
            "text": tweet.text,
            "sentiment": tweet.sentiment,
            "created_at": tweet.created_at.isoformat()
        } for tweet in tweets]
        return jsonify(tweet_data)
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        return jsonify([])
    finally:
        session.close()

@app.route("/")
def index():
    return render_template("index.html")

if __name__ == "__main__":
    # Start Kafka Consumer in Background Thread
    threading.Thread(target=consume_kafka, daemon=True).start()
    socketio.run(app, 
        debug=True, 
        port=8080,  # Changed port from 5000 to 8080
        host='0.0.0.0',
        allow_unsafe_werkzeug=True
    )