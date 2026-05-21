import { Router } from 'express';
import { FlightController } from '../controllers/flightController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Public
router.get('/airports', FlightController.searchAirports);
router.post('/search', FlightController.search);
router.get('/offers', FlightController.getOffers);
router.get('/offers/:id', FlightController.getOffer);

// Protected
router.post('/book', authenticate, FlightController.bookFlight);
router.get('/orders/:id', authenticate, FlightController.getOrder);

export default router;
