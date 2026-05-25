import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { TravelController } from '../controllers/travelController';
import { BookingController } from '../controllers/bookingController';
import { AIController, handleConciergeService } from '../controllers/aiController';
import { authenticate, authorize } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
import { z } from 'zod';

const router = Router();

// ─── Zod Input Validation Schemas ─────────────────────────────────────────────

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const bookingCreateSchema = z.object({
  body: z.object({
    type: z.enum(['FLIGHT', 'HOTEL', 'TOUR', 'CRUISE', 'TRANSPORT', 'VISA', 'INSURANCE']),
    startDate: z.string(),
    endDate: z.string(),
    totalPrice: z.number().positive(),
    notes: z.string().optional(),
    couponCode: z.string().optional(),
    paymentMethod: z.enum(['CARD', 'PAYPAL', 'WALLET']),
    paymentGateway: z.enum(['STRIPE', 'PAYMOB', 'WALLET_INTERNAL']),
    paymentToken: z.string().optional(),
    hotelDetails: z.object({
      roomId: z.string(),
      guestsCount: z.number().int().positive(),
    }).optional(),
    flightDetails: z.object({
      flightId: z.string(),
      seatClass: z.string(),
      seatNumber: z.string(),
      passengers: z.array(z.any()),
    }).optional(),
    tourDetails: z.object({
      tourPackageId: z.string(),
      guestsCount: z.number().int().positive(),
    }).optional(),
    cruiseDetails: z.object({
      cruiseId: z.string(),
      cabinType: z.string(),
      guestsCount: z.number().int().positive(),
    }).optional(),
  }),
});

// ─── Authentication Endpoints ─────────────────────────────────────────────────

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new traveler account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: traveler@kemet.io
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: SecurePass123!
 *               name:
 *                 type: string
 *                 example: Ahmed Al-Rashid
 *               phone:
 *                 type: string
 *                 example: "+20101234567"
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already registered
 */
router.post('/auth/register', validateRequest(registerSchema), AuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate and receive JWT tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: traveler@kemet.io
 *               password:
 *                 type: string
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful — returns accessToken and sets refreshToken cookie
 *       401:
 *         description: Invalid credentials
 */
router.post('/auth/login', validateRequest(loginSchema), AuthController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using the refresh token cookie
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Refresh token missing or expired
 */
router.post('/auth/refresh', AuthController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Invalidate the current session and clear refresh token cookie
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
router.post('/auth/logout', AuthController.logout);

// ─── Travel Listings & Search ─────────────────────────────────────────────────

/**
 * @swagger
 * /travel/hotels:
 *   get:
 *     summary: List and search luxury hotels
 *     tags: [Travel]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter hotels by city
 *       - in: query
 *         name: minStars
 *         schema:
 *           type: integer
 *         description: Minimum star rating (1–5)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Pagination page number
 *     responses:
 *       200:
 *         description: List of hotels returned successfully
 */
router.get('/travel/hotels', TravelController.getHotels);

/**
 * @swagger
 * /travel/flights:
 *   get:
 *     summary: Search available flights
 *     tags: [Travel]
 *     parameters:
 *       - in: query
 *         name: origin
 *         schema:
 *           type: string
 *         description: Origin airport IATA code
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *         description: Destination airport IATA code
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Departure date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of flights returned successfully
 */
router.get('/travel/flights', TravelController.getFlights);

/**
 * @swagger
 * /travel/tours:
 *   get:
 *     summary: Browse curated tour packages
 *     tags: [Travel]
 *     responses:
 *       200:
 *         description: List of tour packages returned successfully
 */
router.get('/travel/tours', TravelController.getTours);

/**
 * @swagger
 * /travel/cruises:
 *   get:
 *     summary: Browse Nile and Mediterranean cruise options
 *     tags: [Travel]
 *     responses:
 *       200:
 *         description: List of cruises returned successfully
 */
router.get('/travel/cruises', TravelController.getCruises);

// ─── Transactional Bookings Engine (Protected) ────────────────────────────────

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking (flight, hotel, tour, or cruise)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, startDate, endDate, totalPrice, paymentMethod, paymentGateway]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [FLIGHT, HOTEL, TOUR, CRUISE, TRANSPORT, VISA, INSURANCE]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               totalPrice:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [CARD, PAYPAL, WALLET]
 *               paymentGateway:
 *                 type: string
 *                 enum: [STRIPE, PAYMOB, WALLET_INTERNAL]
 *               couponCode:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created and confirmed
 *       400:
 *         description: Validation or insufficient wallet balance error
 *       401:
 *         description: Authentication required
 *       402:
 *         description: Payment processing failed
 */
router.post('/bookings', authenticate, validateRequest(bookingCreateSchema), BookingController.create);

/**
 * @swagger
 * /bookings/my:
 *   get:
 *     summary: Retrieve the authenticated user's booking history
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Booking list returned
 *       401:
 *         description: Authentication required
 */
router.get('/bookings/my', authenticate, BookingController.getMyBookings);

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   post:
 *     summary: Cancel an existing booking and trigger refund
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       403:
 *         description: Cannot cancel another user's booking
 *       404:
 *         description: Booking not found
 */
router.post('/bookings/:id/cancel', authenticate, BookingController.cancelBooking);

// ─── Admin-Only Operations ────────────────────────────────────────────────────

/**
 * @swagger
 * /bookings/all:
 *   get:
 *     summary: Retrieve all platform bookings (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Full booking list returned
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get('/bookings/all', authenticate, authorize('ADMIN'), BookingController.getAllBookings);

// ─── Smart AI Assistant ────────────────────────────────────────────────────────

/**
 * @swagger
 * /ai/itinerary:
 *   post:
 *     summary: Generate a personalized AI travel itinerary
 *     tags: [AI Assistant]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               destination:
 *                 type: string
 *                 example: Luxor, Egypt
 *               days:
 *                 type: integer
 *                 example: 7
 *               preferences:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["history", "luxury hotels", "Nile cruise"]
 *     responses:
 *       200:
 *         description: AI-generated itinerary returned
 */
router.post('/ai/itinerary', AIController.generateItinerary);

/**
 * @swagger
 * /ai/chat:
 *   post:
 *     summary: Chat with the Kemet AI travel assistant
 *     tags: [AI Assistant]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: What are the best hotels near the Pyramids of Giza?
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI response returned
 */
router.post('/ai/chat', AIController.chat);

/**
 * @swagger
 * /ai/concierge-service:
 *   post:
 *     summary: Book a VIP concierge experience (helicopter, balloon, butler, temple dining)
 *     tags: [AI Assistant]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [service]
 *             properties:
 *               service:
 *                 type: string
 *                 enum: [helicopter, balloon, butler, templeDining]
 *                 example: balloon
 *     responses:
 *       200:
 *         description: VIP concierge service confirmed by royal decree
 *       400:
 *         description: Unknown service requested
 */
router.post('/ai/concierge-service', handleConciergeService);

export default router;
