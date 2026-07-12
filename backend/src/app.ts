import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import planRoutes from './routes/plan';
import subscriptionRoutes from './routes/subscription';
import webhookRoutes from './routes/webhook';

const app = express();

// Middlewares
app.use(cors());

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
    console.error('Unhandled Developer Error:', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong on the server',
    });
  }
});

export default app;
