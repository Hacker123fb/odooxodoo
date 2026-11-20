# ==============================================================================
# Production Dockerfile for TransitOps Backend (Node.js 20 Alpine)
# Optimized for minimum image size, security, and maximum performance
# ==============================================================================

FROM node:20-alpine AS base

# Install OpenSSL for Prisma and curl for healthchecks
RUN apk add --no-cache openssl libc6-compat curl

WORKDIR /app

# Dependencies stage
FROM base AS dependencies
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies including devDependencies for prisma generate
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Create non-root system user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 transitops

# Copy production node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/prisma ./prisma
COPY package*.json ./
COPY src ./src
COPY logs ./logs

# Ensure non-root ownership of app directory and logs
RUN mkdir -p /app/logs && chown -R transitops:nodejs /app

USER transitops

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/v1/health/ping || exit 1

CMD ["node", "src/server.js"]
