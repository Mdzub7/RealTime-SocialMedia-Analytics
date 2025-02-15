import { io, Socket as SocketType } from 'socket.io-client';

interface ServerToClientEvents {
  'analytics_update': (data: {
    total_tweets: number;
    sentiment_counts: Record<string, number>;
    trending: Array<{ tag: string; count: number }>;
    recent_count: number;
  }) => void;
  'new_tweet': (tweet: {
    id: string;
    text: string;
    sentiment: string;
    created_at: string;
  }) => void;
  'wordcloud_update': (data: {
    live_image: string;
    historical_image: string;
  }) => void;
  'initial_data': (data: {
    sentiment_counts: Record<string, number>;
    trending_words: Array<{ word: string; count: number }>;
  }) => void;
}

interface ClientToServerEvents {
  'connect': () => void;
  'disconnect': () => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080';

export const socket = io(SOCKET_URL, {
  transports: ['polling', 'websocket'],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  timeout: 20000,
  path: '/socket.io',
  withCredentials: false
}) as SocketType<ServerToClientEvents, ClientToServerEvents>;

export const connectSocket = () => {
  if (!socket.connected) {
    console.log('Attempting to connect to WebSocket...');
    
    socket.io.opts.transports = ['polling', 'websocket'];
    socket.connect();
    
    socket.on('connect', () => {
      console.log('✅ Socket connected successfully');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      if (socket.io.opts.transports.includes('websocket')) {
        socket.io.opts.transports = ['polling'];
        socket.connect();
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected, attempting to reconnect...');
    });
  }
};