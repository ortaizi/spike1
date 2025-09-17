import amqp, { Channel, Connection, ConsumeMessage } from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logging';
import { DomainEvent } from '../types';

export class EventBus {
  private static instance: EventBus;
  private connection?: Connection;
  private channel?: Channel;
  private isInitialized = false;
  private eventHandlers: Map<string, ((event: any) => Promise<void>)[]> = new Map();
  private readonly exchangeName = 'spike.events';
  private readonly dlxExchangeName = 'spike.events.dlx';

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

    try {
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Set up error handling
      this.connection.on('error', (error) => {
        logger.error('RabbitMQ connection error:', error);
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.isInitialized = false;
        // Attempt to reconnect
        setTimeout(() => this.initialize(), 5000);
      });

      // Create exchanges
      await this.setupExchanges();

      this.isInitialized = true;
      logger.info('Event bus initialized', {
        exchangeName: this.exchangeName,
        rabbitmqUrl: rabbitmqUrl.replace(/\/\/.*@/, '//***@'), // Hide credentials in logs
      });
    } catch (error) {
      logger.error('Failed to initialize event bus:', error);
      throw error;
    }
  }

  async publish(eventType: string, event: any): Promise<void> {
    if (!this.isInitialized || !this.channel) {
      throw new Error('Event bus not initialized');
    }

    const routingKey = this.buildRoutingKey(eventType, event.tenantId);
    const message = {
      ...event,
      eventId: event.eventId || uuidv4(),
      timestamp: event.timestamp || new Date().toISOString(),
      version: event.version || 1,
      source: 'academic-service',
    };

    const messageBuffer = Buffer.from(JSON.stringify(message));

    try {
      const published = this.channel.publish(this.exchangeName, routingKey, messageBuffer, {
        persistent: true,
        headers: {
          'x-tenant-id': event.tenantId,
          'x-event-type': eventType,
          'x-correlation-id': event.correlationId,
          'x-user-id': event.userId,
          'x-source-service': 'academic-service',
        },
        messageId: message.eventId,
        timestamp: Date.now(),
        contentType: 'application/json',
      });

      if (!published) {
        logger.warn('Event publish may have been buffered', {
          eventType,
          routingKey,
          eventId: message.eventId,
        });
      }

      logger.debug('Event published', {
        eventType,
        routingKey,
        eventId: message.eventId,
        tenantId: event.tenantId,
        correlationId: event.correlationId,
      });
    } catch (error) {
      logger.error('Failed to publish event:', {
        eventType,
        routingKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async subscribe(
    eventPattern: string,
    handler: (event: any) => Promise<void>,
    options: {
      queueName?: string;
      durable?: boolean;
      exclusive?: boolean;
      autoAck?: boolean;
      prefetch?: number;
    } = {}
  ): Promise<void> {
    if (!this.isInitialized || !this.channel) {
      throw new Error('Event bus not initialized');
    }

    const queueName = options.queueName || `academic-service.${eventPattern}.${uuidv4()}`;
    const durable = options.durable ?? true;
    const exclusive = options.exclusive ?? false;
    const autoAck = options.autoAck ?? false;
    const prefetch = options.prefetch ?? 10;

    try {
      // Set prefetch for fair dispatch
      await this.channel.prefetch(prefetch);

      // Declare queue with dead letter exchange
      const queue = await this.channel.assertQueue(queueName, {
        durable,
        exclusive,
        arguments: {
          'x-dead-letter-exchange': this.dlxExchangeName,
          'x-dead-letter-routing-key': `dlx.${eventPattern}`,
          'x-message-ttl': 24 * 60 * 60 * 1000, // 24 hours
        },
      });

      // Bind queue to exchange with pattern
      await this.channel.bindQueue(queue.queue, this.exchangeName, eventPattern);

      // Start consuming
      await this.channel.consume(
        queue.queue,
        async (msg: ConsumeMessage | null) => {
          if (!msg) return;

          try {
            const event = JSON.parse(msg.content.toString());

            // Add message metadata to event
            event.messageId = msg.properties.messageId;
            event.redelivered = msg.fields.redelivered;
            event.receivedAt = new Date();

            logger.debug('Event received', {
              eventType: event.eventType,
              eventId: event.eventId,
              tenantId: event.tenantId,
              queue: queue.queue,
              redelivered: msg.fields.redelivered,
            });

            // Execute handler
            await handler(event);

            // Acknowledge message if auto-ack is disabled
            if (!autoAck) {
              this.channel?.ack(msg);
            }

            logger.debug('Event processed successfully', {
              eventType: event.eventType,
              eventId: event.eventId,
            });
          } catch (error) {
            logger.error('Event processing failed:', {
              error: error instanceof Error ? error.message : 'Unknown error',
              queue: queue.queue,
              routingKey: msg.fields.routingKey,
              redelivered: msg.fields.redelivered,
            });

            if (!autoAck) {
              // Reject message and don't requeue (send to DLX)
              this.channel?.nack(msg, false, false);
            }
          }
        },
        { noAck: autoAck }
      );

      // Store handler for cleanup
      if (!this.eventHandlers.has(eventPattern)) {
        this.eventHandlers.set(eventPattern, []);
      }
      this.eventHandlers.get(eventPattern)!.push(handler);

      logger.info('Event subscription created', {
        eventPattern,
        queueName: queue.queue,
        durable,
        exclusive,
      });
    } catch (error) {
      logger.error('Failed to create event subscription:', {
        eventPattern,
        queueName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async subscribeToDeadLetters(
    handler: (event: any, originalError: string) => Promise<void>
  ): Promise<void> {
    if (!this.isInitialized || !this.channel) {
      throw new Error('Event bus not initialized');
    }

    const dlxQueue = 'academic-service.dead-letters';

    try {
      const queue = await this.channel.assertQueue(dlxQueue, { durable: true });
      await this.channel.bindQueue(queue.queue, this.dlxExchangeName, '#');

      await this.channel.consume(queue.queue, async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        try {
          const event = JSON.parse(msg.content.toString());
          const originalError = msg.properties.headers?.['x-death']?.[0]?.reason || 'Unknown';

          await handler(event, originalError);
          this.channel?.ack(msg);
        } catch (error) {
          logger.error('Dead letter processing failed:', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          this.channel?.nack(msg, false, true); // Requeue for retry
        }
      });

      logger.info('Dead letter subscription created', { dlxQueue });
    } catch (error) {
      logger.error('Failed to subscribe to dead letters:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down event bus...');

    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (error) {
      logger.error('Error during event bus shutdown:', error);
    }

    this.isInitialized = false;
    this.eventHandlers.clear();
    logger.info('Event bus shut down');
  }

  private async setupExchanges(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    // Main events exchange (topic)
    await this.channel.assertExchange(this.exchangeName, 'topic', {
      durable: true,
    });

    // Dead letter exchange
    await this.channel.assertExchange(this.dlxExchangeName, 'topic', {
      durable: true,
    });

    logger.info('Event exchanges created', {
      mainExchange: this.exchangeName,
      dlxExchange: this.dlxExchangeName,
    });
  }

  private buildRoutingKey(eventType: string, tenantId?: string): string {
    const parts = [];

    if (tenantId) {
      parts.push(tenantId);
    }

    parts.push(eventType);

    return parts.join('.');
  }
}

// Event handler registration decorator
export function EventHandler(eventType: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const event = args[0];

      logger.debug('Event handler invoked', {
        eventType,
        handlerClass: target.constructor.name,
        handlerMethod: propertyKey,
        eventId: event.eventId,
        tenantId: event.tenantId,
      });

      try {
        const result = await originalMethod.apply(this, args);

        logger.debug('Event handler completed', {
          eventType,
          handlerClass: target.constructor.name,
          handlerMethod: propertyKey,
          eventId: event.eventId,
        });

        return result;
      } catch (error) {
        logger.error('Event handler failed', {
          eventType,
          handlerClass: target.constructor.name,
          handlerMethod: propertyKey,
          eventId: event.eventId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    };

    return descriptor;
  };
}

// Example event handlers for academic service
export class AcademicEventHandlers {
  @EventHandler('course.created')
  async handleCourseCreated(event: DomainEvent): Promise<void> {
    // Update read models, trigger notifications, etc.
    logger.info('Handling course created event', {
      courseId: event.aggregateId,
      tenantId: event.tenantId,
    });
  }

  @EventHandler('assignment.created')
  async handleAssignmentCreated(event: DomainEvent): Promise<void> {
    // Send notifications to enrolled students
    logger.info('Handling assignment created event', {
      assignmentId: event.aggregateId,
      courseId: event.eventData.assignment.courseId,
      tenantId: event.tenantId,
    });
  }

  @EventHandler('grade.updated')
  async handleGradeUpdated(event: DomainEvent): Promise<void> {
    // Update analytics, send notifications
    logger.info('Handling grade updated event', {
      gradeId: event.aggregateId,
      userId: event.eventData.grade.userId,
      tenantId: event.tenantId,
    });
  }
}
