import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { setupTracing } from './tracing/setup';
import { logger } from './utils/logger';
import { authRoutes } from './routes/auth';
import { sessionRoutes } from './routes/session';
import { credentialsRoutes } from './routes/credentials';
import { healthRoute } from './routes/health';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { DatabaseConnection } from './database/connection';
import { RedisConnection } from './cache/redis';

// Initialize distributed tracing
const sdk = setupTracing('auth-service');

const app = express();
const PORT = process.env.PORT || 8001;

// Initialize connections
const dbConnection = new DatabaseConnection();
const redisConnection = new RedisConnection();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration for multi-tenant support
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from tenant subdomains
    const allowedOrigins = [
      'https://bgu.spike-platform.com',
      'https://tau.spike-platform.com',
      'https://huji.spike-platform.com',
      'http://localhost:3000', // Development
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.use('/health', healthRoute);

// API routes
app.use('/auth', authRoutes);
app.use('/auth/session', sessionRoutes);
app.use('/auth/credentials', credentialsRoutes);

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    await dbConnection.disconnect();
    await redisConnection.disconnect();
    await sdk.shutdown();

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start server
async function startServer() {
  try {
    // Initialize database connection
    await dbConnection.connect();
    logger.info('Database connection established');

    // Initialize Redis connection
    await redisConnection.connect();
    logger.info('Redis connection established');

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`Auth Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    logger.error('Failed to start Auth Service:', error);
    process.exit(1);
  }
}

startServer();