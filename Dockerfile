# Build stage
FROM node:24-alpine AS builder

# Install build dependencies for canvas and pdfkit
RUN apk add --no-cache \
    python3 \
    g++ \
    cairo-dev \
    pango-dev \
    libjpeg-turbo-dev \
    giflib-dev \
    librsvg-dev

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:24-alpine

# Install runtime dependencies for canvas
RUN apk add --no-cache \
    cairo \
    pango \
    libjpeg-turbo \
    giflib \
    librsvg

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files
COPY --from=builder /app/dist ./dist

# Run as non-root user
USER node

# Expose nothing (uses stdio)
ENTRYPOINT ["node", "./dist/index.js"]
