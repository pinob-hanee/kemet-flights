import React, { useState, useRef, useEffect } from 'react';
import { Plane, ArrowLeftRight, Search, ChevronDown, Calendar, Users } from 'lucide-react';
import { useStore, Airport } from '../store/useStore';
import api from '../lib/api';

interface HomeProps {
  onNavigate: (page: string) => void;
}

const CABIN_CLASSES = [
  { value: 'economy', label: 'Economy' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First Class' },
];

export const POPULAR_AIRPORTS: Airport[] = [
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
  { iata_code: 'DOH', name: 'Hamad International Airport', city_name: 'Doha', iata_country_code: 'QA' },
  { iata_code: 'RUH', name: 'King Khalid International Airport', city_name: 'Riyadh', iata_country_code: 'SA' },
  { iata_code: 'AMM', name: 'Queen Alia International Airport', city_name: 'Amman', iata_country_code: 'JO' },
  { iata_code: 'AMS', name: 'Amsterdam Schiphol Airport', city_name: 'Amsterdam', iata_country_code: 'NL' },
  { iata_code: 'FRA', name: 'Frankfurt Airport', city_name: 'Frankfurt', iata_country_code: 'DE' },
];

function AirportDropdown({
  value, onChange, placeholder, excludeCode, label, icon,
}: {
  value: Airport | null;
  onChange: (a: Airport) => void;
  placeholder: string;
  excludeCode?: string;
  label: string;
  icon: React.ReactNode;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openDropdown = () => {
    setResults(POPULAR_AIRPORTS.filter((a) => a.iata_code !== excludeCode));
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  useEffect(() => {
    if (!open) return;
    if (!query || query.length < 1) {
      setResults(POPULAR_AIRPORTS.filter((a) => a.iata_code !== excludeCode));
      return;
    }
    const q = query.toLowerCase();
    const filtered = POPULAR_AIRPORTS.filter(
      (a) =>
        a.iata_code !== excludeCode &&
        (a.city_name.toLowerCase().includes(q) ||
          a.iata_code.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q))
    );
    setResults(filtered);

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/flights/airports?q=${query}`);
        const apiAirports: Airport[] = res.data.data || [];
        const merged = [...filtered];
        for (const a of apiAirports) {
          if (!merged.find((x) => x.iata_code === a.iata_code) && a.iata_code !== excludeCode) {
            merged.push(a);
          }
        }
        setResults(merged.slice(0, 12));
      } catch {
        // silently ignore – fallback to local list
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, excludeCode, open]);

  const select = (airport: Airport) => {
    onChange(airport);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative h-full">
      <button type="button" onClick={openDropdown} className="w-full h-full text-left p-4 group">
        <div className="flex items-center gap-1.5 text-xs text-gold/60 uppercase tracking-widest mb-2">
          {icon}
          <span>{label}</span>
        </div>
        {value ? (
          <>
            <div className="text-4xl font-bold text-gold font-mono tracking-wider leading-none">{value.iata_code}</div>
            <div className="text-sm text-sand-light/80 mt-1 truncate">{value.city_name}</div>
            <div className="text-xs text-sand-dark/50 truncate">{value.name}</div>
          </>
        ) : (
          <div className="text-sand-dark/40 text-sm pt-2">{placeholder}</div>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 w-80 glass-panel border border-gold/25 rounded-xl overflow-hidden shadow-2xl animate-fadeIn">
          <div className="p-3 border-b border-gold/10">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city or airport code..."
              className="w-full bg-transparent text-sand-light placeholder-sand-dark/50 text-sm outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {results.length === 0 && (
              <div className="p-4 text-sand-dark/50 text-sm text-center">No airports found</div>
            )}
            {results.map((a) => (
              <button
                key={a.iata_code}
                type="button"
                onClick={() => select(a)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gold/8 transition-colors text-left border-b border-gold/5 last:border-0"
              >
                <span className="text-gold font-bold font-mono text-sm w-10 shrink-0">{a.iata_code}</span>
                <div className="min-w-0">
                  <div className="text-sand-light text-sm">{a.city_name}</div>
                  <div className="text-sand-dark/60 text-xs truncate">{a.name}</div>
                </div>
                <span className="ml-auto text-xs text-sand-dark/40 shrink-0">{a.iata_country_code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PassengerSelector({
  value,
  onChange,
}: {
  value: { adults: number; children: number; infants: number };
  onChange: (v: { adults: number; children: number; infants: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const total = value.adults + value.children + value.infants;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sand-light hover:text-gold transition-colors"
      >
        <Users size={15} className="text-gold" />
        <span className="text-sm">
          {total} Passenger{total !== 1 ? 's' : ''}
        </span>
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-72 glass-panel border border-gold/20 rounded-xl p-5 shadow-2xl animate-fadeIn">
          {[
            { label: 'Adults', sub: 'Age 12+', key: 'adults' as const, min: 1 },
            { label: 'Children', sub: 'Age 2–11', key: 'children' as const, min: 0 },
            { label: 'Infants', sub: 'Under 2', key: 'infants' as const, min: 0 },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3 border-b border-gold/10 last:border-0">
              <div>
                <div className="text-sand-light text-sm">{item.label}</div>
                <div className="text-sand-dark/60 text-xs">{item.sub}</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onChange({ ...value, [item.key]: Math.max(item.min, value[item.key] - 1) })}
                  disabled={value[item.key] <= item.min}
                  className="w-8 h-8 rounded-full border border-gold/30 text-gold disabled:opacity-30 hover:bg-gold/10 transition-colors flex items-center justify-center text-lg leading-none"
                >
                  −
                </button>
                <span className="text-sand-light w-5 text-center font-bold text-sm">{value[item.key]}</span>
                <button
                  type="button"
                  onClick={() => onChange({ ...value, [item.key]: value[item.key] + 1 })}
                  className="w-8 h-8 rounded-full border border-gold/30 text-gold hover:bg-gold/10 transition-colors flex items-center justify-center text-lg leading-none"
                >
                  +
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setOpen(false)} className="mt-4 w-full btn-gold text-sm py-2">
            Done
          </button>
        </div>
      )}
    </div>
  );
}

export default function Home({ onNavigate }: HomeProps) {
  const { flightSearch, setFlightSearch, setIsSearching, setOfferRequestId, setOffers } = useStore();
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const swapAirports = () => {
    setFlightSearch({ origin: flightSearch.destination, destination: flightSearch.origin });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!flightSearch.origin || !flightSearch.destination) {
      setError('Please select origin and destination airports');
      return;
    }
    if (!flightSearch.departureDate) {
      setError('Please select a departure date');
      return;
    }
    if (flightSearch.tripType === 'round-trip' && !flightSearch.returnDate) {
      setError('Please select a return date');
      return;
    }

    setSearching(true);
    setIsSearching(true);
    try {
      const res = await api.post('/flights/search', {
        origin: flightSearch.origin.iata_code,
        destination: flightSearch.destination.iata_code,
        departureDate: flightSearch.departureDate,
        returnDate: flightSearch.tripType === 'round-trip' ? flightSearch.returnDate : undefined,
        adults: flightSearch.passengers.adults,
        children: flightSearch.passengers.children,
        infants: flightSearch.passengers.infants,
        cabinClass: flightSearch.cabinClass,
      });
      const offerRequest = res.data.data;
      setOfferRequestId(offerRequest.id);
      setOffers(offerRequest.offers || []);
      onNavigate('flights');
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
          'Search failed — please verify your Duffel API key is set in the backend .env'
      );
    } finally {
      setSearching(false);
      setIsSearching(false);
    }
  };

  const popularRoutes = [
    { from: 'CAI', to: 'DXB', fromCity: 'Cairo', toCity: 'Dubai', price: '$189' },
    { from: 'CAI', to: 'LHR', fromCity: 'Cairo', toCity: 'London', price: '$429' },
    { from: 'CAI', to: 'IST', fromCity: 'Cairo', toCity: 'Istanbul', price: '$215' },
    { from: 'CAI', to: 'CDG', fromCity: 'Cairo', toCity: 'Paris', price: '$395' },
    { from: 'HRG', to: 'CAI', fromCity: 'Hurghada', toCity: 'Cairo', price: '$68' },
    { from: 'CAI', to: 'DOH', fromCity: 'Cairo', toCity: 'Doha', price: '$245' },
  ];

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <div className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-nile-dark via-nile to-nile-blue" />
          {/* Pyramid silhouette */}
          <svg className="absolute bottom-0 w-full opacity-[0.04]" viewBox="0 0 1440 400" preserveAspectRatio="none">
            <polygon points="720,20 1440,400 0,400" fill="#D4AF37" />
            <polygon points="360,100 720,400 0,400" fill="#D4AF37" />
            <polygon points="1080,100 1440,400 720,400" fill="#D4AF37" />
          </svg>
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 40%, rgba(212,175,55,0.06) 0%, transparent 65%)',
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 pt-12">
          {/* Headline */}
          <div className="text-center mb-10">
            <div className="divider-pharaoh max-w-xs mx-auto mb-5 text-gold/40">
              Find Your Flight
            </div>
            <h1 className="text-5xl md:text-6xl font-serif text-gold-glint mb-3 leading-tight">
              Fly Like a Pharaoh
            </h1>
            <p className="text-sand-dark/70 text-lg max-w-xl mx-auto">
              Search hundreds of airlines. Real prices, real-time. Powered by Duffel.
            </p>
          </div>

          {/* ── Search Card ── */}
          <form
            onSubmit={handleSearch}
            className="bg-nile-blue/60 backdrop-blur-md border border-gold/20 rounded-2xl p-6 md:p-8 shadow-glass"
          >
            {/* Trip type + class + passengers */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="flex bg-nile-dark/80 rounded-lg p-1 gap-1">
                {(['one-way', 'round-trip'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFlightSearch({ tripType: t })}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      flightSearch.tripType === t ? 'bg-gold text-nile' : 'text-sand-dark hover:text-sand-light'
                    }`}
                  >
                    {t === 'one-way' ? 'One Way' : 'Round Trip'}
                  </button>
                ))}
              </div>

              <select
                value={flightSearch.cabinClass}
                onChange={(e) => setFlightSearch({ cabinClass: e.target.value as any })}
                className="bg-nile-dark/80 border border-gold/20 text-sand-light text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-gold"
              >
                {CABIN_CLASSES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              <div className="ml-auto">
                <PassengerSelector
                  value={flightSearch.passengers}
                  onChange={(p) => setFlightSearch({ passengers: p })}
                />
              </div>
            </div>

            {/* Airport + Date inputs */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr,44px,1fr,1fr] gap-2 items-stretch mb-5">
              {/* Origin */}
              <div className="bg-nile-dark/70 border border-gold/20 hover:border-gold/40 rounded-xl transition-colors min-h-[100px]">
                <AirportDropdown
                  value={flightSearch.origin}
                  onChange={(a) => setFlightSearch({ origin: a })}
                  placeholder="Select departure city"
                  excludeCode={flightSearch.destination?.iata_code}
                  label="From"
                  icon={<Plane size={10} className="rotate-45" />}
                />
              </div>

              {/* Swap */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={swapAirports}
                  className="w-9 h-9 rounded-full border border-gold/30 text-gold hover:bg-gold/10 hover:border-gold transition-all flex items-center justify-center group"
                >
                  <ArrowLeftRight size={15} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {/* Destination */}
              <div className="bg-nile-dark/70 border border-gold/20 hover:border-gold/40 rounded-xl transition-colors min-h-[100px]">
                <AirportDropdown
                  value={flightSearch.destination}
                  onChange={(a) => setFlightSearch({ destination: a })}
                  placeholder="Select arrival city"
                  excludeCode={flightSearch.origin?.iata_code}
                  label="To"
                  icon={<Plane size={10} className="-rotate-45" />}
                />
              </div>

              {/* Dates */}
              <div className="bg-nile-dark/70 border border-gold/20 hover:border-gold/40 rounded-xl p-4 transition-colors">
                <div className="flex items-center gap-1.5 text-xs text-gold/60 uppercase tracking-widest mb-3">
                  <Calendar size={10} />
                  <span>Dates</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-sand-dark/50 mb-1">Departure</div>
                    <input
                      type="date"
                      min={today}
                      value={flightSearch.departureDate}
                      onChange={(e) => setFlightSearch({ departureDate: e.target.value })}
                      className="w-full bg-transparent text-sand-light text-sm outline-none [color-scheme:dark]"
                    />
                  </div>
                  {flightSearch.tripType === 'round-trip' && (
                    <div>
                      <div className="text-xs text-sand-dark/50 mb-1">Return</div>
                      <input
                        type="date"
                        min={flightSearch.departureDate || today}
                        value={flightSearch.returnDate}
                        onChange={(e) => setFlightSearch({ returnDate: e.target.value })}
                        className="w-full bg-transparent text-sand-light text-sm outline-none [color-scheme:dark]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={searching}
              className="w-full btn-gold py-4 text-base flex items-center justify-center gap-3 rounded-xl"
            >
              {searching ? (
                <>
                  <div className="w-5 h-5 border-2 border-nile border-t-transparent rounded-full animate-spin" />
                  Searching flights...
                </>
              ) : (
                <>
                  <Search size={20} />
                  Search Flights
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── Popular Routes ── */}
      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="divider-pharaoh mb-6 text-gold/40">Popular Routes</div>
        <h2 className="text-2xl font-serif text-gold-glint mb-10 text-center">Top Routes from Egypt</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {popularRoutes.map((route) => (
            <button
              key={`${route.from}-${route.to}`}
              type="button"
              onClick={() => {
                const origin = POPULAR_AIRPORTS.find((a) => a.iata_code === route.from);
                const destination = POPULAR_AIRPORTS.find((a) => a.iata_code === route.to);
                if (origin && destination) setFlightSearch({ origin, destination });
              }}
              className="glass-card p-5 text-left group rounded-xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-gold font-bold font-mono text-sm">{route.from}</span>
                <div className="flex-1 flex items-center gap-1">
                  <div className="flex-1 h-px border-t border-dashed border-gold/20" />
                  <Plane size={11} className="text-gold/60" />
                  <div className="flex-1 h-px border-t border-dashed border-gold/20" />
                </div>
                <span className="text-gold font-bold font-mono text-sm">{route.to}</span>
              </div>
              <div className="text-sand-light text-sm">
                {route.fromCity} → {route.toCity}
              </div>
              <div className="text-gold/80 text-xs mt-1.5">from {route.price}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Trust signals ── */}
      <div className="border-t border-gold/10 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              { icon: '🛡️', title: 'Secure Booking', desc: 'Bank-level SSL encryption on every transaction' },
              { icon: '💰', title: 'Best Price Guarantee', desc: 'We search hundreds of airlines to get you the lowest fare' },
              { icon: '🕐', title: '24/7 Support', desc: 'Our Kemet team is here whenever you need us' },
            ].map((item) => (
              <div key={item.title} className="glass-card p-6 rounded-xl">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-gold font-serif mb-2">{item.title}</h3>
                <p className="text-sand-dark/70 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
