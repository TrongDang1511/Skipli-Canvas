import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { isFirebaseInitialized } from './config/firebase.config';

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

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
