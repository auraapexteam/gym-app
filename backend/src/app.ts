import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

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
