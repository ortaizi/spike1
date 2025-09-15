# Auth Service Dockerfile
FROM node:18-alpine AS base

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Create app directory
WORKDIR /usr/src/app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S authservice -u 1001

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
COPY --from=build --chown=authservice:nodejs /usr/src/app/dist ./dist
COPY --from=deps --chown=authservice:nodejs /usr/src/app/node_modules ./node_modules
COPY --chown=authservice:nodejs package*.json ./

# Create logs directory
RUN mkdir -p logs && chown -R authservice:nodejs logs

# Switch to non-root user
USER authservice

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8001/health', (res) => { \
        process.exit(res.statusCode === 200 ? 0 : 1) \
    }).on('error', () => process.exit(1))"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]