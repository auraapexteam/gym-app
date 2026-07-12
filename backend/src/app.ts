import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import planRoutes from './routes/plan';
import subscriptionRoutes from './routes/subscription';
import webhookRoutes from './routes/webhook';

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['*'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like native mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Webhook endpoint needs the RAW string body to verify the signature.
// By placing it BEFORE express.json(), we can parse the body as text.
app.use('/webhooks/razorpay', express.text({ type: '*/*' }), webhookRoutes);

app.use(express.json());

// Register API Routes
app.use('/plans', planRoutes);
app.use('/subscriptions', subscriptionRoutes);

// Health Check Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Backend is healthy and running.' });
});


import { AppError } from './utils/appError';
import { logger } from './utils/logger';

// Centralized Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  if (process.env.NODE_ENV !== 'production' || isOperational) {
    res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal Server Error',
    });
  } else {
    // Log unexpected errors
    logger.error(err, 'Unhandled Developer Error');
    res.status(500).json({
      success: false,
      message: 'Something went wrong on the server',
    });
  }
});

export default app;
