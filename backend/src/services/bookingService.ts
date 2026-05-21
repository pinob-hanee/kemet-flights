import { prisma } from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import logger from '../utils/logger';
import PaymentService from './paymentService';

export interface BookingPayload {
  userId: string;
  type: 'FLIGHT' | 'HOTEL' | 'TOUR' | 'CRUISE' | 'TRANSPORT' | 'VISA' | 'INSURANCE';
  startDate: string;
  endDate: string;
  totalPrice: number;
  notes?: string;
  couponCode?: string;
  
  // Specific properties
  hotelDetails?: { roomId: string; guestsCount: number };
  flightDetails?: { flightId: string; seatClass: string; seatNumber: string; passengers: any[] };
  tourDetails?: { tourPackageId: string; guestsCount: number };
  cruiseDetails?: { cruiseId: string; cabinType: string; guestsCount: number };
  
  // Payment Details
  paymentMethod: 'CARD' | 'PAYPAL' | 'WALLET';
  paymentGateway: 'STRIPE' | 'PAYMOB' | 'WALLET_INTERNAL';
  paymentToken?: string;
}

export class BookingService {
  /**
   * Generates a unique, high-end travel booking reference number.
   */
  public static generateReference(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randStr = '';
    for (let i = 0; i < 6; i++) {
      randStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `KMT-${today}-${randStr}`;
  }

  /**
   * Core transactional booking process.
   */
  public static async createBooking(payload: BookingPayload): Promise<any> {
    logger.info(`Initiating transactional booking of type: ${payload.type} for user: ${payload.userId}`);
    
    // Check coupon if provided
    let discount = 0;
    let finalPrice = payload.totalPrice;
    
    if (payload.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: payload.couponCode },
      });

      if (coupon && coupon.isActive && new Date(coupon.expiresAt) > new Date() && coupon.usageCount < coupon.usageLimit) {
        if (payload.totalPrice >= Number(coupon.minBookingAmount)) {
          if (coupon.discountType === 'PERCENTAGE') {
            discount = (payload.totalPrice * Number(coupon.value)) / 100;
          } else {
            discount = Number(coupon.value);
          }
          finalPrice = Math.max(0, payload.totalPrice - discount);
          logger.info(`Applied coupon ${payload.couponCode}, discount: $${discount}, final price: $${finalPrice}`);
        }
      }
    }

    // If paying via wallet, verify balance upfront
    if (payload.paymentMethod === 'WALLET') {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { walletBalance: true },
      });

      if (!user) throw new AppError('User not found', 404);
      if (Number(user.walletBalance) < finalPrice) {
        throw new AppError('Insufficient wallet balance to cover this booking', 400);
      }
    }

    const reference = this.generateReference();

    // Perform payment gateway simulation
    const payResult = await PaymentService.processPayment({
      bookingId: reference,
      amount: finalPrice,
      currency: 'USD',
      method: payload.paymentMethod,
      gateway: payload.paymentGateway,
      token: payload.paymentToken,
    });

    if (!payResult.success) {
      throw new AppError('Payment processing failed. Please check payment credentials.', 402);
    }

    // Database transactional write
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create base booking
      const booking = await tx.booking.create({
        data: {
          userId: payload.userId,
          type: payload.type,
          status: 'CONFIRMED',
          totalPrice: finalPrice,
          startDate: new Date(payload.startDate),
          endDate: new Date(payload.endDate),
          referenceNumber: reference,
          paymentStatus: 'PAID',
          notes: payload.notes,
        },
      });

      // 2. Create specific booking relation
      if (payload.type === 'HOTEL' && payload.hotelDetails) {
        await tx.hotelBooking.create({
          data: {
            bookingId: booking.id,
            roomId: payload.hotelDetails.roomId,
            guestsCount: payload.hotelDetails.guestsCount,
          },
        });
        
        // Update Room inventory
        await tx.room.update({
          where: { id: payload.hotelDetails.roomId },
          data: { inventory: { decrement: 1 } },
        });
      } else if (payload.type === 'FLIGHT' && payload.flightDetails) {
        await tx.flightBooking.create({
          data: {
            bookingId: booking.id,
            flightId: payload.flightDetails.flightId,
            seatClass: payload.flightDetails.seatClass,
            seatNumber: payload.flightDetails.seatNumber,
            passengers: payload.flightDetails.passengers,
          },
        });
      } else if (payload.type === 'TOUR' && payload.tourDetails) {
        await tx.tourBooking.create({
          data: {
            bookingId: booking.id,
            tourPackageId: payload.tourDetails.tourPackageId,
            guestsCount: payload.tourDetails.guestsCount,
          },
        });
      } else if (payload.type === 'CRUISE' && payload.cruiseDetails) {
        await tx.cruiseBooking.create({
          data: {
            bookingId: booking.id,
            cruiseId: payload.cruiseDetails.cruiseId,
            cabinType: payload.cruiseDetails.cabinType,
            guestsCount: payload.cruiseDetails.guestsCount,
          },
        });
      }

      // 3. Create payment record
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: finalPrice,
          gateway: payload.paymentGateway,
          gatewayTransactionId: payResult.transactionId,
          status: 'PAID',
          currency: 'USD',
          method: payload.paymentMethod,
        },
      });

      // 4. Update wallet balance if internal wallet was used
      if (payload.paymentMethod === 'WALLET') {
        await tx.user.update({
          where: { id: payload.userId },
          data: { walletBalance: { decrement: finalPrice } },
        });

        await tx.walletTransaction.create({
          data: {
            userId: payload.userId,
            amount: -finalPrice,
            type: 'BOOKING',
            description: `Deduction for Booking ref: ${reference}`,
            createdAt: new Date(),
          },
        });
      }

      // 5. Award loyalty points (1 point per $10 spent)
      const pointsAwarded = Math.floor(finalPrice / 10);
      if (pointsAwarded > 0) {
        await tx.user.update({
          where: { id: payload.userId },
          data: { loyaltyPoints: { increment: pointsAwarded } },
        });

        await tx.loyaltyTransaction.create({
          data: {
            userId: payload.userId,
            points: pointsAwarded,
            type: 'EARNED',
            description: `Loyalty points earned from booking ref: ${reference}`,
          },
        });
      }

      // 6. Increment coupon counter if used
      if (payload.couponCode) {
        await tx.coupon.update({
          where: { code: payload.couponCode },
          data: { usageCount: { increment: 1 } },
        });
      }

      // 7. Fire user notification
      await tx.notification.create({
        data: {
          userId: payload.userId,
          title: 'Voyage Confirmed!',
          message: `Your booking for ${payload.type.toLowerCase()} was successfully reserved. Ref: ${reference}`,
          type: 'SUCCESS',
        },
      });

      // 8. Create an Audit Log
      await tx.auditLog.create({
        data: {
          userId: payload.userId,
          action: `CREATE_BOOKING_${payload.type}`,
          ipAddress: '127.0.0.1',
          userAgent: 'Server-Direct',
          details: { bookingRef: reference, cost: finalPrice },
        },
      });

      return {
        bookingId: booking.id,
        referenceNumber: reference,
        totalPaid: finalPrice,
        loyaltyPointsAwarded: pointsAwarded,
      };
    });

    logger.info(`Booking ref: ${reference} created and committed successfully.`);
    return result;
  }
}
export default BookingService;
