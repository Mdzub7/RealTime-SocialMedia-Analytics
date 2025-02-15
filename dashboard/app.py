import matplotlib
matplotlib.use('Agg')

# Core imports
from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from kafka import KafkaConsumer
from datetime import datetime, timedelta
from sqlalchemy import func, desc, and_, text
import json
import threading
import time
import logging
import re
from collections import Counter
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import io
import base64
from database import save_tweet, SessionLocal, Tweet, init_db

# Constants
KAFKA_TOPIC = 'social_media_data'
KAFKA_BROKER = 'localhost:9092'
word_counter = Counter()

# Flask and SocketIO setup
app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'secret!'
# Update SocketIO initialization
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True,
    ping_timeout=60,
    ping_interval=25,
    async_mode='threading'  # Remove transport list to allow automatic negotiation
)

# Update the consume_kafka function
def consume_kafka():
    while True:
        try:
            print("Attempting to connect to Kafka...")
            consumer = KafkaConsumer(
                KAFKA_TOPIC,
                bootstrap_servers=KAFKA_BROKER,
                auto_offset_reset='earliest',
                value_deserializer=lambda v: json.loads(v.decode('utf-8'))
            )
            print("✅ Successfully connected to Kafka")
            
            for message in consumer:
                try:
                    tweet = message.value
                    print(f"📨 Received tweet: {tweet['text'][:50]}...")
                    
                    # Get thread-local session
                    session = SessionLocal()
                    try:
                        # Create and add tweet to session
                        tweet_obj = Tweet(text=tweet["text"], sentiment=tweet["sentiment"])
                        session.add(tweet_obj)
                        session.flush()
                        session.refresh(tweet_obj)
                        
                        # Get the tweet data before committing
                        tweet_data = {
                            "id": str(tweet_obj.id),
                            "text": tweet_obj.text,
                            "sentiment": tweet_obj.sentiment,
                            "created_at": tweet_obj.created_at.isoformat()
                        }
                        
                        # Commit the transaction
                        session.commit()
                        
                        # Emit the tweet data after successful commit
                        socketio.emit('new_tweet', tweet_data, namespace='/tweets')
                        print("✅ Tweet saved and emitted to clients")
                        
                        # Emit analytics update
                        emit_analytics_update()
                        
                    except Exception as e:
                        session.rollback()
                        logger.error(f"Database error: {str(e)}")
                        raise
                    finally:
                        session.remove()  # Remove thread-local session
                        
                except Exception as e:
                    print(f"❌ Error processing message: {str(e)}")
                    continue
                    
        except Exception as e:
            print(f"❌ Kafka consumer error: {str(e)}")
            time.sleep(5)

# Add a connection event handler with namespace
@socketio.on('connect', namespace='/tweets')
def handle_tweets_connect():
    print("Client connected to tweets namespace")

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize database
logger.info("Initializing database...")
init_db()

# Helper functions
def clean_text(text):
    return ' '.join(re.sub(r'[^a-zA-Z\s]', '', text.lower()).split())

def get_historical_word_counter():
    counter = Counter()
    session = SessionLocal()
    try:
        tweets = session.query(Tweet.text).all()
        for tweet in tweets:
            words = [w for w in clean_text(tweet[0]).split() if len(w) > 3]
            counter.update(words)
        return counter
    finally:
        session.close()

def generate_wordcloud(word_counter):
    if not word_counter:
        return None
    
    wordcloud = WordCloud(width=800, height=400, background_color='white').generate_from_frequencies(word_counter)
    
    plt.figure(figsize=(10, 5))
    plt.imshow(wordcloud, interpolation='bilinear')
    plt.axis('off')
    
    img = io.BytesIO()
    plt.savefig(img, format='png', bbox_inches='tight')
    img.seek(0)
    
    return base64.b64encode(img.getvalue()).decode()

# API Routes
@app.route("/")
def test_route():
    return jsonify({"status": "Flask server is running"})

@app.route("/api/tweets/live")
def get_live_tweets():
    try:
        session = SessionLocal()
        tweets = session.query(Tweet).order_by(Tweet.created_at.desc()).all()  # Removed the limit(50)
        if not tweets:
            return jsonify([])
            
        return jsonify([{
            "id": str(tweet.id),
            "text": tweet.text,
            "sentiment": tweet.sentiment,
            "created_at": tweet.created_at.isoformat()
        } for tweet in tweets])
    except Exception as e:
        logger.error(f"Error fetching tweets: {str(e)}")
        return jsonify({"error": "Database error"}), 500
    finally:
        session.close()

@app.route("/api/analytics/summary")
def get_analytics_summary():
    session = SessionLocal()
    try:
        total_tweets = session.query(func.count(Tweet.id)).scalar()
        sentiment_distribution = dict(
            session.query(Tweet.sentiment, func.count(Tweet.id))
            .group_by(Tweet.sentiment)
            .all()
        )
        
        historical_counter = get_historical_word_counter()
        trending_words = [
            {"word": word, "count": count} 
            for word, count in historical_counter.most_common(10)
        ]
        
        hourly_data = session.query(
            func.date_trunc('hour', Tweet.created_at).label('hour'),
            Tweet.sentiment,
            func.count(Tweet.id).label('count')
        ).group_by(
            'hour',
            Tweet.sentiment
        ).order_by('hour').all()

        return jsonify({
            "total_tweets": total_tweets,
            "sentiment_distribution": sentiment_distribution,
            "trending_words": trending_words,
            "hourly_data": [
                {
                    "hour": hour.isoformat(),
                    "sentiment": sentiment,
                    "count": count
                }
                for hour, sentiment, count in hourly_data
            ]
        })
    finally:
        session.close()

@app.route("/api/trends/hourly")
def get_hourly_trends():
    session = SessionLocal()
    try:
        last_24_hours = datetime.utcnow() - timedelta(hours=24)
        hourly_data = session.query(
            func.date_trunc('hour', Tweet.created_at).label('hour'),
            Tweet.sentiment,
            func.count(Tweet.id).label('count')
        ).filter(
            Tweet.created_at >= last_24_hours
        ).group_by(
            'hour',
            Tweet.sentiment
        ).order_by('hour').all()

        return jsonify([{
            "hour": hour.isoformat(),
            "sentiment": sentiment,
            "count": count
        } for hour, sentiment, count in hourly_data])
    finally:
        session.close()

@app.route("/api/trends/realtime")
def get_realtime_trends():
    session = SessionLocal()
    try:
        last_hour = datetime.utcnow() - timedelta(hours=1)
        recent_tweets = session.query(Tweet).filter(
            Tweet.created_at >= last_hour
        ).all()

        counter = Counter()
        for tweet in recent_tweets:
            words = [w for w in clean_text(tweet.text).split() if len(w) > 3]
            counter.update(words)

        return jsonify({
            "trending_words": [
                {"word": word, "count": count}
                for word, count in counter.most_common(10)
            ],
            "total_recent": len(recent_tweets)
        })
    finally:
        session.close()

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Route not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500

# WebSocket handlers
@socketio.on('connect')
def handle_connect():
    logger.info("Client connected")
    emit_initial_data()

def emit_initial_data():
    try:
        session = SessionLocal()
        sentiment_counts = dict(
            session.query(Tweet.sentiment, func.count(Tweet.id))
            .group_by(Tweet.sentiment)
            .all()
        )
        historical_counter = get_historical_word_counter()
        
        socketio.emit('initial_data', {
            'sentiment_counts': sentiment_counts,
            'trending_words': [
                {"word": word, "count": count} 
                for word, count in historical_counter.most_common(10)
            ]
        })
    finally:
        session.close()

def emit_analytics_update():
    session = SessionLocal()
    try:
        total_tweets = session.query(func.count(Tweet.id)).scalar()
        sentiment_counts = dict(
            session.query(Tweet.sentiment, func.count(Tweet.id))
            .group_by(Tweet.sentiment)
            .all()
        )
        historical_counter = get_historical_word_counter()
        
        last_hour = datetime.utcnow() - timedelta(hours=1)
        recent_count = session.query(func.count(Tweet.id)).filter(
            Tweet.created_at >= last_hour
        ).scalar()

        socketio.emit('analytics_update', {
            'total_tweets': total_tweets,
            'sentiment_counts': sentiment_counts,
            'trending': [
                {"tag": word, "count": count} 
                for word, count in historical_counter.most_common(10)
            ],
            'recent_count': recent_count
        })
    finally:
        session.close()

# Add near the top with other imports
from flask_socketio import emit

# Update the consume_kafka function
def consume_kafka():
    running = True
    while running:
        try:
            print("Attempting to connect to Kafka...")
            consumer = KafkaConsumer(
                KAFKA_TOPIC,
                bootstrap_servers=KAFKA_BROKER,
                auto_offset_reset='earliest',
                value_deserializer=lambda v: json.loads(v.decode('utf-8')),
                consumer_timeout_ms=1000  # Add timeout to allow checking for shutdown
            )
            print("✅ Successfully connected to Kafka")
            
            try:
                for message in consumer:
                    try:
                        tweet = message.value
                        print(f"📨 Received tweet: {tweet['text'][:50]}...")
                        
                        saved_tweet = save_tweet(tweet["text"], tweet["sentiment"])
                        
                        socketio.emit('new_tweet', {
                            "id": str(saved_tweet.id),
                            "text": tweet["text"],
                            "sentiment": tweet["sentiment"],
                            "created_at": saved_tweet.created_at.isoformat()
                        }, namespace='/tweets')
                        
                        print("✅ Tweet emitted to clients")
                        
                    except Exception as e:
                        print(f"❌ Error processing message: {str(e)}")
                        continue
            finally:
                consumer.close()
                    
        except Exception as e:
            print(f"❌ Kafka consumer error: {str(e)}")
            time.sleep(5)

if __name__ == "__main__":
    init_db()
    threading.Thread(target=consume_kafka, daemon=True).start()
    socketio.run(
        app,
        debug=True,
        port=8080,
        host='0.0.0.0',
        allow_unsafe_werkzeug=True,
        use_reloader=False  # Disable reloader to prevent duplicate Kafka consumers
    )