# Multi-stage build for production
FROM node:18-slim AS builder

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --only=production && \
    npx prisma generate

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create storage directories
RUN mkdir -p storage/documents storage/photos storage/temp

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "dist/src/server.js"]
