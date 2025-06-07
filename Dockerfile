FROM node:lts-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS development
RUN --mount=type=cache,target=/root/.npm npm install
COPY . .

# Set environment to development
ENV NODE_ENV=development

# Expose the port
EXPOSE 3000

# Use nodemon for development with proper error handling
CMD ["sh", "-c", "npm run dev"]

# Production stage
FROM base AS production
RUN --mount=type=cache,target=/root/.npm npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000
CMD ["npm", "start"]