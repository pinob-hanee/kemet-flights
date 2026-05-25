import { Request, Response, NextFunction } from 'express';
import { duffelService } from '../services/duffelService';
import { AppError } from '../middlewares/errorHandler';
import { prisma } from '../config/db';
import logger from '../utils/logger';
import AIService from '../services/aiService';

export const FlightController = {
  // POST /api/v1/flights/search
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { origin, destination, departureDate, returnDate, adults = 1, children = 0, infants = 0, cabinClass = 'economy' } = req.body;
      if (!origin || !destination || !departureDate) {
        throw new AppError('origin, destination, and departureDate are required', 400);
      }
      const result = await duffelService.searchFlights({
        origin: String(origin).toUpperCase(),
        destination: String(destination).toUpperCase(),
        departureDate,
        returnDate: returnDate || undefined,
        adults: Number(adults),
        children: Number(children),
        infants: Number(infants),
        cabinClass,
      });
      res.json({ success: true, data: result });
    } catch (err: any) {
      if (!(err instanceof AppError)) next(new AppError(err.message || 'Search failed', 502));
      else next(err);
    }
  },

  // GET /api/v1/flights/offers?offer_request_id=xxx
  async getOffers(req: Request, res: Response, next: NextFunction) {
    try {
      const { offer_request_id } = req.query;
      if (!offer_request_id) throw new AppError('offer_request_id is required', 400);
      const offers = await duffelService.getOffers(offer_request_id as string);
      res.json({ success: true, data: offers });
    } catch (err: any) {
      if (!(err instanceof AppError)) next(new AppError(err.message || 'Failed to fetch offers', 502));
      else next(err);
    }
  },

  // GET /api/v1/flights/offers/:id
  async getOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const offer = await duffelService.getOffer(req.params.id);
      res.json({ success: true, data: offer });
    } catch (err: any) {
      if (!(err instanceof AppError)) next(new AppError(err.message || 'Offer not found', 404));
      else next(err);
    }
  },

  // GET /api/v1/flights/airports?q=cairo
  async searchAirports(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      if (!q || (q as string).length < 1) return res.json({ success: true, data: [] });
      const airports = await duffelService.searchAirports(q as string);
      res.json({ success: true, data: airports });
    } catch (err) { next(err); }
  },

  // POST /api/v1/flights/book  (requires auth)
  async bookFlight(req: Request, res: Response, next: NextFunction) {
    try {
      const { offerId, passengers, seats, passengersData, paymobPaymentId, paymobSource } = req.body;
      if (!offerId || !passengers?.length) {
        throw new AppError('offerId and passengers are required', 400);
      }

      // ── Calculate meal surcharge from passengersData ──────────────────────
      const mealPrices: Record<string, number> = {
        PHARAOH_BANQUET: 75,
        NILE_HARVEST: 45,
        ALEXANDRIAN_CATCH: 55,
        SCRIBE_PROVISIONS: 25,
      };
      let mealSurcharge = 0;
      if (Array.isArray(passengersData)) {
        for (const pax of passengersData) {
          const meal: string = (pax.meal || 'SCRIBE_PROVISIONS').toUpperCase();
          mealSurcharge += mealPrices[meal] ?? mealPrices['SCRIBE_PROVISIONS'];
        }
      }

      const { order, offer } = await duffelService.createOrder({ offerId, passengers });

      // ── Save to DB (non-blocking — don't fail booking if DB fails) ──
      const userId = (req as any).user?.id;
      if (userId) {
        try {
          const slices = (order as any).slices || [];
          const firstSlice = slices[0];
          const segs = firstSlice?.segments || [];
          const firstSeg = segs[0];
          const lastSeg = segs[segs.length - 1];

          await prisma.duffelOrder.create({
            data: {
              userId,
              duffelOrderId: order.id,
              bookingReference: (order as any).booking_reference || '',
              origin: firstSeg?.origin?.iata_code || '',
              destination: lastSeg?.destination?.iata_code || '',
              departureDate: firstSeg?.departing_at?.substring(0, 10) || '',
              totalAmount: parseFloat((order as any).total_amount || offer.total_amount),
              currency: (order as any).total_currency || offer.total_currency,
              passengerCount: passengers.length,
              cabinClass: 'economy',
              airlineName: (order as any).owner?.name || offer.owner?.name || null,
              status: 'CONFIRMED',
              seats: seats ? String(seats) : null,
              passengersData: passengersData ?? undefined,
              paymobPaymentId: paymobPaymentId ?? null,
              paymobSource: paymobSource ?? null,
              mealSurcharge,
            },
          });
          logger.info(`DuffelOrder saved to DB for user ${userId} with seats: ${seats}, mealSurcharge: $${mealSurcharge}`);
        } catch (dbErr: any) {
          logger.error(`Failed to save DuffelOrder to DB: ${dbErr.message}`);
          // Don't throw — booking is confirmed, DB save is best-effort
        }
      }

      res.status(201).json({ success: true, data: order });
    } catch (err: any) {
      if (!(err instanceof AppError)) {
        next(new AppError(err.message || 'Booking failed. Please try again.', err.statusCode || 422));
      } else {
        next(err);
      }
    }
  },

  // GET /api/v1/flights/my-bookings  (requires auth)
  async getMyBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) throw new AppError('Authentication required', 401);

      const bookings = await prisma.duffelOrder.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: bookings });
    } catch (err: any) {
      if (!(err instanceof AppError)) next(new AppError(err.message || 'Failed to fetch bookings', 500));
      else next(err);
    }
  },

  // GET /api/v1/flights/orders/:id
  async getOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await duffelService.getOrder(req.params.id);
      res.json({ success: true, data: order });
    } catch (err: any) {
      if (!(err instanceof AppError)) next(new AppError(err.message || 'Order not found', 404));
      else next(err);
    }
  },

  // POST /api/v1/flights/my-bookings/:id/itinerary  (requires auth)
  async generateAndSaveItinerary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) throw new AppError('Authentication required', 401);

      const { id } = req.params;
      const { pace = 'Balanced', interests = [], durationDays = 5 } = req.body;

      const order = await prisma.duffelOrder.findFirst({
        where: { id, userId },
      });

      if (!order) throw new AppError('Booking not found', 404);

      // Generate the itinerary using our rich AI service
      const dest = order.destination || 'Cairo';
      const itinerary = await AIService.generateItinerary(dest, Number(durationDays), pace, interests);

      // Save to database
      const updated = await prisma.duffelOrder.update({
        where: { id },
        data: { itinerary: itinerary },
      });

      res.json({ success: true, data: updated.itinerary });
    } catch (err: any) {
      next(err);
    }
  },

  // GET /api/v1/flights/my-bookings/:id/itinerary  (requires auth)
  async getItinerary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) throw new AppError('Authentication required', 401);

      const { id } = req.params;
      const order = await prisma.duffelOrder.findFirst({
        where: { id, userId },
      });

      if (!order) throw new AppError('Booking not found', 404);

      res.json({ success: true, data: order.itinerary });
    } catch (err: any) {
      next(err);
    }
  },
};
