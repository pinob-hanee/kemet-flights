import { Router } from 'express';
import { FlightController } from '../controllers/flightController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Public
router.get('/airports', FlightController.searchAirports);
router.post('/search', FlightController.search);
router.get('/offers', FlightController.getOffers);
router.get('/offers/:id', FlightController.getOffer);

// Protected (JWT required)
router.post('/book', authenticate, FlightController.bookFlight);
router.get('/my-bookings', authenticate, FlightController.getMyBookings);
router.get('/orders/:id', authenticate, FlightController.getOrder);

// AI Travel Scroll Itineraries
router.post('/my-bookings/:id/itinerary', authenticate, FlightController.generateAndSaveItinerary);
router.get('/my-bookings/:id/itinerary', authenticate, FlightController.getItinerary);

export default router;
