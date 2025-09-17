// Feature Flags Configuration for Spike Platform Migration
// Supports gradual traffic shifting and feature rollouts

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  percentage?: number;
  tenants?: string[];
  metadata?: Record<string, any>;
}

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
  provider: 'consul' | 'redis' | 'configmap' | 'environment';
  refreshInterval: number; // in milliseconds
}

// Default feature flags for migration
export const DEFAULT_FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Service Migration Flags
  USE_AUTH_SERVICE: {
    key: 'USE_AUTH_SERVICE',
    enabled: true,
    percentage: 100,
    tenants: ['bgu', 'tau', 'huji'],
    metadata: {
      description: 'Route authentication to microservice instead of monolith',
      phase: 'Phase 1',
      rolloutDate: '2024-01-15',
    },
  },

  USE_TENANT_SERVICE: {
    key: 'USE_TENANT_SERVICE',
    enabled: true,
    percentage: 100,
    tenants: ['bgu', 'tau', 'huji'],
    metadata: {
      description: 'Use tenant management microservice for tenant operations',
      phase: 'Phase 1',
      rolloutDate: '2024-01-15',
    },
  },

  USE_UNIVERSITY_INTEGRATION_SERVICE: {
    key: 'USE_UNIVERSITY_INTEGRATION_SERVICE',
    enabled: false,
    percentage: 0,
    tenants: [],
    metadata: {
      description: 'Route scraping jobs to university integration microservice',
      phase: 'Phase 2',
      plannedRollout: '2024-03-01',
    },
  },

  USE_ACADEMIC_SERVICE: {
    key: 'USE_ACADEMIC_SERVICE',
    enabled: false,
    percentage: 0,
    tenants: [],
    metadata: {
      description: 'Handle academic data through dedicated microservice',
      phase: 'Phase 3',
      plannedRollout: '2024-05-01',
    },
  },

  // Traffic Percentage Flags
  TRAFFIC_PERCENTAGE_AUTH: {
    key: 'TRAFFIC_PERCENTAGE_AUTH',
    enabled: true,
    percentage: 100,
    tenants: ['bgu', 'tau', 'huji'],
    metadata: {
      description: 'Percentage of auth traffic routed to microservice',
    },
  },

  TRAFFIC_PERCENTAGE_TENANT: {
    key: 'TRAFFIC_PERCENTAGE_TENANT',
    enabled: true,
    percentage: 100,
    tenants: ['bgu', 'tau', 'huji'],
    metadata: {
      description: 'Percentage of tenant management traffic to microservice',
    },
  },

  // University-Specific Features
  ENABLE_BGU_INTEGRATION: {
    key: 'ENABLE_BGU_INTEGRATION',
    enabled: true,
    percentage: 100,
    tenants: ['bgu'],
    metadata: {
      description: 'Enable BGU-specific features and integrations',
    },
  },

  ENABLE_TAU_INTEGRATION: {
    key: 'ENABLE_TAU_INTEGRATION',
    enabled: false,
    percentage: 0,
    tenants: ['tau'],
    metadata: {
      description: 'Enable TAU-specific features and integrations',
      plannedRollout: '2024-02-01',
    },
  },

  ENABLE_HUJI_INTEGRATION: {
    key: 'ENABLE_HUJI_INTEGRATION',
    enabled: false,
    percentage: 0,
    tenants: ['huji'],
    metadata: {
      description: 'Enable HUJI-specific features and integrations',
      plannedRollout: '2024-03-01',
    },
  },

  // Feature-Specific Flags
  ENABLE_HEBREW_UI: {
    key: 'ENABLE_HEBREW_UI',
    enabled: true,
    percentage: 100,
    tenants: ['bgu', 'tau', 'huji'],
    metadata: {
      description: 'Enable Hebrew RTL UI components',
    },
  },

  ENABLE_DUAL_WRITE: {
    key: 'ENABLE_DUAL_WRITE',
    enabled: false,
    percentage: 0,
    tenants: [],
    metadata: {
      description: 'Enable dual-write pattern during migration',
      usage: 'Used when migrating data between monolith and microservices',
    },
  },

  ENABLE_SHADOW_MODE: {
    key: 'ENABLE_SHADOW_MODE',
    enabled: false,
    percentage: 10,
    tenants: ['bgu'],
    metadata: {
      description: 'Send shadow traffic to new services for validation',
      usage: 'Testing new services without affecting production',
    },
  },

  ENABLE_CIRCUIT_BREAKER: {
    key: 'ENABLE_CIRCUIT_BREAKER',
    enabled: true,
    percentage: 100,
    tenants: ['bgu', 'tau', 'huji'],
    metadata: {
      description: 'Enable circuit breaker for service resilience',
    },
  },

  // Performance and Monitoring
  ENABLE_DETAILED_LOGGING: {
    key: 'ENABLE_DETAILED_LOGGING',
    enabled: false,
    percentage: 10,
    tenants: ['bgu'],
    metadata: {
      description: 'Enable detailed logging for debugging',
    },
  },

  ENABLE_PERFORMANCE_MONITORING: {
    key: 'ENABLE_PERFORMANCE_MONITORING',
    enabled: true,
    percentage: 100,
    tenants: ['bgu', 'tau', 'huji'],
    metadata: {
      description: 'Enable performance metrics collection',
    },
  },

  // Emergency Controls
  EMERGENCY_FALLBACK_TO_MONOLITH: {
    key: 'EMERGENCY_FALLBACK_TO_MONOLITH',
    enabled: false,
    percentage: 0,
    tenants: [],
    metadata: {
      description: 'Emergency flag to route all traffic back to monolith',
      usage: 'Use only in case of critical microservice failures',
    },
  },
};

// Feature Flag Manager Class
export class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private provider: string;
  private refreshInterval: number;
  private refreshTimer?: NodeJS.Timeout;

  constructor(config: FeatureFlagConfig) {
    this.provider = config.provider;
    this.refreshInterval = config.refreshInterval;

    // Initialize with default flags
    Object.values(DEFAULT_FEATURE_FLAGS).forEach((flag) => {
      this.flags.set(flag.key, flag);
    });

    // Override with config flags
    Object.values(config.flags).forEach((flag) => {
      this.flags.set(flag.key, flag);
    });

    this.startRefreshTimer();
  }

  // Check if a feature is enabled
  isEnabled(flagKey: string, tenantId?: string, userId?: string): boolean {
    const flag = this.flags.get(flagKey);

    if (!flag) {
      console.warn(`Feature flag ${flagKey} not found, defaulting to false`);
      return false;
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check tenant-specific enablement
    if (tenantId && flag.tenants && !flag.tenants.includes(tenantId)) {
      return false;
    }

    // Check percentage rollout
    if (flag.percentage !== undefined && flag.percentage < 100) {
      return this.isInPercentageRollout(flagKey, flag.percentage, userId || tenantId || 'default');
    }

    return true;
  }

  // Get traffic percentage for gradual rollouts
  getTrafficPercentage(flagKey: string): number {
    const flag = this.flags.get(flagKey);
    return flag?.percentage || 0;
  }

  // Check if user/tenant is in percentage rollout
  private isInPercentageRollout(flagKey: string, percentage: number, identifier: string): boolean {
    // Use consistent hashing to determine if identifier is in rollout
    const hash = this.hashString(flagKey + identifier);
    return hash % 100 < percentage;
  }

  // Simple string hash function
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Get all flags for a tenant
  getFlagsForTenant(tenantId: string): Record<string, boolean> {
    const result: Record<string, boolean> = {};

    for (const [key, flag] of this.flags.entries()) {
      result[key] = this.isEnabled(key, tenantId);
    }

    return result;
  }

  // Update a flag (runtime configuration)
  updateFlag(flagKey: string, updates: Partial<FeatureFlag>): void {
    const existingFlag = this.flags.get(flagKey);

    if (existingFlag) {
      const updatedFlag: FeatureFlag = {
        ...existingFlag,
        ...updates,
        key: flagKey, // Ensure key cannot be changed
      };

      this.flags.set(flagKey, updatedFlag);
      console.log(`Feature flag ${flagKey} updated:`, updatedFlag);
    } else {
      console.warn(`Cannot update non-existent flag: ${flagKey}`);
    }
  }

  // Get flag metadata
  getFlagMetadata(flagKey: string): Record<string, any> | undefined {
    const flag = this.flags.get(flagKey);
    return flag?.metadata;
  }

  // Start automatic refresh from external provider
  private startRefreshTimer(): void {
    this.refreshTimer = setInterval(() => {
      this.refreshFromProvider();
    }, this.refreshInterval);
  }

  // Refresh flags from external provider
  private async refreshFromProvider(): Promise<void> {
    try {
      switch (this.provider) {
        case 'consul':
          await this.refreshFromConsul();
          break;
        case 'redis':
          await this.refreshFromRedis();
          break;
        case 'environment':
          this.refreshFromEnvironment();
          break;
        default:
          console.log(`Provider ${this.provider} not implemented for refresh`);
      }
    } catch (error) {
      console.error('Error refreshing feature flags:', error);
    }
  }

  // Consul integration
  private async refreshFromConsul(): Promise<void> {
    // Implementation would connect to Consul and update flags
    console.log('Refreshing flags from Consul...');
  }

  // Redis integration
  private async refreshFromRedis(): Promise<void> {
    // Implementation would connect to Redis and update flags
    console.log('Refreshing flags from Redis...');
  }

  // Environment variables integration
  private refreshFromEnvironment(): void {
    // Update flags based on environment variables
    for (const [key] of this.flags.entries()) {
      const envValue = process.env[`FF_${key}`];

      if (envValue !== undefined) {
        const enabled = envValue.toLowerCase() === 'true';
        this.updateFlag(key, { enabled });
      }

      // Check for percentage environment variable
      const percentageValue = process.env[`FF_${key}_PERCENTAGE`];
      if (percentageValue !== undefined) {
        const percentage = parseInt(percentageValue, 10);
        if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
          this.updateFlag(key, { percentage });
        }
      }
    }
  }

  // Stop refresh timer
  destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  // Export current flags state (for debugging)
  exportFlags(): Record<string, FeatureFlag> {
    const result: Record<string, FeatureFlag> = {};
    for (const [key, flag] of this.flags.entries()) {
      result[key] = { ...flag };
    }
    return result;
  }
}

// Singleton instance for global use
let globalFeatureFlagManager: FeatureFlagManager | null = null;

export function initializeFeatureFlags(config: FeatureFlagConfig): FeatureFlagManager {
  globalFeatureFlagManager = new FeatureFlagManager(config);
  return globalFeatureFlagManager;
}

export function getFeatureFlags(): FeatureFlagManager {
  if (!globalFeatureFlagManager) {
    // Initialize with defaults if not already initialized
    globalFeatureFlagManager = new FeatureFlagManager({
      flags: DEFAULT_FEATURE_FLAGS,
      provider: 'environment',
      refreshInterval: 60000, // 1 minute
    });
  }
  return globalFeatureFlagManager;
}

// Utility functions for common patterns
export function shouldRouteToMicroservice(serviceName: string, tenantId: string): boolean {
  const flagKey = `USE_${serviceName.toUpperCase()}_SERVICE`;
  return getFeatureFlags().isEnabled(flagKey, tenantId);
}

export function getServiceTrafficPercentage(serviceName: string): number {
  const flagKey = `TRAFFIC_PERCENTAGE_${serviceName.toUpperCase()}`;
  return getFeatureFlags().getTrafficPercentage(flagKey);
}

export function isUniversityEnabled(universityId: string): boolean {
  const flagKey = `ENABLE_${universityId.toUpperCase()}_INTEGRATION`;
  return getFeatureFlags().isEnabled(flagKey, universityId);
}
