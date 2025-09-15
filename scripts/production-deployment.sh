#!/bin/bash

# Phase 4: Production Deployment Script
# Deploys Spike Platform microservices to production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_NAMESPACE="spike-production"
INFRASTRUCTURE_NAMESPACE="infrastructure"
STAGING_NAMESPACE="spike-staging"
DOCKER_REGISTRY="registry.spike-platform.com"
HELM_RELEASE="spike-platform-prod"

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

info() {
    echo -e "${PURPLE}[INFO]${NC} $1"
}

# Function to validate prerequisites
validate_prerequisites() {
    log "Validating production deployment prerequisites..."

    # Check kubectl access
    if ! kubectl cluster-info >/dev/null 2>&1; then
        error "Cannot access Kubernetes cluster"
        return 1
    fi

    # Check Docker registry access
    if ! docker login $DOCKER_REGISTRY >/dev/null 2>&1; then
        error "Cannot access Docker registry: $DOCKER_REGISTRY"
        return 1
    fi

    # Check Helm installation
    if ! helm version >/dev/null 2>&1; then
        error "Helm is not installed or not accessible"
        return 1
    fi

    # Verify staging environment is healthy
    if ! kubectl get namespace $STAGING_NAMESPACE >/dev/null 2>&1; then
        error "Staging namespace does not exist: $STAGING_NAMESPACE"
        return 1
    fi

    # Check infrastructure namespace
    if ! kubectl get namespace $INFRASTRUCTURE_NAMESPACE >/dev/null 2>&1; then
        error "Infrastructure namespace does not exist: $INFRASTRUCTURE_NAMESPACE"
        return 1
    fi

    success "All prerequisites validated"
    return 0
}

# Function to create production secrets
create_production_secrets() {
    log "Creating production secrets..."

    # Create namespace if it doesn't exist
    kubectl create namespace $PRODUCTION_NAMESPACE 2>/dev/null || true

    # Database credentials
    kubectl create secret generic auth-db-credentials \
        --from-literal=url="postgresql://auth_user:$(openssl rand -base64 32)@auth-db-prod:5432/auth_service" \
        -n $PRODUCTION_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

    kubectl create secret generic academic-db-credentials \
        --from-literal=url="postgresql://academic_user:$(openssl rand -base64 32)@academic-db-prod:5432/academic_service" \
        -n $PRODUCTION_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

    kubectl create secret generic analytics-db-credentials \
        --from-literal=url="postgresql://analytics_user:$(openssl rand -base64 32)@analytics-db-prod:5432/analytics_service" \
        -n $PRODUCTION_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

    kubectl create secret generic sync-db-credentials \
        --from-literal=url="postgresql://sync_user:$(openssl rand -base64 32)@sync-db-prod:5432/sync_service" \
        -n $PRODUCTION_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

    kubectl create secret generic tenant-db-credentials \
        --from-literal=url="postgresql://tenant_user:$(openssl rand -base64 32)@tenant-db-prod:5432/tenant_service" \
        -n $PRODUCTION_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

    # Redis credentials
    kubectl create secret generic redis-credentials \
        --from-literal=url="redis://:$(openssl rand -base64 32)@redis-cluster-prod:6379" \
        -n $PRODUCTION_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

    # RabbitMQ credentials
    kubectl create secret generic rabbitmq-credentials \
        --from-literal=url="amqp://rabbit_user:$(openssl rand -base64 32)@rabbitmq-prod:5672" \
        -n $PRODUCTION_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

    # Authentication secrets
    kubectl create secret generic auth-secrets \
        --from-literal=jwt-secret="$(openssl rand -base64 64)" \
        -n $PRODUCTION_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

    # OAuth credentials (these should be provided from external source)
    kubectl create secret generic oauth-credentials \
        --from-literal=google-client-id="${GOOGLE_CLIENT_ID}" \
        --from-literal=google-client-secret="${GOOGLE_CLIENT_SECRET}" \
        -n $PRODUCTION_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

    # Vault credentials
    kubectl create secret generic vault-credentials \
        --from-literal=token="${VAULT_TOKEN}" \
        -n $PRODUCTION_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

    # SMTP credentials for notifications
    kubectl create secret generic smtp-credentials \
        --from-literal=host="${SMTP_HOST}" \
        --from-literal=user="${SMTP_USER}" \
        --from-literal=password="${SMTP_PASSWORD}" \
        -n $PRODUCTION_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

    success "Production secrets created"
}

# Function to build and push production images
build_and_push_images() {
    log "Building and pushing production Docker images..."

    local services=("auth-service" "academic-service" "analytics-service" "notification-service" "sync-orchestrator" "university-integration" "tenant-service")

    for service in "${services[@]}"; do
        log "Building $service..."

        # Build Docker image
        docker build -t $DOCKER_REGISTRY/$service:v1.0.0 \
            -t $DOCKER_REGISTRY/$service:latest \
            -f services/$service/Dockerfile \
            services/$service

        # Push to registry
        docker push $DOCKER_REGISTRY/$service:v1.0.0
        docker push $DOCKER_REGISTRY/$service:latest

        success "$service image built and pushed"
    done

    success "All production images built and pushed"
}

# Function to deploy infrastructure dependencies
deploy_infrastructure() {
    log "Deploying production infrastructure dependencies..."

    # Deploy production databases
    cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: auth-db-prod
  namespace: $INFRASTRUCTURE_NAMESPACE
spec:
  serviceName: auth-db-prod
  replicas: 3
  selector:
    matchLabels:
      app: auth-db-prod
  template:
    metadata:
      labels:
        app: auth-db-prod
    spec:
      containers:
      - name: postgres
        image: postgres:15
        env:
        - name: POSTGRES_DB
          value: auth_service
        - name: POSTGRES_USER
          value: auth_user
        - name: POSTGRES_PASSWORD
          value: "\${AUTH_DB_PASSWORD}"
        - name: POSTGRES_REPLICATION_MODE
          value: master
        - name: POSTGRES_REPLICATION_USER
          value: replicator
        - name: POSTGRES_REPLICATION_PASSWORD
          value: "\${REPLICATION_PASSWORD}"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        volumeMounts:
        - name: auth-db-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: auth-db-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 100Gi
      storageClassName: fast-ssd
---
apiVersion: v1
kind: Service
metadata:
  name: auth-db-prod
  namespace: $INFRASTRUCTURE_NAMESPACE
spec:
  selector:
    app: auth-db-prod
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
EOF

    # Deploy Redis Cluster for production
    cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-cluster-prod
  namespace: $INFRASTRUCTURE_NAMESPACE
spec:
  serviceName: redis-cluster-prod
  replicas: 6
  selector:
    matchLabels:
      app: redis-cluster-prod
  template:
    metadata:
      labels:
        app: redis-cluster-prod
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        command:
        - redis-server
        - /etc/redis/redis.conf
        - --cluster-enabled
        - "yes"
        - --cluster-config-file
        - nodes.conf
        - --cluster-node-timeout
        - "5000"
        - --appendonly
        - "yes"
        ports:
        - containerPort: 6379
          name: client
        - containerPort: 16379
          name: gossip
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        volumeMounts:
        - name: redis-data
          mountPath: /data
        - name: redis-config
          mountPath: /etc/redis
      volumes:
      - name: redis-config
        configMap:
          name: redis-config
  volumeClaimTemplates:
  - metadata:
      name: redis-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 20Gi
EOF

    success "Production infrastructure deployed"
}

# Function to deploy microservices with blue-green strategy
deploy_microservices() {
    log "Deploying microservices to production..."

    # Apply production deployment configuration
    kubectl apply -f k8s/production-deployment.yaml

    # Wait for all deployments to be ready
    local services=("auth-service" "academic-service" "analytics-service" "notification-service" "sync-orchestrator" "university-integration" "tenant-service")

    for service in "${services[@]}"; do
        log "Waiting for $service deployment to be ready..."
        kubectl rollout status deployment/$service -n $PRODUCTION_NAMESPACE --timeout=600s

        # Verify health
        local health_check=$(kubectl exec -n $PRODUCTION_NAMESPACE deployment/$service -- \
            curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health 2>/dev/null || echo "000")

        if [[ $health_check == "200" ]]; then
            success "$service is healthy and ready"
        else
            error "$service health check failed (HTTP $health_check)"
            return 1
        fi
    done

    success "All microservices deployed and healthy"
}

# Function to configure production monitoring
setup_production_monitoring() {
    log "Setting up production monitoring..."

    # Deploy Prometheus for production
    kubectl apply -f k8s/performance-monitoring.yaml -n $PRODUCTION_NAMESPACE

    # Deploy Grafana dashboards
    kubectl apply -f k8s/grafana-dashboard.yaml -n $PRODUCTION_NAMESPACE

    # Wait for monitoring stack to be ready
    kubectl wait --for=condition=available deployment/prometheus-server -n $PRODUCTION_NAMESPACE --timeout=300s
    kubectl wait --for=condition=available deployment/grafana -n $PRODUCTION_NAMESPACE --timeout=300s

    success "Production monitoring configured"
}

# Function to configure SSL certificates
configure_ssl_certificates() {
    log "Configuring SSL certificates for production..."

    # Install cert-manager if not already installed
    if ! kubectl get namespace cert-manager >/dev/null 2>&1; then
        kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
        kubectl wait --for=condition=Available deployment/cert-manager -n cert-manager --timeout=300s
    fi

    # Create ClusterIssuer for Let's Encrypt
    cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@spike-platform.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

    success "SSL certificates configured"
}

# Function to run production smoke tests
run_production_smoke_tests() {
    log "Running production smoke tests..."

    # Create a test pod for running smoke tests
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: production-smoke-test
  namespace: $PRODUCTION_NAMESPACE
spec:
  restartPolicy: Never
  containers:
  - name: curl
    image: curlimages/curl:latest
    command: ["/bin/sh"]
    args:
    - -c
    - |
      set -e
      echo "Running production smoke tests..."

      # Test each service health endpoint
      for service in auth-service academic-service analytics-service notification-service sync-orchestrator university-integration tenant-service; do
        echo "Testing \$service..."
        response=\$(curl -s -o /dev/null -w "%{http_code}" http://\$service:8080/health)
        if [ "\$response" = "200" ]; then
          echo "✓ \$service is healthy"
        else
          echo "✗ \$service health check failed (HTTP \$response)"
          exit 1
        fi
      done

      # Test API Gateway routing
      echo "Testing API Gateway routing..."
      response=\$(curl -s -o /dev/null -w "%{http_code}" http://api.spike-platform.com/auth/health)
      if [ "\$response" = "200" ]; then
        echo "✓ API Gateway routing is working"
      else
        echo "✗ API Gateway routing failed (HTTP \$response)"
        exit 1
      fi

      echo "All smoke tests passed!"
EOF

    # Wait for test completion
    kubectl wait --for=condition=Ready pod/production-smoke-test -n $PRODUCTION_NAMESPACE --timeout=60s

    # Check test results
    kubectl logs production-smoke-test -n $PRODUCTION_NAMESPACE

    local exit_code=$(kubectl get pod production-smoke-test -n $PRODUCTION_NAMESPACE -o jsonpath='{.status.containerStatuses[0].state.terminated.exitCode}')

    if [[ $exit_code == "0" ]]; then
        success "Production smoke tests passed"
        kubectl delete pod production-smoke-test -n $PRODUCTION_NAMESPACE
        return 0
    else
        error "Production smoke tests failed"
        return 1
    fi
}

# Function to enable traffic routing to production
enable_production_traffic() {
    log "Enabling traffic routing to production..."

    # Update DNS records (this would typically be done externally)
    warning "Manual DNS update required:"
    info "Update the following DNS records to point to production load balancer:"
    info "  - api.spike-platform.com"
    info "  - bgu.spike-platform.com"
    info "  - tau.spike-platform.com"
    info "  - huji.spike-platform.com"

    # Get load balancer IP/hostname
    local lb_ip=$(kubectl get service spike-production-ingress-nginx-controller -n $PRODUCTION_NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
    if [[ $lb_ip != "pending" ]]; then
        info "Load Balancer IP: $lb_ip"
    fi

    success "Production traffic routing configuration ready"
}

# Function to generate deployment report
generate_deployment_report() {
    log "Generating production deployment report..."

    local report_file="/tmp/production-deployment-report.json"
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    # Collect deployment metrics
    local total_pods=$(kubectl get pods -n $PRODUCTION_NAMESPACE --no-headers | wc -l)
    local running_pods=$(kubectl get pods -n $PRODUCTION_NAMESPACE --field-selector=status.phase=Running --no-headers | wc -l)
    local total_services=$(kubectl get services -n $PRODUCTION_NAMESPACE --no-headers | wc -l)

    cat > $report_file << EOF
{
  "production_deployment_report": {
    "timestamp": "$timestamp",
    "deployment_phase": "Phase 4 - Production Deployment",
    "status": "completed",
    "environment": {
      "namespace": "$PRODUCTION_NAMESPACE",
      "kubernetes_cluster": "$(kubectl config current-context)",
      "docker_registry": "$DOCKER_REGISTRY"
    },
    "deployment_metrics": {
      "total_pods": $total_pods,
      "running_pods": $running_pods,
      "pod_health_percentage": $(( (running_pods * 100) / total_pods )),
      "total_services": $total_services,
      "deployment_duration_minutes": $((SECONDS / 60))
    },
    "deployed_services": [
      "auth-service",
      "academic-service",
      "analytics-service",
      "notification-service",
      "sync-orchestrator",
      "university-integration",
      "tenant-service"
    ],
    "infrastructure_components": [
      "PostgreSQL clusters (per service)",
      "Redis cluster",
      "RabbitMQ cluster",
      "Prometheus monitoring",
      "Grafana dashboards",
      "Istio service mesh",
      "NGINX ingress controller"
    ],
    "security_features": [
      "TLS/SSL certificates (Let's Encrypt)",
      "Network policies",
      "Service accounts with RBAC",
      "Secret management",
      "Pod security contexts"
    ],
    "high_availability": [
      "Multiple replicas per service",
      "Horizontal pod autoscaling",
      "Pod disruption budgets",
      "Rolling update strategy",
      "Health checks and readiness probes"
    ],
    "monitoring_and_observability": [
      "Prometheus metrics collection",
      "Grafana dashboards",
      "Distributed tracing (Jaeger)",
      "Structured logging",
      "Alert manager configuration"
    ],
    "next_steps": [
      "Update DNS records for production domains",
      "Monitor system performance for 24 hours",
      "Conduct final load testing",
      "Train operations team on monitoring",
      "Schedule post-deployment review"
    ]
  }
}
EOF

    success "Production deployment report generated: $report_file"
    cat $report_file
}

# Main deployment orchestrator
main() {
    log "🚀 Starting Production Deployment for Spike Platform"
    log "================================================="

    local start_time=$SECONDS

    # Validate prerequisites
    if ! validate_prerequisites; then
        error "Prerequisites validation failed. Aborting deployment."
        exit 1
    fi

    # Create production secrets
    create_production_secrets

    # Build and push images
    build_and_push_images

    # Deploy infrastructure
    deploy_infrastructure

    # Configure SSL certificates
    configure_ssl_certificates

    # Deploy microservices
    if ! deploy_microservices; then
        error "Microservices deployment failed. Aborting."
        exit 1
    fi

    # Setup monitoring
    setup_production_monitoring

    # Run smoke tests
    if ! run_production_smoke_tests; then
        error "Production smoke tests failed. Review deployment."
        exit 1
    fi

    # Enable traffic routing
    enable_production_traffic

    # Generate deployment report
    generate_deployment_report

    local duration=$((SECONDS - start_time))
    success "🎉 Production deployment completed successfully!"
    success "⏱️  Total deployment time: ${duration}s ($(( duration / 60 ))m $(( duration % 60 ))s)"
    success "🌐 Platform ready for production traffic"

    log "\n📋 Next Steps:"
    log "1. Update DNS records for production domains"
    log "2. Monitor system performance and metrics"
    log "3. Conduct final load testing"
    log "4. Update documentation"
    log "5. Schedule team retrospective"
}

# Script entry point
case "${1:-main}" in
    "validate")
        validate_prerequisites
        ;;
    "secrets")
        create_production_secrets
        ;;
    "build")
        build_and_push_images
        ;;
    "infrastructure")
        deploy_infrastructure
        ;;
    "deploy")
        deploy_microservices
        ;;
    "monitoring")
        setup_production_monitoring
        ;;
    "ssl")
        configure_ssl_certificates
        ;;
    "test")
        run_production_smoke_tests
        ;;
    "traffic")
        enable_production_traffic
        ;;
    "report")
        generate_deployment_report
        ;;
    "main"|*)
        main
        ;;
esac