# ===================================================
# STAGE 1: Builder Engine
# ===================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependency catalogs
COPY package*.json ./
RUN npm ci

# Copy codebase and compile TypeScript
COPY . .
RUN npx prisma generate
RUN npm run build

# Prune devDependencies
RUN npm prune --production

# ===================================================
# STAGE 2: Secure Lightweight Runtime
# ===================================================
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy compiled artifacts and production dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

CMD ["node", "dist/index.js"]
