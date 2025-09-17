import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { ConsulConfig } from './config/consul';
import { DatabaseConnection } from './database/connection';
import { KubernetesManager } from './kubernetes/manager';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { healthRoute } from './routes/health';
import { provisioningRoutes } from './routes/provisioning';
import { resourceRoutes } from './routes/resources';
import { tenantRoutes } from './routes/tenants';
import { setupTracing } from './tracing/setup';
import { logger } from './utils/logger';

// Initialize distributed tracing
const sdk = setupTracing('tenant-service');

const app = express();
const PORT = process.env.PORT || 8002;

// Initialize connections
const dbConnection = new DatabaseConnection();
const k8sManager = new KubernetesManager();
const consulConfig = new ConsulConfig();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://admin.spike-platform.com',
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
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // More restrictive for tenant operations
  message: 'Too many tenant operations from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' })); // Larger limit for tenant configurations
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.use('/health', healthRoute);

// API routes
app.use('/tenants', tenantRoutes);
app.use('/provisioning', provisioningRoutes);
app.use('/resources', resourceRoutes);

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    await dbConnection.disconnect();
    await consulConfig.disconnect();
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

// Background tasks
async function startBackgroundTasks() {
  // Resource usage monitoring (every 5 minutes)
  setInterval(
    async () => {
      try {
        // This would monitor tenant resource usage
        logger.debug('Running resource usage check...');
      } catch (error) {
        logger.error('Resource monitoring error:', error);
      }
    },
    5 * 60 * 1000
  );

  // Tenant health checks (every 10 minutes)
  setInterval(
    async () => {
      try {
        logger.debug('Running tenant health checks...');
        // Implementation would check tenant service health
      } catch (error) {
        logger.error('Tenant health check error:', error);
      }
    },
    10 * 60 * 1000
  );
}

// Start server
async function startServer() {
  try {
    // Initialize database connection
    await dbConnection.connect();
    logger.info('Database connection established');

    // Initialize Kubernetes manager
    await k8sManager.initialize();
    logger.info('Kubernetes manager initialized');

    // Initialize Consul configuration
    await consulConfig.connect();
    logger.info('Consul configuration service connected');

    // Start background tasks
    startBackgroundTasks();
    logger.info('Background tasks started');

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`Tenant Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start Tenant Service:', error);
    process.exit(1);
  }
}

startServer();
