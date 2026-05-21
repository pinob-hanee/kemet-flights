# Kemet Luxury Travel - Production Deployment Guide

This document provides guidelines to deploy Kemet Luxury Travel across local development machines and high-scale cloud environments (AWS/GCP).

## 1. Local Development Launch

Follow these steps to ignite local Express and React engines:

### Prerequisites
- Node.js (v20+ recommended)
- PostgreSQL
- Redis

### Step 1: Run the Backend Services
1. Open a command terminal inside `/backend`.
2. Duplicate `.env.example` as `.env` and fill variables (db, token keys).
3. Run the installer: `npm install`
4. Setup database schemas: `npx prisma generate`
5. Boot the server: `npm run dev` (running on `http://localhost:5000`)

### Step 2: Run the Web Client
1. Open a separate terminal inside `/frontend`.
2. Run the installer: `npm install`
3. Launch Vite server: `npm run dev` (available on `http://localhost:3000`)

---

## 2. Docker Containerized Orchestration

To run a production-equivalent sandbox using Docker Compose:

1. Navigate to `/docker` directory.
2. Fire the orchestration command:
   ```bash
   docker-compose up --build -d
   ```
3. Docker compiles multi-stage backend files, builds Vite static assets, configures the Nginx reverse-proxy on port `80` (and `443` for SSL configurations), and spins up local Postgres/Redis containers.
4. Access the web platform directly at `http://localhost`.

---

## 3. High-Scale AWS Cloud Deployments

To migrate this architecture to serve millions of global travelers:

1. **Database Tier**: Migrate PostgreSQL to **AWS RDS (Multi-AZ)** or **GCP Cloud SQL** for automated backups and scale replica nodes.
2. **Caching Tier**: Migrate Redis to **AWS ElastiCache** or **GCP Memorystore**.
3. **Application Tier**: Package the backend Docker image and deploy to **AWS ECS (Fargate)** or **GCP Cloud Run**, setting auto-scaling thresholds.
4. **Content Delivery Network**: Host static compiled React assets inside **AWS S3** and route them via **CloudFront** (CDN) to ensure near-zero loading latencies in Europe, USA, and Middle East.
