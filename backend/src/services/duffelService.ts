import { Duffel } from '@duffel/api';
import logger from '../utils/logger';

const duffel = new Duffel({
  token: process.env.DUFFEL_API_KEY || '',
});

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
}

// 60+ global airports — Middle East, Africa, Europe, Asia, Americas
const AIRPORTS = [
  // ── Egypt ──
  { iata_code: 'CAI', name: 'Cairo International Airport', city_name: 'Cairo', iata_country_code: 'EG' },
  { iata_code: 'HRG', name: 'Hurghada International Airport', city_name: 'Hurghada', iata_country_code: 'EG' },
  { iata_code: 'SSH', name: 'Sharm El Sheikh International', city_name: 'Sharm El Sheikh', iata_country_code: 'EG' },
  { iata_code: 'LXR', name: 'Luxor International Airport', city_name: 'Luxor', iata_country_code: 'EG' },
  { iata_code: 'ASW', name: 'Aswan International Airport', city_name: 'Aswan', iata_country_code: 'EG' },
  { iata_code: 'HBE', name: 'Borg El Arab Airport', city_name: 'Alexandria', iata_country_code: 'EG' },
  // ── Gulf & Middle East ──
  { iata_code: 'DXB', name: 'Dubai International Airport', city_name: 'Dubai', iata_country_code: 'AE' },
  { iata_code: 'AUH', name: 'Abu Dhabi International Airport', city_name: 'Abu Dhabi', iata_country_code: 'AE' },
  { iata_code: 'DOH', name: 'Hamad International Airport', city_name: 'Doha', iata_country_code: 'QA' },
  { iata_code: 'RUH', name: 'King Khalid International Airport', city_name: 'Riyadh', iata_country_code: 'SA' },
  { iata_code: 'JED', name: 'King Abdulaziz International Airport', city_name: 'Jeddah', iata_country_code: 'SA' },
  { iata_code: 'MED', name: 'Prince Mohammad Bin Abdulaziz Airport', city_name: 'Madinah', iata_country_code: 'SA' },
  { iata_code: 'KWI', name: 'Kuwait International Airport', city_name: 'Kuwait City', iata_country_code: 'KW' },
  { iata_code: 'BAH', name: 'Bahrain International Airport', city_name: 'Manama', iata_country_code: 'BH' },
  { iata_code: 'MCT', name: 'Muscat International Airport', city_name: 'Muscat', iata_country_code: 'OM' },
  { iata_code: 'AMM', name: 'Queen Alia International Airport', city_name: 'Amman', iata_country_code: 'JO' },
  { iata_code: 'BEY', name: 'Rafic Hariri International Airport', city_name: 'Beirut', iata_country_code: 'LB' },
  { iata_code: 'DAM', name: 'Damascus International Airport', city_name: 'Damascus', iata_country_code: 'SY' },
  { iata_code: 'BGW', name: 'Baghdad International Airport', city_name: 'Baghdad', iata_country_code: 'IQ' },
  { iata_code: 'TLV', name: 'Ben Gurion International Airport', city_name: 'Tel Aviv', iata_country_code: 'IL' },
  // ── Africa ──
  { iata_code: 'ADD', name: 'Addis Ababa Bole International', city_name: 'Addis Ababa', iata_country_code: 'ET' },
  { iata_code: 'NBO', name: 'Jomo Kenyatta International Airport', city_name: 'Nairobi', iata_country_code: 'KE' },
  { iata_code: 'JNB', name: 'O.R. Tambo International Airport', city_name: 'Johannesburg', iata_country_code: 'ZA' },
  { iata_code: 'CPT', name: 'Cape Town International Airport', city_name: 'Cape Town', iata_country_code: 'ZA' },
  { iata_code: 'LOS', name: 'Murtala Muhammed International Airport', city_name: 'Lagos', iata_country_code: 'NG' },
  { iata_code: 'CMN', name: 'Mohammed V International Airport', city_name: 'Casablanca', iata_country_code: 'MA' },
  { iata_code: 'TUN', name: 'Tunis-Carthage International Airport', city_name: 'Tunis', iata_country_code: 'TN' },
  { iata_code: 'ALG', name: 'Houari Boumediene Airport', city_name: 'Algiers', iata_country_code: 'DZ' },
  // ── Europe ──
  { iata_code: 'LHR', name: 'London Heathrow Airport', city_name: 'London', iata_country_code: 'GB' },
  { iata_code: 'LGW', name: 'London Gatwick Airport', city_name: 'London', iata_country_code: 'GB' },
  { iata_code: 'CDG', name: 'Charles de Gaulle Airport', city_name: 'Paris', iata_country_code: 'FR' },
  { iata_code: 'FRA', name: 'Frankfurt Airport', city_name: 'Frankfurt', iata_country_code: 'DE' },
  { iata_code: 'MUC', name: 'Munich Airport', city_name: 'Munich', iata_country_code: 'DE' },
  { iata_code: 'AMS', name: 'Amsterdam Schiphol Airport', city_name: 'Amsterdam', iata_country_code: 'NL' },
  { iata_code: 'MAD', name: 'Adolfo Suárez Madrid–Barajas Airport', city_name: 'Madrid', iata_country_code: 'ES' },
  { iata_code: 'BCN', name: 'Barcelona El Prat Airport', city_name: 'Barcelona', iata_country_code: 'ES' },
  { iata_code: 'FCO', name: 'Leonardo da Vinci International Airport', city_name: 'Rome', iata_country_code: 'IT' },
  { iata_code: 'MXP', name: 'Milan Malpensa Airport', city_name: 'Milan', iata_country_code: 'IT' },
  { iata_code: 'ZRH', name: 'Zurich Airport', city_name: 'Zurich', iata_country_code: 'CH' },
  { iata_code: 'VIE', name: 'Vienna International Airport', city_name: 'Vienna', iata_country_code: 'AT' },
  { iata_code: 'BRU', name: 'Brussels Airport', city_name: 'Brussels', iata_country_code: 'BE' },
  { iata_code: 'CPH', name: 'Copenhagen Airport', city_name: 'Copenhagen', iata_country_code: 'DK' },
  { iata_code: 'ATH', name: 'Athens International Airport', city_name: 'Athens', iata_country_code: 'GR' },
  { iata_code: 'IST', name: 'Istanbul Airport', city_name: 'Istanbul', iata_country_code: 'TR' },
  { iata_code: 'SAW', name: 'Istanbul Sabiha Gökçen Airport', city_name: 'Istanbul', iata_country_code: 'TR' },
  { iata_code: 'SVO', name: 'Sheremetyevo International Airport', city_name: 'Moscow', iata_country_code: 'RU' },
  // ── Asia & Pacific ──
  { iata_code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city_name: 'Mumbai', iata_country_code: 'IN' },
  { iata_code: 'DEL', name: 'Indira Gandhi International Airport', city_name: 'New Delhi', iata_country_code: 'IN' },
  { iata_code: 'SIN', name: 'Singapore Changi Airport', city_name: 'Singapore', iata_country_code: 'SG' },
  { iata_code: 'KUL', name: 'Kuala Lumpur International Airport', city_name: 'Kuala Lumpur', iata_country_code: 'MY' },
  { iata_code: 'BKK', name: 'Suvarnabhumi Airport', city_name: 'Bangkok', iata_country_code: 'TH' },
  { iata_code: 'HKG', name: 'Hong Kong International Airport', city_name: 'Hong Kong', iata_country_code: 'HK' },
  { iata_code: 'PEK', name: 'Beijing Capital International Airport', city_name: 'Beijing', iata_country_code: 'CN' },
  { iata_code: 'PVG', name: 'Shanghai Pudong International Airport', city_name: 'Shanghai', iata_country_code: 'CN' },
  { iata_code: 'NRT', name: 'Narita International Airport', city_name: 'Tokyo', iata_country_code: 'JP' },
  { iata_code: 'ICN', name: 'Incheon International Airport', city_name: 'Seoul', iata_country_code: 'KR' },
  { iata_code: 'SYD', name: 'Sydney Kingsford Smith Airport', city_name: 'Sydney', iata_country_code: 'AU' },
  // ── Americas ──
  { iata_code: 'JFK', name: 'John F. Kennedy International Airport', city_name: 'New York', iata_country_code: 'US' },
  { iata_code: 'LAX', name: 'Los Angeles International Airport', city_name: 'Los Angeles', iata_country_code: 'US' },
  { iata_code: 'ORD', name: "O'Hare International Airport", city_name: 'Chicago', iata_country_code: 'US' },
  { iata_code: 'MIA', name: 'Miami International Airport', city_name: 'Miami', iata_country_code: 'US' },
  { iata_code: 'IAD', name: 'Washington Dulles International Airport', city_name: 'Washington D.C.', iata_country_code: 'US' },
  { iata_code: 'YYZ', name: 'Toronto Pearson International Airport', city_name: 'Toronto', iata_country_code: 'CA' },
  { iata_code: 'GRU', name: 'São Paulo Guarulhos International Airport', city_name: 'São Paulo', iata_country_code: 'BR' },
  { iata_code: 'EZE', name: 'Ministro Pistarini International Airport', city_name: 'Buenos Aires', iata_country_code: 'AR' },
];

export const duffelService = {
  async searchFlights(params: SearchParams) {
    try {
      const slices: Array<{ origin: string; destination: string; departure_date: string }> = [
        { origin: params.origin, destination: params.destination, departure_date: params.departureDate },
      ];
      if (params.returnDate) {
        slices.push({ origin: params.destination, destination: params.origin, departure_date: params.returnDate });
      }

      const passengers: Array<{ type: 'adult' | 'child' | 'infant_without_seat' }> = [];
      for (let i = 0; i < (params.adults || 1); i++) passengers.push({ type: 'adult' });
      for (let i = 0; i < (params.children || 0); i++) passengers.push({ type: 'child' });
      for (let i = 0; i < (params.infants || 0); i++) passengers.push({ type: 'infant_without_seat' });

      const offerRequest = await duffel.offerRequests.create({
        slices: slices as any,
        passengers: passengers as any,
        cabin_class: params.cabinClass,
        return_offers: true,
      });

      logger.info(`Duffel offer request created: ${offerRequest.data.id}`);
      return offerRequest.data;
    } catch (error: any) {
      const details = error?.errors ? JSON.stringify(error.errors) : (error?.message || String(error));
      logger.error(`Duffel searchFlights error: ${details}`);
      throw error;
    }
  },

  async getOffer(offerId: string) {
    try {
      const offer = await duffel.offers.get(offerId);
      return offer.data;
    } catch (error: any) {
      const details = error?.errors ? JSON.stringify(error.errors) : (error?.message || String(error));
      logger.error(`Duffel getOffer error: ${details}`);
      throw error;
    }
  },

  async getOffers(offerRequestId: string) {
    try {
      const offers = await duffel.offers.list({ offer_request_id: offerRequestId, sort: 'total_amount' });
      return offers.data;
    } catch (error: any) {
      const details = error?.errors ? JSON.stringify(error.errors) : (error?.message || String(error));
      logger.error(`Duffel getOffers error: ${details}`);
      throw error;
    }
  },

  async createOrder(params: {
    offerId: string;
    passengers: Array<{
      id: string;
      title: 'mr' | 'ms' | 'mrs' | 'miss' | 'dr';
      gender: 'm' | 'f';
      given_name: string;
      family_name: string;
      born_on: string;
      phone_number: string;
      email: string;
    }>;
  }) {
    try {
      // Fetch live offer to get real total_amount + total_currency for payment
      const offerRes = await duffel.offers.get(params.offerId);
      const offer = offerRes.data;

      const order = await duffel.orders.create({
        selected_offers: [params.offerId],
        passengers: params.passengers as any,
        payments: [
          {
            type: 'balance',
            currency: offer.total_currency,
            amount: offer.total_amount,
          },
        ],
        type: 'instant',
      });

      logger.info(`Duffel order created: ${order.data.id} ref:(${(order.data as any).booking_reference})`);
      return { order: order.data, offer };
    } catch (error: any) {
      const details = error?.errors ? JSON.stringify(error.errors) : (error?.message || String(error));
      logger.error(`Duffel createOrder error: ${details}`);
      const userMsg = error?.errors?.[0]?.message || 'Booking failed. Please try again.';
      const err: any = new Error(userMsg);
      err.duffelErrors = error?.errors;
      err.statusCode = 422;
      throw err;
    }
  },

  async getOrder(orderId: string) {
    try {
      const order = await duffel.orders.get(orderId);
      return order.data;
    } catch (error: any) {
      const details = error?.errors ? JSON.stringify(error.errors) : (error?.message || String(error));
      logger.error(`Duffel getOrder error: ${details}`);
      throw error;
    }
  },

  async searchAirports(query: string) {
    const q = query.toLowerCase();
    return AIRPORTS.filter(
      (a) =>
        a.city_name.toLowerCase().includes(q) ||
        a.iata_code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.iata_country_code.toLowerCase().includes(q)
    ).slice(0, 10);
  },
};

export default duffelService;
