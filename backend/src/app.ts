import express from 'express';
import { corsMiddleware } from './middlewares/cors.middleware';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { isFirebaseInitialized } from './config/firebase.config';
import { env } from './config/env.config';
import { globalRateLimiter } from './middlewares/rateLimit.middleware';

const app = express();

if (env.trustProxy) {
  app.set('trust proxy', 1);
}

// Global Middlewares
app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Skipli Canvas Backend is running',
    timestamp: new Date().toISOString(),
    firebaseConnected: isFirebaseInitialized,
    clientIp: req.ip,
    trustProxy: !!env.trustProxy
  });
});

// API Routes
app.use('/api', globalRateLimiter);
app.use('/api', routes);

// Global Error Handling Middleware
app.use(errorHandler);

export default app;
