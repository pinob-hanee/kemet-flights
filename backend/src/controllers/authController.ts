import { Request, Response, NextFunction } from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'kemet_pharaoh_jwt_luxe_key_gold_sandstone_2026_super_secure_vault';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'kemet_pharaoh_jwt_luxe_refresh_secret_key_nile_night_2026_safe_vault';

export class AuthController {
  /**
   * Register a new user with standard argon2 hashing and a free welcome wallet balance.
   */
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name, phone } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new AppError('Email address is already in use', 400);
      }

      // Hash password securely with Argon2
      const passwordHash = await argon2.hash(password);

      // Create new customer with welcome rewards (wallet balance & loyalty points)
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          phone,
          role: 'CUSTOMER',
          walletBalance: 500.00, // $500 welcome credit for luxury travelers
          loyaltyPoints: 100,    // 100 free points
        },
      });

      // Write audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'REGISTER',
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
        },
      });

      logger.info(`User registered successfully: ${user.email}`);

      res.status(201).json({
        success: true,
        message: 'Account registered successfully. Welcome to Kemet Luxury Travel.',
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user, sign JWTs, and set secure HttpOnly cookies.
   */
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new AppError('Invalid email or password credentials', 401);
      }

      // Verify Argon2 hash
      const isValid = await argon2.verify(user.passwordHash, password);
      if (!isValid) {
        throw new AppError('Invalid email or password credentials', 401);
      }

      // Generate Access Token (valid for 1 hour)
      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Generate Refresh Token (valid for 7 days)
      const refreshToken = jwt.sign(
        { id: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Save refresh token to DB
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Log active user session
      await prisma.session.create({
        data: {
          userId: user.id,
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
        },
      });

      logger.info(`User logged in: ${user.email}`);

      // Set Refresh Token in secure cookie (OWASP best practice)
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          token: accessToken,
          walletBalance: user.walletBalance,
          loyaltyPoints: user.loyaltyPoints,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Token refresh endpoint with token rotation logic to prevent replay attacks.
   */
  public static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies.refreshToken || req.body.refreshToken;
      if (!token) {
        throw new AppError('Refresh token is missing', 401);
      }

      // Check DB for token
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!tokenRecord || tokenRecord.revoked || new Date() > tokenRecord.expiresAt) {
        throw new AppError('Invalid, expired, or revoked refresh token', 401);
      }

      // Verify JWT
      let decoded: any;
      try {
        decoded = jwt.verify(token, JWT_REFRESH_SECRET);
      } catch (err) {
        throw new AppError('Refresh signature verification failed', 401);
      }

      // Rotate Refresh Token
      const newAccessToken = jwt.sign(
        { id: tokenRecord.user.id, email: tokenRecord.user.email, role: tokenRecord.user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const newRefreshToken = jwt.sign(
        { id: tokenRecord.user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Invalidate current and issue new rotated token
      await prisma.$transaction([
        prisma.refreshToken.update({
          where: { id: tokenRecord.id },
          data: { revoked: true, replacedBy: newRefreshToken },
        }),
        prisma.refreshToken.create({
          data: {
            token: newRefreshToken,
            userId: tokenRecord.userId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        }),
      ]);

      // Set cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        data: {
          token: newAccessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Invalidate session and clear HTTP cookies.
   */
  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies.refreshToken || req.body.refreshToken;
      if (token) {
        await prisma.refreshToken.updateMany({
          where: { token },
          data: { revoked: true },
        });
      }

      res.clearCookie('refreshToken');
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
export default AuthController;
