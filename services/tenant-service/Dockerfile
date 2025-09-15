# Tenant Service Dockerfile
FROM node:18-alpine AS base

# Install security updates and required tools
RUN apk update && apk upgrade && apk add --no-cache dumb-init curl

# Create app directory
WORKDIR /usr/src/app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S tenantservice -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
FROM base AS deps
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS build
COPY . .
RUN npm ci && npm run build

# Production stage
FROM base AS runtime

# Set environment
ENV NODE_ENV production

# Copy built application
COPY --from=build --chown=tenantservice:nodejs /usr/src/app/dist ./dist
COPY --from=deps --chown=tenantservice:nodejs /usr/src/app/node_modules ./node_modules
COPY --chown=tenantservice:nodejs package*.json ./

# Create logs directory
RUN mkdir -p logs && chown -R tenantservice:nodejs logs

# Switch to non-root user
USER tenantservice

# Expose port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8002/health', (res) => { \
        process.exit(res.statusCode === 200 ? 0 : 1) \
    }).on('error', () => process.exit(1))"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]