import { DatabaseManager } from '../config/database';
import { EventBus } from './event-bus';
import { logger } from '../config/logging';
import { DomainEvent } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class EventStore {
  private static instance: EventStore;
  private dbManager: DatabaseManager;
  private eventBus: EventBus;

  private constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.eventBus = EventBus.getInstance();
  }

  static getInstance(): EventStore {
    if (!EventStore.instance) {
      EventStore.instance = new EventStore();
    }
    return EventStore.instance;
  }

  async append(event: DomainEvent): Promise<void> {
    const eventWithDefaults = {
      ...event,
      correlationId: event.correlationId || uuidv4(),
      eventTime: event.eventTime || new Date()
    };

    // Store event in tenant-specific event store
    const query = `
      INSERT INTO academic_${event.tenantId}.events (
        id, aggregate_id, event_type, event_data, event_time,
        tenant_id, correlation_id, user_id, version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    const values = [
      uuidv4(),
      eventWithDefaults.aggregateId,
      eventWithDefaults.eventType,
      JSON.stringify(eventWithDefaults.eventData),
      eventWithDefaults.eventTime,
      eventWithDefaults.tenantId,
      eventWithDefaults.correlationId,
      eventWithDefaults.userId,
      1 // Version - could be calculated based on existing events for the aggregate
    ];

    await this.dbManager.executeQuery(event.tenantId, query, values);

    // Publish to event bus for other services
    await this.eventBus.publish(eventWithDefaults.eventType, eventWithDefaults);

    logger.info('Domain event stored and published', {
      eventType: eventWithDefaults.eventType,
      aggregateId: eventWithDefaults.aggregateId,
      tenantId: eventWithDefaults.tenantId,
      correlationId: eventWithDefaults.correlationId
    });
  }

  async getEvents(
    tenantId: string,
    aggregateId: string,
    fromVersion?: number
  ): Promise<DomainEvent[]> {
    let query = `
      SELECT * FROM academic_${tenantId}.events
      WHERE aggregate_id = $1
    `;
    const values = [aggregateId];

    if (fromVersion !== undefined) {
      query += ' AND version > $2';
      values.push(fromVersion);
    }

    query += ' ORDER BY event_time ASC';

    const result = await this.dbManager.executeQuery(tenantId, query, values);

    return result.rows.map((row: any) => ({
      aggregateId: row.aggregate_id,
      eventType: row.event_type,
      eventData: JSON.parse(row.event_data),
      eventTime: row.event_time,
      tenantId: row.tenant_id,
      correlationId: row.correlation_id,
      userId: row.user_id
    }));
  }

  async getEventsByType(
    tenantId: string,
    eventType: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<DomainEvent[]> {
    const query = `
      SELECT * FROM academic_${tenantId}.events
      WHERE event_type = $1
      ORDER BY event_time DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.dbManager.executeQuery(tenantId, query, [eventType, limit, offset]);

    return result.rows.map((row: any) => ({
      aggregateId: row.aggregate_id,
      eventType: row.event_type,
      eventData: JSON.parse(row.event_data),
      eventTime: row.event_time,
      tenantId: row.tenant_id,
      correlationId: row.correlation_id,
      userId: row.user_id
    }));
  }

  async getEventsByCorrelationId(
    tenantId: string,
    correlationId: string
  ): Promise<DomainEvent[]> {
    const query = `
      SELECT * FROM academic_${tenantId}.events
      WHERE correlation_id = $1
      ORDER BY event_time ASC
    `;

    const result = await this.dbManager.executeQuery(tenantId, query, [correlationId]);

    return result.rows.map((row: any) => ({
      aggregateId: row.aggregate_id,
      eventType: row.event_type,
      eventData: JSON.parse(row.event_data),
      eventTime: row.event_time,
      tenantId: row.tenant_id,
      correlationId: row.correlation_id,
      userId: row.user_id
    }));
  }

  async getEventsInTimeRange(
    tenantId: string,
    fromTime: Date,
    toTime: Date,
    eventTypes?: string[]
  ): Promise<DomainEvent[]> {
    let query = `
      SELECT * FROM academic_${tenantId}.events
      WHERE event_time BETWEEN $1 AND $2
    `;
    const values: any[] = [fromTime, toTime];

    if (eventTypes && eventTypes.length > 0) {
      query += ' AND event_type = ANY($3)';
      values.push(eventTypes);
    }

    query += ' ORDER BY event_time ASC';

    const result = await this.dbManager.executeQuery(tenantId, query, values);

    return result.rows.map((row: any) => ({
      aggregateId: row.aggregate_id,
      eventType: row.event_type,
      eventData: JSON.parse(row.event_data),
      eventTime: row.event_time,
      tenantId: row.tenant_id,
      correlationId: row.correlation_id,
      userId: row.user_id
    }));
  }

  async replayEvents(
    tenantId: string,
    fromTime: Date,
    eventTypes?: string[]
  ): Promise<void> {
    const events = await this.getEventsInTimeRange(
      tenantId,
      fromTime,
      new Date(),
      eventTypes
    );

    for (const event of events) {
      // Re-publish events to event bus for replay
      await this.eventBus.publish(`replay.${event.eventType}`, event);

      logger.debug('Event replayed', {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        originalTime: event.eventTime.toISOString(),
        tenantId
      });
    }

    logger.info('Events replayed', {
      tenantId,
      eventCount: events.length,
      fromTime: fromTime.toISOString(),
      eventTypes
    });
  }

  async createSnapshot(
    tenantId: string,
    aggregateId: string,
    aggregateType: string,
    data: any,
    version: number
  ): Promise<void> {
    const query = `
      INSERT INTO academic_${tenantId}.snapshots (
        id, aggregate_id, aggregate_type, data, version, created_at, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (aggregate_id) DO UPDATE SET
        data = EXCLUDED.data,
        version = EXCLUDED.version,
        created_at = EXCLUDED.created_at
    `;

    await this.dbManager.executeQuery(tenantId, query, [
      uuidv4(),
      aggregateId,
      aggregateType,
      JSON.stringify(data),
      version,
      new Date(),
      tenantId
    ]);

    logger.debug('Snapshot created', {
      aggregateId,
      aggregateType,
      version,
      tenantId
    });
  }

  async getSnapshot(
    tenantId: string,
    aggregateId: string
  ): Promise<{
    data: any;
    version: number;
    createdAt: Date;
  } | null> {
    const query = `
      SELECT data, version, created_at
      FROM academic_${tenantId}.snapshots
      WHERE aggregate_id = $1
    `;

    const result = await this.dbManager.executeQuery(tenantId, query, [aggregateId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      data: JSON.parse(row.data),
      version: row.version,
      createdAt: row.created_at
    };
  }
}

// Aggregate base class for Event Sourcing
export abstract class AggregateRoot {
  protected id: string;
  protected version: number = 0;
  protected uncommittedEvents: DomainEvent[] = [];

  constructor(id: string) {
    this.id = id;
  }

  getId(): string {
    return this.id;
  }

  getVersion(): number {
    return this.version;
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }

  protected addEvent(event: DomainEvent): void {
    this.uncommittedEvents.push(event);
    this.apply(event);
    this.version++;
  }

  protected abstract apply(event: DomainEvent): void;

  static async fromHistory<T extends AggregateRoot>(
    constructor: new (id: string) => T,
    events: DomainEvent[]
  ): Promise<T> {
    if (events.length === 0) {
      throw new Error('Cannot reconstruct aggregate from empty event history');
    }

    const aggregate = new constructor(events[0].aggregateId);

    for (const event of events) {
      aggregate.apply(event);
      aggregate.version++;
    }

    return aggregate;
  }
}

// Course Aggregate example
export class CourseAggregate extends AggregateRoot {
  private name?: string;
  private code?: string;
  private status?: string;

  protected apply(event: DomainEvent): void {
    switch (event.eventType) {
      case 'course.created':
        this.name = event.eventData.course.name;
        this.code = event.eventData.course.code;
        this.status = 'active';
        break;
      case 'course.updated':
        if (event.eventData.name) {
          this.name = event.eventData.name;
        }
        break;
      case 'course.deactivated':
        this.status = 'inactive';
        break;
    }
  }

  createCourse(courseData: any, userId: string, tenantId: string, correlationId: string): void {
    const event: DomainEvent = {
      aggregateId: this.id,
      eventType: 'course.created',
      eventData: { course: courseData },
      eventTime: new Date(),
      tenantId,
      correlationId,
      userId
    };

    this.addEvent(event);
  }

  updateCourse(updates: any, userId: string, tenantId: string, correlationId: string): void {
    if (this.status === 'inactive') {
      throw new Error('Cannot update inactive course');
    }

    const event: DomainEvent = {
      aggregateId: this.id,
      eventType: 'course.updated',
      eventData: updates,
      eventTime: new Date(),
      tenantId,
      correlationId,
      userId
    };

    this.addEvent(event);
  }

  deactivateCourse(userId: string, tenantId: string, correlationId: string): void {
    if (this.status === 'inactive') {
      throw new Error('Course is already inactive');
    }

    const event: DomainEvent = {
      aggregateId: this.id,
      eventType: 'course.deactivated',
      eventData: { deactivatedBy: userId },
      eventTime: new Date(),
      tenantId,
      correlationId,
      userId
    };

    this.addEvent(event);
  }

  getName(): string | undefined {
    return this.name;
  }

  getCode(): string | undefined {
    return this.code;
  }

  getStatus(): string | undefined {
    return this.status;
  }
}