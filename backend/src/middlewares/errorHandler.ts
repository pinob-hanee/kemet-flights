import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details: any;

  constructor(message: string, statusCode: number = 500, details: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An internal server error occurred';
  let errorCode = err.code || 'INTERNAL_ERROR';
  const details = err.details || null;

  // ─── Handle Prisma Client Errors ─────────────────────────────────────────
  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'A record with this information already exists';
    errorCode = 'DUPLICATE_RECORD';
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
    errorCode = 'NOT_FOUND';
  } else if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Foreign key constraint violation';
    errorCode = 'CONSTRAINT_VIOLATION';
  } else if (err.code === 'P2014') {
    statusCode = 400;
    message = 'Relation constraint violation';
    errorCode = 'RELATION_VIOLATION';
  }

  // ─── Handle JWT Errors ────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    errorCode = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
    errorCode = 'TOKEN_EXPIRED';
  } else if (err.name === 'NotBeforeError') {
    statusCode = 401;
    message = 'Token not yet active';
    errorCode = 'TOKEN_NOT_ACTIVE';
  }

  // ─── Handle Zod Validation Errors ────────────────────────────────────────
  if (err.name === 'ZodError') {
    statusCode = 422;
    message = 'Request validation failed';
    errorCode = 'VALIDATION_ERROR';
  }

  // ─── Logging Strategy ────────────────────────────────────────────────────
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} — ${statusCode}: ${message}`, {
      stack: err.stack,
      body: req.body,
      ip: req.ip,
      errorCode,
    });
  } else {
    logger.warn(`[${req.method}] ${req.path} — ${statusCode}: ${message}`, {
      errorCode,
      ip: req.ip,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: errorCode,
      statusCode,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
};

export default errorHandler;
