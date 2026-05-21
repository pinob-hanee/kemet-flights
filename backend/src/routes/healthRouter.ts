import { Router, Request, Response } from 'express';
import { prisma } from '../config/db';
import logger from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: System health check
 *     description: Probes the API server and database connection. Returns 200 if healthy, 503 if degraded.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: All systems operational
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: connected
 *                     api:
 *                       type: string
 *                       example: operational
 *                 uptime:
 *                   type: number
 *                   description: Process uptime in seconds
 *       503:
 *         description: System degraded (database unreachable)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Lightweight ping — does not load data, just checks connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: 'connected',
        api: 'operational',
      },
      uptime: Math.floor(process.uptime()),
    });
  } catch (error) {
    logger.error('Health check failed — database unreachable:', error);
    res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: 'disconnected',
        api: 'operational',
      },
      uptime: Math.floor(process.uptime()),
    });
  }
});

export default router;
