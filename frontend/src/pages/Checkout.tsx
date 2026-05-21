import React, { useState, useEffect, useRef } from 'react';
import { Plane, Shield, CheckCircle, AlertCircle, ChevronRight, Clock, Phone, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import api from '../lib/api';

interface CheckoutProps {
  onNavigate: (page: string) => void;
  onOpenAuth: () => void;
}

interface PassengerForm {
  title: 'mr' | 'ms' | 'mrs' | 'miss' | 'dr';
  given_name: string;
  family_name: string;
  born_on: string;
  phone_number: string;
  email: string;
  gender: 'm' | 'f';
}

// Validate E.164 phone format (Duffel requirement)
const validatePhone = (phone: string) => /^\+[1-9]\d{6,14}$/.test(phone.replace(/\s/g, ''));

// Format phone to E.164 as user types
const formatPhoneE164 = (raw: string) => {
  // Strip everything except + and digits
  let clean = raw.replace(/[^\d+]/g, '');
  if (clean && !clean.startsWith('+')) clean = '+' + clean;
  return clean;
};

// Offer expires after 20 min from search — show countdown
const OFFER_LIFETIME_SECONDS = 20 * 60;

export default function Checkout({ onNavigate, onOpenAuth }: CheckoutProps) {
  const { selectedOffer, user, flightSearch, setSelectedOffer } = useStore();
  const searchedAt = useRef<number>(Date.now());

  // Expiry countdown
  const [secondsLeft, setSecondsLeft] = useState(OFFER_LIFETIME_SECONDS);
  const [offerExpired, setOfferExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - searchedAt.current) / 1000);
      const remaining = Math.max(0, OFFER_LIFETIME_SECONDS - elapsed);
      setSecondsLeft(remaining);
      if (remaining === 0) {
        setOfferExpired(true);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
  const [phoneErrors, setPhoneErrors] = useState<string[]>(Array(Math.max(1, totalPax)).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [orderId, setOrderId] = useState('');

  if (!selectedOffer) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-panel p-12 text-center max-w-md rounded-2xl border border-gold/20">
          <div className="text-4xl mb-4">✈️</div>
          <h2 className="text-gold font-serif text-xl mb-3">No Flight Selected</h2>
          <p className="text-sand-dark/70 mb-6 text-sm">Please search and select a flight first.</p>
          <button onClick={() => onNavigate('home')} className="btn-gold">Search Flights</button>
        </div>
      </div>
    );
  }

  // Offer expired screen
  if (offerExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-panel p-12 text-center max-w-md rounded-2xl border border-rose-800/40 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-rose-900/30 border border-rose-800/50 flex items-center justify-center mx-auto mb-5">
            <Clock size={32} className="text-rose-400" />
          </div>
          <h2 className="text-xl font-serif text-rose-400 mb-2">Offer Expired</h2>
          <p className="text-sand-dark/60 text-sm mb-6">
            This offer has expired after 20 minutes. Airlines require a fresh search for current pricing and availability.
          </p>
          <button
            onClick={() => { setSelectedOffer(null); onNavigate('home'); }}
            className="btn-gold flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={16} />
            Search Again
          </button>
        </div>
      </div>
    );
  }

  const slice = selectedOffer.slices?.[0];
  const firstSeg = slice?.segments?.[0];
  const lastSeg = slice?.segments?.[slice.segments.length - 1];
  const stops = (slice?.segments?.length || 1) - 1;

  const formatTime = (iso: string) =>
    iso ? new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
  const formatDate = (iso: string) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  const mins = secondsLeft;
  const mm = String(Math.floor(mins / 60)).padStart(2, '0');
  const ss = String(mins % 60).padStart(2, '0');
  const timerUrgent = secondsLeft < 300; // < 5 min = red

  const update = (idx: number, field: keyof PassengerForm, value: string) => {
    setPassengers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
    if (field === 'phone_number') {
      setPhoneErrors((prev) => {
        const next = [...prev];
        next[idx] = '';
        return next;
      });
    }
  };

  const handlePhoneChange = (idx: number, raw: string) => {
    const formatted = formatPhoneE164(raw);
    update(idx, 'phone_number', formatted);
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { onOpenAuth(); return; }

    // Validate all phone numbers
    const newPhoneErrors = passengers.map((p) =>
      validatePhone(p.phone_number) ? '' : 'Use international format: +201001234567'
    );
    setPhoneErrors(newPhoneErrors);
    if (newPhoneErrors.some((e) => e)) return;

    setLoading(true);
    setError('');
    try {
      const offerPassengerIds = selectedOffer.passengers?.map((p: any) => p.id) || [];
      const bookingPassengers = passengers.map((p, i) => ({
        id: offerPassengerIds[i] || `pas_${i}`,
        ...p,
        phone_number: p.phone_number.replace(/\s/g, ''), // strip spaces
      }));

      const res = await api.post('/flights/book', {
        offerId: selectedOffer.id,
        passengers: bookingPassengers,
      });

      const data = res.data.data;
      setOrderId(data?.id || '');
      setBookingRef(data?.booking_reference || data?.id?.slice(-6).toUpperCase() || 'KEMET');
      setConfirmed(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Booking failed. Please try again.';
      // Handle specific Duffel errors with user-friendly messages
      if (msg.includes('offer request that has already been booked')) {
        setError('This flight offer has already been booked. Please search for a new flight.');
      } else if (msg.includes('no longer available') || msg.includes('offer_no_longer_available')) {
        setError('This flight is no longer available. Please go back and select another flight.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Booking Confirmed Screen ──
  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {/* Success card */}
          <div className="glass-panel p-10 text-center rounded-2xl border border-gold/30 shadow-gold animate-fadeIn mb-4">
            {/* Animated checkmark */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="w-24 h-24 rounded-full bg-gold/10 border-2 border-gold flex items-center justify-center animate-glow">
                <CheckCircle size={48} className="text-gold" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-gold/30 animate-ping opacity-30" />
            </div>

            <div className="divider-pharaoh max-w-xs mx-auto mb-4 text-gold/40">Flight Confirmed</div>
            <h2 className="text-3xl font-serif text-gold-glint mb-1">You're All Set!</h2>
            <p className="text-sand-dark/60 text-sm mb-8">
              Your booking is confirmed. A receipt will be sent to {passengers[0]?.email}.
            </p>

            {/* Booking reference */}
            <div className="bg-nile border border-gold/25 rounded-xl p-5 mb-6 text-left">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-xs text-gold/50 uppercase tracking-widest mb-1">Booking Reference</div>
                  <div className="text-3xl font-mono font-bold text-gold tracking-[0.15em]">{bookingRef}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gold/50 uppercase tracking-widest mb-1">Order ID</div>
                  <div className="text-xs font-mono text-sand-dark/60 break-all max-w-[180px]">{orderId}</div>
                </div>
              </div>
            </div>

            {/* Flight summary */}
            <div className="bg-nile/50 border border-gold/10 rounded-xl p-4 mb-7 flex items-center gap-4 flex-wrap">
              <div className="text-center">
                <div className="text-2xl font-bold text-gold font-mono">{firstSeg?.origin?.iata_code}</div>
                <div className="text-xs text-sand-dark/50">{firstSeg?.origin?.city_name}</div>
                <div className="text-xs text-sand-dark/40">{formatTime(firstSeg?.departing_at)}</div>
              </div>
              <div className="flex-1 flex flex-col items-center min-w-0">
                <Plane size={16} className="text-gold" />
                <div className="text-[10px] text-sand-dark/40 mt-1">{selectedOffer.owner?.name}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gold font-mono">{lastSeg?.destination?.iata_code}</div>
                <div className="text-xs text-sand-dark/50">{lastSeg?.destination?.city_name}</div>
                <div className="text-xs text-sand-dark/40">{formatDate(lastSeg?.arriving_at)}</div>
              </div>
              <div className="ml-auto text-right shrink-0">
                <div className="text-xl font-bold text-gold">
                  {selectedOffer.total_currency} {parseFloat(selectedOffer.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-emerald-400 font-semibold">Paid ✓</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { setSelectedOffer(null); onNavigate('dashboard'); }}
                className="btn-outline-gold flex-1"
              >
                My Bookings
              </button>
              <button
                onClick={() => { setSelectedOffer(null); onNavigate('home'); }}
                className="btn-gold flex-1"
              >
                Search New Flight
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Checkout Form ──
  return (
    <div className="min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4">

        {/* Header */}
        <div className="divider-pharaoh mb-5 text-gold/40">Checkout</div>
        <h1 className="text-3xl font-serif text-gold-glint mb-2">Complete Your Booking</h1>

        {/* Offer expiry countdown */}
        <div className={`flex items-center gap-2 mb-8 text-sm font-medium px-4 py-2.5 rounded-lg border w-fit ${
          timerUrgent
            ? 'text-rose-400 bg-rose-950/40 border-rose-800/50'
            : 'text-amber-400 bg-amber-950/30 border-amber-800/40'
        }`}>
          <Clock size={14} />
          Offer expires in <span className="font-mono font-bold">{mm}:{ss}</span>
        </div>

        {/* Flight summary card */}
        <div className="glass-panel p-5 rounded-xl border border-gold/15 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-gold/60 uppercase tracking-widest">Selected Flight</div>
            <div className="text-xs text-sand-dark/50">
              {stops === 0 ? 'Non-stop' : `${stops} stop${stops > 1 ? 's' : ''}`} · {selectedOffer.owner?.name}
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-center">
              <div className="text-3xl font-bold text-gold font-mono">{firstSeg?.origin?.iata_code}</div>
              <div className="text-xs text-sand-dark/60 mt-0.5">{firstSeg?.origin?.city_name}</div>
              <div className="text-xs text-sand-dark/40">{formatTime(firstSeg?.departing_at)}</div>
            </div>
            <div className="flex-1 flex items-center min-w-0">
              <div className="flex-1 h-px border-t border-dashed border-gold/20" />
              <Plane size={16} className="text-gold mx-3 shrink-0" />
              <div className="flex-1 h-px border-t border-dashed border-gold/20" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gold font-mono">{lastSeg?.destination?.iata_code}</div>
              <div className="text-xs text-sand-dark/60 mt-0.5">{lastSeg?.destination?.city_name}</div>
              <div className="text-xs text-sand-dark/40">{formatDate(lastSeg?.arriving_at)}</div>
            </div>
            <div className="ml-auto text-right shrink-0">
              <div className="text-2xl font-bold text-gold">
                {selectedOffer.total_currency} {parseFloat(selectedOffer.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-sand-dark/50">total · {totalPax} pax</div>
            </div>
          </div>
        </div>

        {/* Passenger forms */}
        <form onSubmit={handleBook}>
          {passengers.map((pax, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-xl border border-gold/15 mb-5">
              <h3 className="text-gold font-serif mb-5 flex items-center gap-2">
                Passenger {idx + 1}
                {idx === 0 && <span className="text-xs text-gold/40 font-sans bg-gold/10 px-2 py-0.5 rounded-full">Lead passenger</span>}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Title */}
                <div>
                  <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">Title</label>
                  <select value={pax.title} onChange={(e) => update(idx, 'title', e.target.value)} className="input-luxury">
                    <option value="mr">Mr</option>
                    <option value="ms">Ms</option>
                    <option value="mrs">Mrs</option>
                    <option value="miss">Miss</option>
                    <option value="dr">Dr</option>
                  </select>
                </div>

                {/* First Name */}
                <div>
                  <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">First Name</label>
                  <input required value={pax.given_name} onChange={(e) => update(idx, 'given_name', e.target.value)}
                    className="input-luxury" placeholder="Ahmed" minLength={2} />
                </div>

                {/* Last Name */}
                <div>
                  <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">Last Name</label>
                  <input required value={pax.family_name} onChange={(e) => update(idx, 'family_name', e.target.value)}
                    className="input-luxury" placeholder="Hassan" minLength={2} />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">Date of Birth</label>
                  <input required type="date" value={pax.born_on}
                    max={new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    onChange={(e) => update(idx, 'born_on', e.target.value)}
                    className="input-luxury [color-scheme:dark]" />
                </div>

                {/* Gender */}
                <div>
                  <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">Gender</label>
                  <select value={pax.gender} onChange={(e) => update(idx, 'gender', e.target.value)} className="input-luxury">
                    <option value="m">Male</option>
                    <option value="f">Female</option>
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">
                    Phone <span className="text-gold/30 normal-case">(E.164)</span>
                  </label>
                  <div className="relative">
                    <Phone size={13} className="absolute left-3 top-3 text-gold/40 pointer-events-none" />
                    <input
                      required
                      value={pax.phone_number}
                      onChange={(e) => handlePhoneChange(idx, e.target.value)}
                      className={`input-luxury pl-8 ${phoneErrors[idx] ? 'border-rose-600' : ''}`}
                      placeholder="+201001234567"
                    />
                  </div>
                  {phoneErrors[idx] ? (
                    <p className="text-rose-400 text-[10px] mt-1">{phoneErrors[idx]}</p>
                  ) : (
                    <p className="text-sand-dark/35 text-[10px] mt-1">Start with + then country code</p>
                  )}
                </div>

                {/* Email */}
                <div className="col-span-2 md:col-span-3">
                  <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">Email Address</label>
                  <input required type="email" value={pax.email}
                    onChange={(e) => update(idx, 'email', e.target.value)}
                    className="input-luxury" placeholder="traveler@example.com" />
                </div>
              </div>
            </div>
          ))}

          {/* Error box */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-400 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p>{error}</p>
                {(error.includes('already been booked') || error.includes('no longer available')) && (
                  <button
                    type="button"
                    onClick={() => { setSelectedOffer(null); onNavigate('home'); }}
                    className="text-gold underline text-xs mt-1"
                  >
                    Search for new flights →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Security note */}
          <div className="flex items-center gap-2 text-sand-dark/40 text-xs mb-6">
            <Shield size={13} className="text-gold shrink-0" />
            Your data is encrypted and secured. We never store payment details.
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || offerExpired}
            className="w-full btn-gold py-4 text-base flex items-center justify-center gap-3 rounded-xl disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-nile border-t-transparent rounded-full animate-spin" />
                Processing your booking...
              </>
            ) : (
              <>
                <ChevronRight size={20} />
                {user ? `Confirm Booking · ${selectedOffer.total_currency} ${parseFloat(selectedOffer.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Sign In to Book'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
