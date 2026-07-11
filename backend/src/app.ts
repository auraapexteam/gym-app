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


// Centralized Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
