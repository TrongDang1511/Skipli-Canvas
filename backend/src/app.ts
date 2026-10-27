import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { isFirebaseInitialized } from './config/firebase.config';
import { env } from './config/env.config';

const app = express();

// Global Middlewares
app.use(cors({
  origin: env.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Skipli Canvas Backend is running',
    timestamp: new Date().toISOString(),
    firebaseConnected: isFirebaseInitialized
  });
});

// API Routes
app.use('/api', routes);

// Global Error Handling Middleware
app.use(errorHandler);

export default app;
