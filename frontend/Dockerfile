# ===================================================
# STAGE 1: Static Asset Compiler
# ===================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ===================================================
# STAGE 2: High Performance Nginx Host
# ===================================================
FROM nginx:1.25-alpine

# Copy compiled static assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx proxy settings
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
