import React, { useState } from 'react';
import { Plane, Shield, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import api from '../lib/api';

interface CheckoutProps {
  onNavigate: (page: string) => void;
  onOpenAuth: () => void;
}

interface PassengerForm {
  title: 'mr' | 'ms' | 'mrs';
  given_name: string;
  family_name: string;
  born_on: string;
  phone_number: string;
  email: string;
  gender: 'm' | 'f';
}

export default function Checkout({ onNavigate, onOpenAuth }: CheckoutProps) {
  const { selectedOffer, user, flightSearch } = useStore();
  const totalPax =
    flightSearch.passengers.adults +
    flightSearch.passengers.children +
    flightSearch.passengers.infants;

  const [passengers, setPassengers] = useState<PassengerForm[]>(
    Array.from({ length: Math.max(1, totalPax) }, () => ({
      title: 'mr',
      given_name: '',
      family_name: '',
      born_on: '',
      phone_number: '',
      email: '',
      gender: 'm',
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [orderId, setOrderId] = useState('');

  if (!selectedOffer) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-panel p-12 text-center max-w-md rounded-2xl border border-gold/20">
          <div className="text-4xl mb-4">✈️</div>
          <h2 className="text-gold font-serif text-xl mb-3">No Flight Selected</h2>
          <p className="text-sand-dark/70 mb-6 text-sm">Please search and select a flight first.</p>
          <button onClick={() => onNavigate('home')} className="btn-gold">
            Search Flights
          </button>
        </div>
      </div>
    );
  }

  const slice = selectedOffer.slices?.[0];
  const firstSeg = slice?.segments?.[0];
  const lastSeg = slice?.segments?.[slice.segments.length - 1];

  const formatTime = (iso: string) =>
    iso ? new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

  const update = (idx: number, field: keyof PassengerForm, value: string) => {
    setPassengers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { onOpenAuth(); return; }
    setLoading(true);
    setError('');
    try {
      const offerPassengerIds = selectedOffer.passengers?.map((p: any) => p.id) || [];
      const bookingPassengers = passengers.map((p, i) => ({
        id: offerPassengerIds[i] || `pas_${i}`,
        ...p,
      }));
      const res = await api.post('/flights/book', {
        offerId: selectedOffer.id,
        passengers: bookingPassengers,
      });
      setOrderId(res.data.data?.id || `KMT-${Date.now()}`);
      setConfirmed(true);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-panel p-10 text-center max-w-lg w-full rounded-2xl border border-gold/20 animate-fadeIn">
          <div className="w-20 h-20 rounded-full bg-gold/10 border-2 border-gold flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-gold" />
          </div>
          <div className="divider-pharaoh max-w-xs mx-auto mb-4 text-gold/40">Booking Confirmed</div>
          <h2 className="text-3xl font-serif text-gold-glint mb-2">Your Flight is Booked!</h2>
          <p className="text-sand-dark/70 mb-6 text-sm">
            A confirmation email will be sent to you shortly.
          </p>
          <div className="glass-panel p-4 rounded-xl mb-6 text-left border border-gold/15">
            <div className="text-xs text-gold/60 uppercase tracking-widest mb-1">Booking Reference</div>
            <div className="text-2xl font-mono font-bold text-gold">{orderId}</div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => onNavigate('dashboard')} className="btn-outline-gold flex-1">
              My Bookings
            </button>
            <button onClick={() => onNavigate('home')} className="btn-gold flex-1">
              Search Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="divider-pharaoh mb-5 text-gold/40">Checkout</div>
        <h1 className="text-3xl font-serif text-gold-glint mb-8">Complete Your Booking</h1>

        {/* Flight summary */}
        <div className="glass-panel p-5 rounded-xl border border-gold/15 mb-8">
          <div className="text-xs text-gold/60 uppercase tracking-widest mb-4">Selected Flight</div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-center">
              <div className="text-3xl font-bold text-gold font-mono">{firstSeg?.origin?.iata_code}</div>
              <div className="text-xs text-sand-dark/60 mt-0.5">{firstSeg?.origin?.city_name}</div>
              <div className="text-xs text-sand-dark/50">{formatTime(firstSeg?.departing_at)}</div>
            </div>
            <div className="flex-1 flex items-center min-w-0">
              <div className="flex-1 h-px border-t border-dashed border-gold/20" />
              <Plane size={16} className="text-gold mx-3 shrink-0" />
              <div className="flex-1 h-px border-t border-dashed border-gold/20" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gold font-mono">{lastSeg?.destination?.iata_code}</div>
              <div className="text-xs text-sand-dark/60 mt-0.5">{lastSeg?.destination?.city_name}</div>
              <div className="text-xs text-sand-dark/50">{formatTime(lastSeg?.arriving_at)}</div>
            </div>
            <div className="ml-auto text-right shrink-0">
              <div className="text-2xl font-bold text-gold">
                {selectedOffer.total_currency} {parseFloat(selectedOffer.total_amount).toLocaleString()}
              </div>
              <div className="text-xs text-sand-dark/50">total price</div>
            </div>
          </div>
        </div>

        {/* Passenger forms */}
        <form onSubmit={handleBook}>
          {passengers.map((pax, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-xl border border-gold/15 mb-5">
              <h3 className="text-gold font-serif mb-5">
                Passenger {idx + 1}
                {idx === 0 && <span className="text-xs text-gold/50 ml-2 font-sans">Lead passenger</span>}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">Title</label>
                  <select
                    value={pax.title}
                    onChange={(e) => update(idx, 'title', e.target.value)}
                    className="input-luxury"
                  >
                    <option value="mr">Mr</option>
                    <option value="ms">Ms</option>
                    <option value="mrs">Mrs</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">First Name</label>
                  <input
                    required
                    value={pax.given_name}
                    onChange={(e) => update(idx, 'given_name', e.target.value)}
                    className="input-luxury"
                    placeholder="Ahmed"
                  />
                </div>
                <div>
                  <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">Last Name</label>
                  <input
                    required
                    value={pax.family_name}
                    onChange={(e) => update(idx, 'family_name', e.target.value)}
                    className="input-luxury"
                    placeholder="Hassan"
                  />
                </div>
                <div>
                  <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">Date of Birth</label>
                  <input
                    required
                    type="date"
                    value={pax.born_on}
                    onChange={(e) => update(idx, 'born_on', e.target.value)}
                    className="input-luxury [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">Gender</label>
                  <select
                    value={pax.gender}
                    onChange={(e) => update(idx, 'gender', e.target.value)}
                    className="input-luxury"
                  >
                    <option value="m">Male</option>
                    <option value="f">Female</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">Phone Number</label>
                  <input
                    required
                    value={pax.phone_number}
                    onChange={(e) => update(idx, 'phone_number', e.target.value)}
                    className="input-luxury"
                    placeholder="+20 10 1234 5678"
                  />
                </div>
                <div className="col-span-2 md:col-span-3">
                  <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">Email Address</label>
                  <input
                    required
                    type="email"
                    value={pax.email}
                    onChange={(e) => update(idx, 'email', e.target.value)}
                    className="input-luxury"
                    placeholder="traveler@example.com"
                  />
                </div>
              </div>
            </div>
          ))}

          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-400 text-sm flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" /> {error}
            </div>
          )}

          <div className="flex items-center gap-2 text-sand-dark/50 text-xs mb-6">
            <Shield size={13} className="text-gold shrink-0" />
            Your personal data is encrypted and secured
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gold py-4 text-base flex items-center justify-center gap-3 rounded-xl"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-nile border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ChevronRight size={20} />
                {user ? 'Confirm Booking' : 'Sign In to Book'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
