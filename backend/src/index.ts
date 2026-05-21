import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import flightRouter from './routes/flightRouter';
import healthRouter from './routes/healthRouter';
import { errorHandler } from './middlewares/errorHandler';
import { connectDatabase, disconnectDatabase } from './config/db';
import logger from './utils/logger';

// Load environment configurations
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Layer ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
      connectSrc: ["'self'", `http://localhost:${PORT}`]
    }
  }
}));

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── Cookie Parser ───────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── Body Parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate Limiting (OWASP) ───────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests originating from this client. Please try again after 15 minutes.',
      statusCode: 429
    }
  }
});
app.use('/api/', limiter);

// ─── Swagger API Documentation ────────────────────────────────────────────────
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kemet Luxury Travel API',
      version: '1.0.0',
      description: "Enterprise-grade REST API for the Kemet Luxury Travel Platform — Egypt's premier tourism booking engine. Supports flights, hotels, tours, Nile cruises, AI-driven itineraries, loyalty programs, and integrated payment gateways.",
      contact: {
        name: 'Kemet Engineering Team',
        email: 'api@kemet.io',
      },
      license: {
        name: 'Private — All Rights Reserved',
      },
    },
    servers: [
      { url: `http://localhost:${PORT}/api/v1`, description: 'Development Server' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste your JWT access token here (without "Bearer " prefix)',
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'Register, login, token refresh, and logout' },
      { name: 'Travel', description: 'Hotels, flights, tours, and cruise browsing' },
      { name: 'Bookings', description: 'Transactional booking engine with payments & loyalty' },
      { name: 'Admin', description: 'Administrative dashboard operations (ADMIN role required)' },
      { name: 'AI Assistant', description: 'AI-powered travel planning and chat' },
      { name: 'System', description: 'Health checks and system diagnostics' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: `
    .swagger-ui .topbar { background-color: #0D0F12; }
    .swagger-ui .topbar-wrapper .link { content: none; }
    .swagger-ui .info h1 { color: #D4AF37; }
    .swagger-ui .info .description { color: #ccc; }
    .swagger-ui .scheme-container { background: #1a1c20; padding: 10px 0; }
  `,
  customSiteTitle: 'Kemet Luxury Travel — API Docs',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
}));

// ─── Health Check (Dedicated Router with DB Probe) ────────────────────────────
app.use('/health', healthRouter);

// ─── Duffel Flight Routes ────────────────────────────────────────────────────
app.use('/api/v1/flights', flightRouter);

// ─── REST API V1 Routing Namespace ────────────────────────────────────────────
app.use('/api/v1', apiRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      code: 'ROUTE_NOT_FOUND',
      statusCode: 404,
      timestamp: new Date().toISOString(),
    },
  });
});

// ─── Centralized Global Error Handler ────────────────────────────────────────
app.use(errorHandler);

// ─── Bootstrap: Connect DB → Start Server ────────────────────────────────────
const bootstrap = async () => {
  try {
    await connectDatabase();

    const server = app.listen(PORT, () => {
      logger.info(`===================================================`);
      logger.info(` Pharaoh Golden Portal is active on port: ${PORT}   `);
      logger.info(` Environment: ${process.env.NODE_ENV || 'development'} `);
      logger.info(` API Docs:    http://localhost:${PORT}/api/docs       `);
      logger.info(` Health:      http://localhost:${PORT}/health         `);
      logger.info(`===================================================`);
    });

    // Graceful termination routines
    const gracefulShutdown = async (signal: string) => {
      logger.warn(`Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await disconnectDatabase();
        process.exit(0);
      });

      // Force exit after 10 seconds if graceful close hangs
      setTimeout(() => {
        logger.error('Forced exit after graceful shutdown timeout.');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception:', err);
      gracefulShutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled promise rejection:', reason);
    });

  } catch (err) {
    logger.error('API critical boot failure:', err);
    process.exit(1);
  }
};

bootstrap();
export default app;
