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
      // ── Must fetch the live offer to get real total_amount + total_currency ──
      // Duffel rejects orders when you pass amount='0' or wrong currency
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
      return order.data;
    } catch (error: any) {
      const details = error?.errors ? JSON.stringify(error.errors) : (error?.message || String(error));
      logger.error(`Duffel createOrder error: ${details}`);
      // Surface a user-friendly message
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
    const POPULAR = [
      { iata_code: 'CAI', name: 'Cairo International Airport', city_name: 'Cairo', iata_country_code: 'EG' },
      { iata_code: 'HRG', name: 'Hurghada International Airport', city_name: 'Hurghada', iata_country_code: 'EG' },
      { iata_code: 'SSH', name: 'Sharm El Sheikh International', city_name: 'Sharm El Sheikh', iata_country_code: 'EG' },
      { iata_code: 'LXR', name: 'Luxor International Airport', city_name: 'Luxor', iata_country_code: 'EG' },
      { iata_code: 'ASW', name: 'Aswan International Airport', city_name: 'Aswan', iata_country_code: 'EG' },
      { iata_code: 'DXB', name: 'Dubai International Airport', city_name: 'Dubai', iata_country_code: 'AE' },
      { iata_code: 'LHR', name: 'London Heathrow Airport', city_name: 'London', iata_country_code: 'GB' },
      { iata_code: 'CDG', name: 'Charles de Gaulle Airport', city_name: 'Paris', iata_country_code: 'FR' },
      { iata_code: 'JFK', name: 'John F. Kennedy International', city_name: 'New York', iata_country_code: 'US' },
      { iata_code: 'IST', name: 'Istanbul Airport', city_name: 'Istanbul', iata_country_code: 'TR' },
      { iata_code: 'AMS', name: 'Amsterdam Schiphol Airport', city_name: 'Amsterdam', iata_country_code: 'NL' },
      { iata_code: 'FRA', name: 'Frankfurt Airport', city_name: 'Frankfurt', iata_country_code: 'DE' },
      { iata_code: 'DOH', name: 'Hamad International Airport', city_name: 'Doha', iata_country_code: 'QA' },
      { iata_code: 'RUH', name: 'King Khalid International Airport', city_name: 'Riyadh', iata_country_code: 'SA' },
      { iata_code: 'JED', name: 'King Abdulaziz International Airport', city_name: 'Jeddah', iata_country_code: 'SA' },
      { iata_code: 'BEY', name: 'Rafic Hariri International Airport', city_name: 'Beirut', iata_country_code: 'LB' },
      { iata_code: 'AMM', name: 'Queen Alia International Airport', city_name: 'Amman', iata_country_code: 'JO' },
      { iata_code: 'KWI', name: 'Kuwait International Airport', city_name: 'Kuwait City', iata_country_code: 'KW' },
    ];
    const q = query.toLowerCase();
    return POPULAR.filter(a =>
      a.city_name.toLowerCase().includes(q) ||
      a.iata_code.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q)
    ).slice(0, 10);
  },
};

export default duffelService;
