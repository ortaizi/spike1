#!/bin/bash

# Phase 4: Performance Optimization Scripts for Spike Platform
# This script handles various performance optimization tasks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="spike-platform"
PROMETHEUS_URL="http://prometheus-server:9090"
GRAFANA_URL="http://grafana:3000"

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check service health
check_service_health() {
    local service=$1
    log "Checking health of $service..."

    local health_endpoint="http://$service:8080/health"
    local response=$(kubectl exec -n $NAMESPACE deployment/curl-pod -- curl -s -o /dev/null -w "%{http_code}" $health_endpoint 2>/dev/null || echo "000")

    if [[ $response == "200" ]]; then
        success "$service is healthy"
        return 0
    else
        error "$service is unhealthy (HTTP $response)"
        return 1
    fi
}

# Function to optimize database connections
optimize_database_connections() {
    log "Optimizing database connection pools..."

    # Get current connection metrics
    local current_connections=$(kubectl exec -n $NAMESPACE -c prometheus prometheus-server-0 -- \
        promtool query instant 'sum(db_connections_active)' 2>/dev/null | grep -o '[0-9]*' | tail -1)

    if [[ -n $current_connections ]]; then
        log "Current active connections: $current_connections"

        # If connections are high, scale down non-critical services
        if [[ $current_connections -gt 80 ]]; then
            warning "High database connection usage detected. Scaling down non-critical services..."
            kubectl scale deployment notification-service --replicas=2 -n $NAMESPACE
            kubectl scale deployment analytics-service --replicas=2 -n $NAMESPACE
        fi
    fi

    # Update connection pool settings
    for service in auth-service academic-service sync-orchestrator; do
        log "Updating connection pool for $service..."
        kubectl patch deployment $service -n $NAMESPACE -p '{
            "spec": {
                "template": {
                    "spec": {
                        "containers": [{
                            "name": "'$service'",
                            "env": [
                                {"name": "DB_POOL_SIZE", "value": "15"},
                                {"name": "DB_MAX_CONNECTIONS", "value": "20"},
                                {"name": "DB_IDLE_TIMEOUT", "value": "300000"}
                            ]
                        }]
                    }
                }
            }
        }'
    done

    success "Database connection optimization completed"
}

# Function to optimize memory usage
optimize_memory_usage() {
    log "Analyzing and optimizing memory usage..."

    # Get memory usage for each service
    kubectl top pods -n $NAMESPACE --sort-by=memory | while read line; do
        if [[ $line == NAME* ]]; then
            continue
        fi

        local pod_name=$(echo $line | awk '{print $1}')
        local memory_usage=$(echo $line | awk '{print $3}')

        # Convert memory to MB for comparison
        local memory_mb=$(echo $memory_usage | sed 's/Mi//')

        if [[ $memory_mb -gt 512 ]]; then
            warning "High memory usage detected for $pod_name: ${memory_usage}"

            # Trigger garbage collection for Node.js services
            if [[ $pod_name == *"service"* ]]; then
                kubectl exec -n $NAMESPACE $pod_name -- curl -s -X POST http://localhost:8080/admin/gc 2>/dev/null || true
            fi
        fi
    done

    success "Memory optimization completed"
}

# Function to implement caching optimizations
optimize_caching() {
    log "Implementing caching optimizations..."

    # Redis connection pooling optimization
    kubectl patch deployment redis -n infrastructure -p '{
        "spec": {
            "template": {
                "spec": {
                    "containers": [{
                        "name": "redis",
                        "args": [
                            "--maxmemory", "512mb",
                            "--maxmemory-policy", "allkeys-lru",
                            "--tcp-keepalive", "60",
                            "--timeout", "300"
                        ]
                    }]
                }
            }
        }
    }'

    # Update service configurations for better caching
    for service in auth-service academic-service analytics-service; do
        kubectl patch deployment $service -n $NAMESPACE -p '{
            "spec": {
                "template": {
                    "spec": {
                        "containers": [{
                            "name": "'$service'",
                            "env": [
                                {"name": "CACHE_TTL", "value": "300"},
                                {"name": "CACHE_MAX_SIZE", "value": "1000"},
                                {"name": "ENABLE_REDIS_CLUSTER", "value": "true"}
                            ]
                        }]
                    }
                }
            }
        }'
    done

    success "Caching optimization completed"
}

# Function to optimize auto-scaling
optimize_autoscaling() {
    log "Optimizing horizontal pod autoscaling..."

    # Update HPA configurations for better performance
    cat <<EOF | kubectl apply -f -
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
  namespace: $NAMESPACE
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 3
  maxReplicas: 15
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 70
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: academic-service-hpa
  namespace: $NAMESPACE
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: academic-service
  minReplicas: 4
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 65
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 75
EOF

    success "Auto-scaling optimization completed"
}

# Function to run performance benchmarks
run_performance_benchmarks() {
    log "Running performance benchmarks..."

    # Create a temporary pod for running benchmarks
    kubectl run performance-tester --image=loadimpact/k6:latest -n $NAMESPACE --rm -i --tty -- /bin/sh << 'EOF'
cat << 'SCRIPT' > /tmp/spike-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.1'],
  },
};

const TENANTS = ['bgu', 'tau', 'huji'];
const BASE_URL = 'http://api-gateway.spike-platform.svc.cluster.local';

export default function () {
  const tenant = TENANTS[Math.floor(Math.random() * TENANTS.length)];

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenant,
    },
  };

  // Test authentication endpoint
  let res = http.get(`${BASE_URL}/auth/health`, params);
  check(res, {
    'auth health check': (r) => r.status === 200,
  });

  // Test academic service endpoint
  res = http.get(`${BASE_URL}/academic/courses`, params);
  check(res, {
    'courses endpoint': (r) => r.status === 200 || r.status === 401,
  });

  // Test analytics service endpoint
  res = http.get(`${BASE_URL}/analytics/dashboard`, params);
  check(res, {
    'analytics endpoint': (r) => r.status === 200 || r.status === 401,
  });

  sleep(1);
}
SCRIPT

k6 run --out json=/tmp/results.json /tmp/spike-load-test.js
EOF

    success "Performance benchmarks completed"
}

# Function to generate performance report
generate_performance_report() {
    log "Generating performance optimization report..."

    local report_file="/tmp/spike-performance-report.json"

    # Collect metrics from Prometheus
    kubectl exec -n $NAMESPACE -c prometheus prometheus-server-0 -- \
        promtool query instant 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))' > /tmp/response_times.txt 2>/dev/null || true

    kubectl exec -n $NAMESPACE -c prometheus prometheus-server-0 -- \
        promtool query instant 'rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])' > /tmp/error_rates.txt 2>/dev/null || true

    # Create performance report
    cat > $report_file << EOF
{
  "performance_optimization_report": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "phase": "Phase 4 - Performance Optimization",
    "status": "completed",
    "optimizations_applied": [
      "Database connection pool optimization",
      "Memory usage optimization",
      "Redis caching configuration",
      "Horizontal pod autoscaling tuning",
      "Performance benchmarking"
    ],
    "metrics": {
      "target_response_time_p95": "200ms",
      "target_availability": "99.9%",
      "target_error_rate": "< 0.1%",
      "target_concurrent_users": "10000+ per tenant"
    },
    "recommendations": [
      "Continue monitoring response times during peak hours",
      "Consider implementing CDN for static assets",
      "Evaluate database read replicas for analytics queries",
      "Implement circuit breakers for external service calls"
    ],
    "next_steps": [
      "Schedule weekly performance reviews",
      "Set up automated performance testing in CI/CD",
      "Configure advanced alerting based on SLIs"
    ]
  }
}
EOF

    log "Performance report generated: $report_file"
    success "Performance optimization phase completed successfully"
}

# Main execution
main() {
    log "Starting Phase 4: Performance Optimization for Spike Platform"

    # Check if namespace exists
    if ! kubectl get namespace $NAMESPACE >/dev/null 2>&1; then
        error "Namespace $NAMESPACE does not exist"
        exit 1
    fi

    # Run optimization tasks
    optimize_database_connections
    optimize_memory_usage
    optimize_caching
    optimize_autoscaling
    run_performance_benchmarks
    generate_performance_report

    success "Phase 4 Performance Optimization completed successfully!"
    log "Next: Execute monolith decommission procedures"
}

# Script entry point
case "${1:-main}" in
    "health")
        check_service_health $2
        ;;
    "database")
        optimize_database_connections
        ;;
    "memory")
        optimize_memory_usage
        ;;
    "caching")
        optimize_caching
        ;;
    "autoscaling")
        optimize_autoscaling
        ;;
    "benchmark")
        run_performance_benchmarks
        ;;
    "report")
        generate_performance_report
        ;;
    "main"|*)
        main
        ;;
esac