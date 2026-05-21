import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Airport {
  iata_code: string;
  name: string;
  city_name: string;
  iata_country_code: string;
}

export interface PassengerCounts {
  adults: number;
  children: number;
  infants: number;
}

export interface FlightSearch {
  tripType: 'one-way' | 'round-trip';
  origin: Airport | null;
  destination: Airport | null;
  departureDate: string;
  returnDate: string;
  passengers: PassengerCounts;
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  walletBalance?: number;
  loyaltyPoints?: number;
}

interface KemetStore {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;

  flightSearch: FlightSearch;
  setFlightSearch: (search: Partial<FlightSearch>) => void;
  resetFlightSearch: () => void;

  offerRequestId: string | null;
  offers: any[];
  selectedOffer: any | null;
  setOfferRequestId: (id: string | null) => void;
  setOffers: (offers: any[]) => void;
  setSelectedOffer: (offer: any | null) => void;

  isSearching: boolean;
  setIsSearching: (v: boolean) => void;
}

const defaultSearch: FlightSearch = {
  tripType: 'round-trip',
  origin: null,
  destination: null,
  departureDate: '',
  returnDate: '',
  passengers: { adults: 1, children: 0, infants: 0 },
  cabinClass: 'economy',
};

export const useStore = create<KemetStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null }),

      flightSearch: defaultSearch,
      setFlightSearch: (search) =>
        set((state) => ({ flightSearch: { ...state.flightSearch, ...search } })),
      resetFlightSearch: () => set({ flightSearch: defaultSearch }),

      offerRequestId: null,
      offers: [],
      selectedOffer: null,
      setOfferRequestId: (id) => set({ offerRequestId: id }),
      setOffers: (offers) => set({ offers }),
      setSelectedOffer: (offer) => set({ selectedOffer: offer }),

      isSearching: false,
      setIsSearching: (v) => set({ isSearching: v }),
    }),
    {
      name: 'kemet-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        flightSearch: state.flightSearch,
      }),
    }
  )
);
