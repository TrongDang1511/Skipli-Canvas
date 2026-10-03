import express from 'express';
import cors from 'cors';
import { isFirebaseInitialized } from './config/firebase.config';

const app = express();

app.use(cors());
app.use(express.json());

// Health Check Route (Minimal test endpoint for initialization verification)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Skipli Canvas Backend initialized successfully',
    timestamp: new Date().toISOString(),
    firebaseConnected: isFirebaseInitialized
  });
});

export default app;
