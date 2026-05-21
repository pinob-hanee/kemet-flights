import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { prisma } from '../config/db';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'CUSTOMER' | 'ADMIN' | 'VENDOR' | 'SUPPORT' | 'AFFILIATE';
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication credentials are required', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Invalid token format', 401);
    }

    const secret = process.env.JWT_SECRET || 'kemet_pharaoh_jwt_luxe_key_gold_sandstone_2026_super_secure_vault';
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Token has expired', 401);
      }
      throw new AppError('Invalid or compromised signature', 401);
    }

    // Verify user exists in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new AppError('User account associated with token no longer exists', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (
  ...allowedRoles: ('CUSTOMER' | 'ADMIN' | 'VENDOR' | 'SUPPORT' | 'AFFILIATE')[]
) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required to perform this action', 401);
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AppError('Access denied: Insufficient privileges', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
export default authenticate;
