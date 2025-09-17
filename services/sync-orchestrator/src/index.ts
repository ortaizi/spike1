import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { DatabaseManager } from './config/database';
import { setupLogging } from './config/logging';
import { setupTracing } from './config/tracing';
import { jobRoutes } from './controllers/jobs';
import { metricsRoutes } from './controllers/metrics';
import { scheduleRoutes } from './controllers/schedules';
import { authMiddleware } from './middleware/auth';
import { correlationMiddleware } from './middleware/correlation';
import { errorMiddleware } from './middleware/error';
import { tenantMiddleware } from './middleware/tenant';
import { EventBus } from './services/event-bus';
import { QueueManager } from './services/queue-manager';
import { SchedulerService } from './services/scheduler';

// Initialize tracing before any imports
setupTracing('sync-orchestrator');

const app = express();
const port = process.env.PORT || 8004;
const logger = setupLogging();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Core middleware
app.use(correlationMiddleware);
app.use(tenantMiddleware);
app.use(authMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sync-orchestrator',
    timestamp: new Date().toISOString(),
    version: process.env.SERVICE_VERSION || '1.0.0',
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/jobs', jobRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/metrics', metricsRoutes);

// Error handling
app.use(errorMiddleware);

async function startServer() {
  try {
    // Initialize database connections
    const dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();
    logger.info('Database connections initialized');

    // Initialize queue manager
    const queueManager = QueueManager.getInstance();
    await queueManager.initialize();
    logger.info('Queue manager initialized');

    // Initialize event bus
    const eventBus = EventBus.getInstance();
    await eventBus.initialize();
    logger.info('Event bus initialized');

    // Initialize scheduler
    const scheduler = SchedulerService.getInstance();
    await scheduler.initialize();
    logger.info('Scheduler service initialized');

    // Start server
    app.listen(port, () => {
      logger.info(`Sync Orchestrator listening on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('Shutting down sync orchestrator...');

      await scheduler.shutdown();
      await queueManager.shutdown();
      await eventBus.shutdown();
      await dbManager.shutdown();

      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start sync orchestrator:', error);
    process.exit(1);
  }
}

startServer();
