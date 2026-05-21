import { Request, Response, NextFunction } from 'express';
import { duffelService } from '../services/duffelService';
import { AppError } from '../middlewares/errorHandler';

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
      const { offerId, passengers } = req.body;
      if (!offerId || !passengers?.length) {
        throw new AppError('offerId and passengers are required', 400);
      }
      const order = await duffelService.createOrder({ offerId, passengers });
      res.status(201).json({ success: true, data: order });
    } catch (err: any) {
      // Surface Duffel error message to frontend instead of swallowing as 500
      if (!(err instanceof AppError)) {
        next(new AppError(err.message || 'Booking failed. Please try again.', err.statusCode || 422));
      } else {
        next(err);
      }
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
};
