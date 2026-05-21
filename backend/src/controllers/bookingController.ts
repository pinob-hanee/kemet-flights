import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import BookingService from '../services/bookingService';
import { prisma } from '../config/db';
import { AppError } from '../middlewares/errorHandler';

export class BookingController {
  /**
   * Create a booking (Flight, Hotel, Tour, Cruise).
   */
  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const bookingPayload = {
        ...req.body,
        userId: req.user.id,
      };

      const result = await BookingService.createBooking(bookingPayload);

      res.status(201).json({
        success: true,
        message: 'Booking created and confirmed successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch bookings of the authenticated traveler.
   */
  public static async getMyBookings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const bookings = await prisma.booking.findMany({
        where: { userId: req.user.id },
        include: {
          hotelBooking: { include: { room: { include: { hotel: true } } } },
          flightBooking: { include: { flight: true } },
          tourBooking: { include: { tourPackage: true } },
          cruiseBooking: { include: { cruise: true } },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin-only: retrieve all booking records for the analytics console.
   */
  public static async getAllBookings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookings = await prisma.booking.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel or request refund.
   */
  public static async cancelBooking(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!req.user) throw new AppError('Unauthorized', 401);

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { payments: true },
      });

      if (!booking) throw new AppError('Booking not found', 404);

      // Verify ownership (only admins or the booking owner can cancel)
      if (booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new AppError('Forbidden: Access denied to this resource', 403);
      }

      if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
        throw new AppError('Booking is already cancelled or refunded', 400);
      }

      // Update DB state
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: { status: 'CANCELLED', paymentStatus: 'REFUNDED' },
      });

      // Handle cash refund simulation if payment succeeded
      const successPayment = booking.payments.find((p) => p.status === 'PAID');
      if (successPayment) {
        // Refund back to user's wallet
        await prisma.user.update({
          where: { id: booking.userId },
          data: { walletBalance: { increment: booking.totalPrice } },
        });

        await prisma.walletTransaction.create({
          data: {
            userId: booking.userId,
            amount: booking.totalPrice,
            type: 'REFUND',
            description: `Refund for Cancelled Booking ref: ${booking.referenceNumber}`,
            createdAt: new Date(),
          },
        });

        // Insert Refund log
        await prisma.refund.create({
          data: {
            bookingId: booking.id,
            paymentId: successPayment.id,
            amount: booking.totalPrice,
            status: 'SUCCESS',
            reason: 'User cancelled booking request',
            approvedBy: req.user.role === 'ADMIN' ? 'ADMIN_ACTION' : 'SYSTEM_AUTO',
          },
        });
      }

      res.status(200).json({
        success: true,
        message: 'Booking cancelled and fully refunded to your wallet.',
        data: updatedBooking,
      });
    } catch (error) {
      next(error);
    }
  }
}
export default BookingController;
