#!/bin/bash

# Phase 1 Deployment Script for Spike Platform Microservices Migration
# This script deploys the foundation services: Auth Service and Tenant Management Service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="spike-platform"
DOCKER_REGISTRY="registry.spike-platform.com"
ENVIRONMENT=${1:-"development"}
KUBECONFIG_FILE=${2:-"~/.kube/config"}

echo -e "${BLUE}🚀 Starting Spike Platform Phase 1 Deployment${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Namespace: ${NAMESPACE}${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for deployment
wait_for_deployment() {
    local deployment_name=$1
    local namespace=$2
    echo -e "${YELLOW}⏳ Waiting for deployment ${deployment_name} to be ready...${NC}"
    kubectl rollout status deployment/${deployment_name} -n ${namespace} --timeout=300s
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Deployment ${deployment_name} is ready${NC}"
    else
        echo -e "${RED}❌ Deployment ${deployment_name} failed${NC}"
        exit 1
    fi
}

# Function to check service health
check_service_health() {
    local service_name=$1
    local namespace=$2
    local port=$3

    echo -e "${YELLOW}🔍 Checking health of ${service_name}...${NC}"

    # Port forward in background
    kubectl port-forward service/${service_name} ${port}:${port} -n ${namespace} &
    local port_forward_pid=$!

    # Wait a moment for port-forward to establish
    sleep 5

    # Check health endpoint
    local health_check=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/health || echo "000")

    # Kill port-forward
    kill ${port_forward_pid} 2>/dev/null || true

    if [ "${health_check}" = "200" ]; then
        echo -e "${GREEN}✅ ${service_name} is healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ ${service_name} health check failed (HTTP ${health_check})${NC}"
        return 1
    fi
}

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command_exists kubectl; then
    echo -e "${RED}❌ kubectl is required but not installed${NC}"
    exit 1
fi

if ! command_exists helm; then
    echo -e "${RED}❌ helm is required but not installed${NC}"
    exit 1
fi

if ! command_exists docker; then
    echo -e "${RED}❌ docker is required but not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites satisfied${NC}"

# Verify cluster access
echo -e "${BLUE}🔗 Verifying Kubernetes cluster access...${NC}"
if ! kubectl cluster-info >/dev/null 2>&1; then
    echo -e "${RED}❌ Cannot access Kubernetes cluster${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Kubernetes cluster accessible${NC}"

# Create namespace if it doesn't exist
echo -e "${BLUE}📦 Setting up namespace...${NC}"
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✅ Namespace ${NAMESPACE} ready${NC}"

# Apply Kubernetes infrastructure
echo -e "${BLUE}🏗️  Deploying infrastructure components...${NC}"

echo -e "${YELLOW}   📝 Creating namespaces...${NC}"
kubectl apply -f k8s/infrastructure/namespace.yaml

echo -e "${YELLOW}   🐘 Deploying PostgreSQL...${NC}"
kubectl apply -f k8s/infrastructure/postgresql.yaml

echo -e "${YELLOW}   🔴 Deploying Redis...${NC}"
kubectl apply -f k8s/infrastructure/redis.yaml

echo -e "${YELLOW}   🐰 Deploying RabbitMQ...${NC}"
kubectl apply -f k8s/infrastructure/rabbitmq.yaml

echo -e "${GREEN}✅ Infrastructure components deployed${NC}"

# Wait for infrastructure to be ready
echo -e "${BLUE}⏳ Waiting for infrastructure to be ready...${NC}"
kubectl wait --for=condition=available deployment/postgresql -n spike-infrastructure --timeout=300s
kubectl wait --for=condition=available deployment/redis -n spike-infrastructure --timeout=300s
kubectl wait --for=condition=available deployment/rabbitmq -n spike-infrastructure --timeout=300s
echo -e "${GREEN}✅ Infrastructure is ready${NC}"

# Build Docker images if in development mode
if [ "${ENVIRONMENT}" = "development" ]; then
    echo -e "${BLUE}🐳 Building Docker images for development...${NC}"

    echo -e "${YELLOW}   Building auth-service...${NC}"
    docker build -t ${DOCKER_REGISTRY}/auth-service:latest ./services/auth-service/

    echo -e "${YELLOW}   Building tenant-service...${NC}"
    docker build -t ${DOCKER_REGISTRY}/tenant-service:latest ./services/tenant-service/

    echo -e "${GREEN}✅ Docker images built${NC}"
fi

# Deploy services using Helm
echo -e "${BLUE}📊 Deploying Spike Platform services...${NC}"

# Update Helm dependencies
echo -e "${YELLOW}   📦 Updating Helm dependencies...${NC}"
helm dependency update charts/spike-platform

# Install/upgrade the Helm chart
echo -e "${YELLOW}   🚀 Deploying services with Helm...${NC}"
helm upgrade --install spike-platform ./charts/spike-platform \
    --namespace ${NAMESPACE} \
    --set global.imageRegistry=${DOCKER_REGISTRY} \
    --set authService.image.tag=latest \
    --set tenantService.image.tag=latest \
    --set environment=${ENVIRONMENT} \
    --wait \
    --timeout=10m

echo -e "${GREEN}✅ Spike Platform services deployed${NC}"

# Apply Istio configuration
if command_exists istioctl; then
    echo -e "${BLUE}🕸️  Applying Istio service mesh configuration...${NC}"

    echo -e "${YELLOW}   🚪 Applying gateway configuration...${NC}"
    kubectl apply -f k8s/istio/gateway.yaml

    echo -e "${YELLOW}   🔒 Applying security policies...${NC}"
    kubectl apply -f k8s/istio/security.yaml

    echo -e "${GREEN}✅ Service mesh configuration applied${NC}"
else
    echo -e "${YELLOW}⚠️  Istio not found, skipping service mesh configuration${NC}"
fi

# Wait for deployments to be ready
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
wait_for_deployment "spike-platform-auth-service" ${NAMESPACE}
wait_for_deployment "spike-platform-tenant-service" ${NAMESPACE}

# Run health checks
echo -e "${BLUE}🏥 Running health checks...${NC}"
sleep 10  # Give services a moment to fully start

# Check auth service health
check_service_health "spike-platform-auth-service" ${NAMESPACE} 8001

# Check tenant service health
check_service_health "spike-platform-tenant-service" ${NAMESPACE} 8002

# Display deployment status
echo -e "${BLUE}📊 Deployment Summary${NC}"
echo ""
kubectl get deployments -n ${NAMESPACE}
echo ""
kubectl get services -n ${NAMESPACE}
echo ""
kubectl get pods -n ${NAMESPACE}
echo ""

# Show service endpoints
echo -e "${BLUE}🌐 Service Endpoints${NC}"
echo ""

if command_exists istioctl; then
    # If Istio is available, show gateway information
    echo -e "${GREEN}Gateway URL:${NC}"
    kubectl get gateway spike-platform-gateway -n ${NAMESPACE} -o jsonpath='{.spec.servers[0].hosts[0]}' 2>/dev/null || echo "Gateway not ready yet"
    echo ""
fi

echo -e "${GREEN}Internal Service URLs:${NC}"
echo "  Auth Service: http://spike-platform-auth-service.${NAMESPACE}.svc.cluster.local:8001"
echo "  Tenant Service: http://spike-platform-tenant-service.${NAMESPACE}.svc.cluster.local:8002"
echo ""

# Show how to access services locally
echo -e "${BLUE}🔧 Local Development Access${NC}"
echo ""
echo "To access services locally, run these commands in separate terminals:"
echo ""
echo -e "${YELLOW}Auth Service:${NC}"
echo "kubectl port-forward service/spike-platform-auth-service 8001:8001 -n ${NAMESPACE}"
echo ""
echo -e "${YELLOW}Tenant Service:${NC}"
echo "kubectl port-forward service/spike-platform-tenant-service 8002:8002 -n ${NAMESPACE}"
echo ""

# Show monitoring endpoints
echo -e "${BLUE}📈 Monitoring & Observability${NC}"
echo ""
echo "Prometheus: kubectl port-forward service/prometheus-server 9090:80 -n ${NAMESPACE}"
echo "Grafana: kubectl port-forward service/grafana 3000:80 -n ${NAMESPACE}"
echo "Jaeger: kubectl port-forward service/jaeger-query 16686:16686 -n ${NAMESPACE}"
echo ""

# Show next steps
echo -e "${BLUE}✨ Phase 1 Deployment Complete!${NC}"
echo ""
echo -e "${GREEN}✅ Successfully deployed:${NC}"
echo "   • Kubernetes infrastructure"
echo "   • PostgreSQL, Redis, RabbitMQ"
echo "   • Auth Service with multi-tenant support"
echo "   • Tenant Management Service"
echo "   • Service mesh configuration (if Istio available)"
echo "   • Monitoring and observability stack"
echo ""

echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "   1. Run contract tests: npm run test:contracts"
echo "   2. Deploy to staging: ./scripts/deploy-staging.sh"
echo "   3. Run multi-tenant validation: npm run test:multi-tenant"
echo "   4. Configure feature flags for gradual rollout"
echo "   5. Begin Phase 2 planning and implementation"
echo ""

echo -e "${BLUE}📚 Documentation:${NC}"
echo "   • API Documentation: http://localhost:8001/docs (when port-forwarded)"
echo "   • Migration Progress: MIGRATION_CHANGELOG.md"
echo "   • Development Guide: CLAUDE.md"
echo ""

echo -e "${GREEN}🎉 Phase 1 Foundation Setup is now complete!${NC}"