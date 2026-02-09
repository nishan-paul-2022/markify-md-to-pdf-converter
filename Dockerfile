# Base stage
FROM node:20-slim AS base
WORKDIR /app

# Dependencies stage
FROM base AS deps
# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
# Copy prisma schema so postinstall 'prisma generate' works
COPY prisma ./prisma/
RUN npm ci

# Build stage
FROM base AS builder
# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept DATABASE_URL as build argument
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

RUN npx prisma generate
RUN npm run build

# Production stage
FROM mcr.microsoft.com/playwright:v1.57.0-noble AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install fonts and openssl
RUN apt-get update && apt-get install -y \
    fonts-inter \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-freefont-ttf \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy standalone build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Copy prisma directory for migrations/client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"


# Install prisma CLI to avoid npx downloads in production
RUN npm install -g prisma

# Note: We use a simple node startup, but you can run migrations before this if needed
CMD ["node", "server.js"]
