import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { DatabaseManager } from './config/database';
import { setupLogging } from './config/logging';
import { setupTracing } from './config/tracing';
import { assignmentRoutes } from './controllers/assignments';
import { courseRoutes } from './controllers/courses';
import { enrollmentRoutes } from './controllers/enrollments';
import { gradeRoutes } from './controllers/grades';
import { teamRoutes } from './controllers/teams';
import { authMiddleware } from './middleware/auth';
import { correlationMiddleware } from './middleware/correlation';
import { errorMiddleware } from './middleware/error';
import { tenantMiddleware } from './middleware/tenant';
import { EventBus } from './services/event-bus';

// Initialize tracing before any imports
setupTracing('academic-service');

const app = express();
const port = process.env.PORT || 8003;
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
    service: 'academic-service',
    timestamp: new Date().toISOString(),
    version: process.env.SERVICE_VERSION || '1.0.0',
  });
});

// API routes
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/teams', teamRoutes);

// Error handling
app.use(errorMiddleware);

async function startServer() {
  try {
    // Initialize database connections
    const dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();
    logger.info('Database connections initialized');

    // Initialize event bus
    const eventBus = EventBus.getInstance();
    await eventBus.initialize();
    logger.info('Event bus initialized');

    // Start server
    app.listen(port, () => {
      logger.info(`Academic Service listening on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('Shutting down academic service...');

      await eventBus.shutdown();
      await dbManager.shutdown();

      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start academic service:', error);
    process.exit(1);
  }
}

startServer();
