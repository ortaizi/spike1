export interface SyncJob {
  id: string;
  userId: string;
  tenantId: string;
  type: SyncJobType;
  status: SyncJobStatus;
  priority: JobPriority;
  config: SyncJobConfig;
  metadata: Record<string, any>;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
  result?: SyncJobResult;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum SyncJobType {
  FULL_SYNC = 'full_sync',
  INCREMENTAL_SYNC = 'incremental_sync',
  COURSE_SYNC = 'course_sync',
  ASSIGNMENT_SYNC = 'assignment_sync',
  GRADE_SYNC = 'grade_sync',
  BULK_USER_SYNC = 'bulk_user_sync',
}

export enum SyncJobStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying',
}

export enum JobPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 15,
}

export interface SyncJobConfig {
  universityId: string;
  dataTypes: string[]; // ['courses', 'assignments', 'grades']
  filters?: {
    academicYear?: number;
    semester?: string;
    courseIds?: string[];
  };
  options?: {
    forceRefresh?: boolean;
    validateData?: boolean;
    backupBeforeSync?: boolean;
  };
}

export interface SyncJobResult {
  success: boolean;
  summary: {
    coursesProcessed: number;
    assignmentsProcessed: number;
    gradesProcessed: number;
    errorsCount: number;
    warningsCount: number;
  };
  details: {
    created: Record<string, number>;
    updated: Record<string, number>;
    skipped: Record<string, number>;
    errors: SyncError[];
    warnings: SyncWarning[];
  };
  metrics: {
    startTime: Date;
    endTime: Date;
    duration: number; // milliseconds
    apiCallsCount: number;
    dataTransferred: number; // bytes
  };
}

export interface SyncError {
  type: string;
  message: string;
  context?: Record<string, any>;
  timestamp: Date;
}

export interface SyncWarning {
  type: string;
  message: string;
  context?: Record<string, any>;
  timestamp: Date;
}

// Job Queue Types
export interface QueueJob {
  id: string;
  data: SyncJobData;
  opts: QueueJobOptions;
}

export interface SyncJobData {
  jobId: string;
  userId: string;
  tenantId: string;
  type: SyncJobType;
  config: SyncJobConfig;
  correlationId: string;
}

export interface QueueJobOptions {
  priority: JobPriority;
  delay?: number;
  attempts: number;
  backoff: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  removeOnComplete?: number;
  removeOnFail?: number;
}

// Scheduler Types
export interface SyncSchedule {
  id: string;
  userId: string;
  tenantId: string;
  name: string;
  description?: string;
  jobType: SyncJobType;
  config: SyncJobConfig;
  cronExpression: string;
  timezone: string;
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Worker Types
export interface WorkerConfig {
  concurrency: number;
  maxMemoryUsage: number; // MB
  healthCheckInterval: number; // seconds
  maxJobDuration: number; // seconds
}

export interface WorkerMetrics {
  workerId: string;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageJobDuration: number;
  memoryUsage: number;
  cpuUsage: number;
  lastHeartbeat: Date;
}

// University Integration Types
export interface UniversityCredentials {
  universityId: string;
  username: string;
  password: string;
  additionalFields?: Record<string, string>;
}

export interface UniversityConfig {
  id: string;
  name: string;
  scraperClass: string;
  moodleUrl: string;
  rateLimits: {
    requestsPerMinute: number;
    concurrentSessions: number;
  };
  selectors: Record<string, string>;
  metadata: Record<string, any>;
}

// API Types
export interface CreateSyncJobRequest {
  type: SyncJobType;
  config: SyncJobConfig;
  priority?: JobPriority;
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

export interface ScheduleSyncJobRequest {
  name: string;
  description?: string;
  jobType: SyncJobType;
  config: SyncJobConfig;
  cronExpression: string;
  timezone?: string;
}

export interface JobProgressUpdate {
  jobId: string;
  status: SyncJobStatus;
  progress: number; // 0-100
  currentStep: string;
  processedItems: number;
  totalItems: number;
  errors?: SyncError[];
  warnings?: SyncWarning[];
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// Event Types for Event Bus
export interface SyncJobEvent {
  type: string;
  jobId: string;
  userId: string;
  tenantId: string;
  data: any;
  timestamp: Date;
  correlationId: string;
}

export interface JobCreatedEvent extends SyncJobEvent {
  type: 'sync.job.created';
  data: {
    job: SyncJob;
  };
}

export interface JobStartedEvent extends SyncJobEvent {
  type: 'sync.job.started';
  data: {
    job: SyncJob;
    workerId: string;
  };
}

export interface JobProgressEvent extends SyncJobEvent {
  type: 'sync.job.progress';
  data: JobProgressUpdate;
}

export interface JobCompletedEvent extends SyncJobEvent {
  type: 'sync.job.completed';
  data: {
    job: SyncJob;
    result: SyncJobResult;
  };
}

export interface JobFailedEvent extends SyncJobEvent {
  type: 'sync.job.failed';
  data: {
    job: SyncJob;
    error: string;
    retryScheduled: boolean;
  };
}
