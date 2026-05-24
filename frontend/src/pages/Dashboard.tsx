import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Wallet, Star, Shield, Compass, Plane, Calendar, MessageSquare, ExternalLink } from 'lucide-react';
import api from '../lib/api';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

interface DuffelOrder {
  id: string;
  duffelOrderId: string;
  bookingReference: string;
  origin: string;
  destination: string;
  departureDate: string;
  totalAmount: number;
  currency: string;
  passengerCount: number;
  airlineName: string | null;
  status: string;
  seats?: string | null;
  itinerary?: any;
  createdAt: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useStore();
  const [bookings, setBookings] = useState<DuffelOrder[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // ── Phase 3 States ──
  const [activeItineraryId, setActiveItineraryId] = useState<string | null>(null);
  const [itineraries, setItineraries] = useState<Record<string, any>>({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [itineraryPace, setItineraryPace] = useState<'Relaxed' | 'Balanced' | 'Fast-Paced'>('Balanced');
  const [itineraryInterests, setItineraryInterests] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    api.get('/flights/my-bookings')
      .then((r) => setBookings(r.data.data || []))
      .catch(() => setBookings([]))
      .finally(() => setLoadingBookings(false));
  }, [user]);

  const handleToggleItinerary = async (bookingId: string) => {
    if (activeItineraryId === bookingId) {
      setActiveItineraryId(null);
      return;
    }

    setActiveItineraryId(bookingId);

    // If already generated in this session, skip fetching
    if (itineraries[bookingId]) return;

    setGeneratingId(bookingId);
    try {
      const res = await api.get(`/flights/my-bookings/${bookingId}/itinerary`);
      if (res.data.data) {
        setItineraries(prev => ({ ...prev, [bookingId]: res.data.data }));
      }
    } catch (err) {
      console.log('No cached itinerary found for booking');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleGenerateItinerary = async (bookingId: string) => {
    setGeneratingId(bookingId);
    try {
      const res = await api.post(`/flights/my-bookings/${bookingId}/itinerary`, {
        pace: itineraryPace,
        interests: itineraryInterests.length > 0 ? itineraryInterests : ['history', 'temples', 'cruises'],
        durationDays: 5,
      });
      if (res.data.data) {
        setItineraries(prev => ({ ...prev, [bookingId]: res.data.data }));
      }
    } catch (err) {
      console.error('Failed to generate itinerary:', err);
    } finally {
      setGeneratingId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-panel p-12 text-center max-w-md rounded-2xl border border-gold/20">
          <Shield size={40} className="text-gold mx-auto mb-4" />
          <h2 className="text-gold font-serif text-xl mb-3">Sign In Required</h2>
          <p className="text-sand-dark/70 mb-6 text-sm">Please sign in to view your bookings.</p>
          <button onClick={() => onNavigate('home')} className="btn-gold">Back to Search</button>
        </div>
      </div>
    );
  }

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMsg) return;
    setTicketSuccess(true);
    setTicketSubject('');
    setTicketMsg('');
    setTimeout(() => setTicketSuccess(false), 5000);
  };

  const walletBalance = typeof user.walletBalance === 'number'
    ? user.walletBalance.toFixed(2)
    : '500.00';
  const loyaltyPoints = user.loyaltyPoints ?? 100;

  const getLoyaltyTier = (points: number) => {
    if (points < 1000) {
      return { name: 'Bronze Scarab', max: 1000, multiplier: '1.0x', nextName: 'Silver Anubis', nextMax: 1000, icon: '🪲' };
    } else if (points < 3000) {
      return { name: 'Silver Anubis', max: 3000, multiplier: '1.1x', nextName: 'Golden Horus', nextMax: 3000, icon: '⚖️' };
    } else if (points < 7000) {
      return { name: 'Golden Horus', max: 7000, multiplier: '1.25x', nextName: 'Royal Pharaoh', nextMax: 7000, icon: '🪽' };
    } else {
      return { name: 'Royal Pharaoh', max: 10000, multiplier: '1.5x', nextName: '', nextMax: 10000, icon: '👑' };
    }
  };

  const loyaltyTier = getLoyaltyTier(loyaltyPoints);

  const statusColor = (s: string) =>
    s === 'CONFIRMED' ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60'
    : s === 'CANCELLED' ? 'text-rose-400 bg-rose-950/40 border-rose-800/60'
    : 'text-amber-400 bg-amber-950/40 border-amber-800/60';

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="glass-panel p-6 mb-8 border-gold/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-xl">
        <div>
          <div className="divider-pharaoh max-w-xs mb-3 text-gold/40">My Account</div>
          <h1 className="text-2xl md:text-3xl font-serif text-gold-glint font-bold">
            Welcome, {user.name.split(' ')[0]}
          </h1>
          <p className="text-xs text-sand-dark/60 mt-1">
            {user.email} · Manage your bookings, wallet, and support.
          </p>
        </div>
        <span className="text-[10px] text-gold uppercase tracking-widest font-bold bg-gold/10 border border-gold/30 px-3 py-1.5 rounded-full flex items-center gap-1">
          <Shield size={11} />{user.role}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="glass-panel p-5 rounded-xl hover:border-gold/30 transition-colors">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] text-gold uppercase tracking-wider font-bold">Kemet Wallet</span>
            <Wallet size={18} className="text-gold" />
          </div>
          <div className="text-3xl font-bold text-sand-light font-serif">${walletBalance}</div>
          <div className="text-xs text-emerald-400 mt-1">Available credit</div>
        </div>

        <div className="glass-panel p-5 rounded-xl hover:border-gold/30 transition-colors">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] text-gold uppercase tracking-wider font-bold">Loyalty Points</span>
            <Star size={18} className="text-gold fill-gold" />
          </div>
          <div className="text-3xl font-bold text-gold-glint font-serif">{loyaltyPoints}</div>
          <div className="text-xs text-sand-dark/60 mt-1">Gold Tier Traveler</div>
        </div>

        <div className="glass-panel p-5 rounded-xl hover:border-gold/30 transition-colors">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] text-gold uppercase tracking-wider font-bold">Total Flights</span>
            <Compass size={18} className="text-gold" />
          </div>
          <div className="text-3xl font-bold text-sand-light font-serif">{bookings.length}</div>
          <div className="text-xs text-gold/70 mt-1">Confirmed bookings</div>
        </div>
      </div>

      {/* ── Nile River Loyalty Progress ── */}
      <div className="glass-panel p-5 rounded-xl border border-gold/15 mb-8 text-left animate-fadeIn">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 border-b border-gold/10 pb-3">
          <div>
            <span className="text-[10px] text-gold uppercase tracking-widest font-bold">Sacred Nile Loyalty Path</span>
            <h3 className="text-lg font-serif font-bold text-sand-light mt-1 flex items-center gap-2">
              <span className="text-xl">{loyaltyTier.icon}</span> Status Tier: {loyaltyTier.name}
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-gold bg-gold/10 border border-gold/30 px-3 py-1 rounded">
            {loyaltyPoints.toLocaleString()} / {loyaltyTier.max.toLocaleString()} Debens
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="space-y-3">
          <div className="relative w-full h-3 bg-nile border border-gold/20 rounded-full overflow-hidden shadow-inner">
            {/* Nile Flowing Wave fill */}
            <div 
              className="h-full bg-gradient-to-r from-cyan-600 via-blue-500 to-cyan-500 rounded-full transition-all duration-1000 relative shadow-gold"
              style={{ width: `${Math.min(100, (loyaltyPoints / loyaltyTier.max) * 100)}%` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[shimmer_2s_linear_infinite] opacity-40" />
            </div>
          </div>

          {/* Earning ledger & Perks */}
          <div className="flex justify-between items-center text-[10px] text-sand-dark font-medium">
            <span>{loyaltyTier.name} Privilege ({loyaltyTier.multiplier} point multiplier)</span>
            {loyaltyTier.nextName && (
              <span>Next Path: {loyaltyTier.nextName} ({loyaltyTier.nextMax - loyaltyPoints} Debens left)</span>
            )}
          </div>
        </div>

        {/* Tier milestones description */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center mt-5 pt-4 border-t border-gold/10">
          {[
            { name: 'Bronze Scarab', points: '0+', active: loyaltyPoints < 1000, icon: '🪲' },
            { name: 'Silver Anubis', points: '1k+', active: loyaltyPoints >= 1000 && loyaltyPoints < 3000, icon: '⚖️' },
            { name: 'Golden Horus', points: '3k+', active: loyaltyPoints >= 3000 && loyaltyPoints < 7000, icon: '🪽' },
            { name: 'Royal Pharaoh', points: '7k+', active: loyaltyPoints >= 7000, icon: '👑' },
          ].map((m) => (
            <div 
              key={m.name} 
              className={`p-2.5 rounded-lg border transition-all ${
                m.active 
                  ? 'bg-gold-dark/10 border-gold shadow-gold scale-105' 
                  : 'bg-nile/20 border-gold/5 opacity-40'
              }`}
            >
              <span className="text-xl block mb-1">{m.icon}</span>
              <span className={`text-[10px] font-serif block font-bold ${m.active ? 'text-gold-glint' : 'text-sand-dark'}`}>{m.name}</span>
              <span className="text-[8px] font-mono text-sand-dark/50 block mt-0.5">{m.points}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

        {/* Bookings */}
        <div className="lg:col-span-2">
          <div className="glass-panel p-6 rounded-xl">
            <h3 className="text-lg font-serif font-bold text-sand-light border-b border-gold/10 pb-3 mb-5 flex items-center gap-2">
              <Plane size={18} className="text-gold" />
              My Flight Bookings
            </h3>

            {loadingBookings ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-nile-light/40 rounded-xl animate-pulse border border-gold/5" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gold/15 rounded-xl">
                <Calendar size={36} className="text-gold/30 mx-auto mb-3" />
                <p className="text-sand-dark/50 text-sm mb-4">No bookings yet.</p>
                <button onClick={() => onNavigate('home')} className="btn-gold text-sm px-6 py-2">
                  Search Flights
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} className="bg-nile border border-gold/15 p-4 rounded-xl hover:border-gold/25 transition-colors text-left">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        {/* Route pill */}
                        <div className="flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-lg px-3 py-2">
                          <span className="text-gold font-mono font-bold text-sm">{b.origin}</span>
                          <Plane size={11} className="text-gold" />
                          <span className="text-gold font-mono font-bold text-sm">{b.destination}</span>
                        </div>
                        <div>
                          <div className="text-xs text-sand-dark/50">{b.airlineName || 'Airline'}</div>
                          <div className="text-xs text-sand-dark/40">{b.departureDate}</div>
                          <div className="text-[10px] text-sand-dark/35 mt-0.5">
                            {b.passengerCount} passenger{b.passengerCount > 1 ? 's' : ''}
                            {b.seats && <span className="text-gold ml-2">· Seats: {b.seats}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1.5">
                        <div className="text-sm font-bold text-gold font-serif">
                          {b.currency} {b.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <span className={`text-[9px] border px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${statusColor(b.status)}`}>
                          {b.status}
                        </span>
                        <div className="text-[10px] font-mono text-gold/60 tracking-wider">
                          REF: <strong>{b.bookingReference}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="mt-4 pt-3 border-t border-gold/10 flex justify-between items-center gap-2 flex-wrap">
                      <span className="text-[9px] text-sand-dark/40 font-mono">Booked on {new Date(b.createdAt).toLocaleDateString()}</span>
                      <button 
                        onClick={() => handleToggleItinerary(b.id)}
                        className={`text-[10px] font-serif font-bold px-4 py-1.5 rounded border transition-all flex items-center gap-1.5 ${
                          activeItineraryId === b.id 
                            ? 'bg-gold text-nile border-gold shadow-gold' 
                            : 'bg-nile hover:bg-nile-light border-gold/30 text-gold'
                        }`}
                      >
                        ✨ {activeItineraryId === b.id ? 'Close Scroll' : 'AI Travel Scroll'}
                      </button>
                    </div>

                    {/* Expandable AI Itinerary Chronicle */}
                    {activeItineraryId === b.id && (
                      <div className="mt-4 border-t border-gold/10 pt-4 animate-fadeIn">
                        {generatingId === b.id ? (
                          <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
                            <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
                            <p className="text-[10px] text-sand-dark font-serif animate-pulse">Scribing the Golden Travel Scroll from Heliopolis...</p>
                          </div>
                        ) : !itineraries[b.id] ? (
                          <div className="p-4 bg-nile-blue/20 border border-gold/15 rounded-xl text-center space-y-4">
                            <Compass className="h-8 w-8 text-gold mx-auto animate-float" />
                            <div>
                              <h4 className="text-xs font-serif font-bold text-gold-glint">Bespoke Egyptologist Chronicle</h4>
                              <p className="text-[9px] text-sand-dark/60 mt-1 max-w-sm mx-auto leading-relaxed">
                                Let the royal high-priest scribes draft an ultra-luxury day-by-day travel chronicle for your journey to {b.destination}.
                              </p>
                            </div>

                            {/* Configurations */}
                            <div className="grid grid-cols-2 gap-3 text-[10px] text-left max-w-md mx-auto bg-nile border border-gold/5 p-3 rounded-lg">
                              <div>
                                <label className="text-[8px] text-gold/60 uppercase tracking-widest block mb-1">Voyage Pace</label>
                                <select 
                                  value={itineraryPace} 
                                  onChange={(e) => setItineraryPace(e.target.value as any)} 
                                  className="w-full bg-nile-blue border border-gold/20 rounded p-1.5 text-[9px] text-sand-light"
                                >
                                  <option value="Relaxed">Relaxed (Royal Rest)</option>
                                  <option value="Balanced">Balanced (Pharaonic Path)</option>
                                  <option value="Fast-Paced">Imperial (Fast-Paced)</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[8px] text-gold/60 uppercase tracking-widest block mb-1">Focus & Interest</label>
                                <select 
                                  multiple 
                                  value={itineraryInterests} 
                                  onChange={(e) => setItineraryInterests(Array.from(e.target.selectedOptions, option => option.value))}
                                  className="w-full bg-nile-blue border border-gold/20 rounded p-1 text-[9px] text-sand-light h-12"
                                >
                                  <option value="Antiquities">Antiquities & Temples</option>
                                  <option value="Nile cruises">Private Nile Cruises</option>
                                  <option value="VIP dining">VIP Culinary Degustation</option>
                                  <option value="Oasis wellness">Oasis Spas & Springs</option>
                                </select>
                              </div>
                            </div>

                            <button 
                              onClick={() => handleGenerateItinerary(b.id)}
                              className="btn-gold text-[9px] px-6 py-2 flex items-center justify-center gap-2 mx-auto"
                            >
                              ✨ Scribe Custom Travel Chronicle
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Rich Chronicle Header */}
                            <div className="flex justify-between items-center bg-gold-dark/10 border border-gold/20 p-4 rounded-xl gap-4 flex-wrap sm:flex-nowrap">
                              <div className="text-left">
                                <h4 className="text-xs text-gold uppercase tracking-widest font-semibold">{itineraries[b.id].title}</h4>
                                <p className="text-[9px] text-sand-dark mt-1 italic leading-relaxed">{itineraries[b.id].summary}</p>
                              </div>
                              {/* Download trigger */}
                              <button
                                onClick={() => {
                                  const element = document.createElement("a");
                                  const file = new Blob([JSON.stringify(itineraries[b.id], null, 2)], {type: 'text/plain'});
                                  element.href = URL.createObjectURL(file);
                                  element.download = `kemet_chronicle_${b.bookingReference}.txt`;
                                  document.body.appendChild(element);
                                  element.click();
                                }}
                                className="btn-outline-gold text-[8px] px-2.5 py-1.5 shrink-0 hover:scale-105 transition-all"
                              >
                                Download Scroll
                              </button>
                            </div>

                            {/* Days loop */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                              {itineraries[b.id].days?.map((day: any) => (
                                <div key={day.day} className="glass-card p-4 rounded-xl border border-gold/10 flex flex-col justify-between space-y-3">
                                  <div>
                                    <div className="flex items-center gap-1.5 border-b border-gold/10 pb-2 mb-2">
                                      <span className="w-5 h-5 rounded-full bg-gold/10 border border-gold/30 text-[9px] font-mono text-gold flex items-center justify-center font-bold">
                                        {day.day}
                                      </span>
                                      <h5 className="text-[10px] font-serif font-bold text-sand-light">{day.theme}</h5>
                                    </div>
                                    <div className="space-y-2 text-[9px] leading-relaxed">
                                      <div>
                                        <span className="text-[8px] text-gold/60 uppercase tracking-widest font-semibold">Morning Sun:</span>
                                        <p className="text-sand-dark/80 mt-0.5">{day.morning}</p>
                                      </div>
                                      <div>
                                        <span className="text-[8px] text-gold/60 uppercase tracking-widest font-semibold">Noon Zenith:</span>
                                        <p className="text-sand-dark/80 mt-0.5">{day.afternoon}</p>
                                      </div>
                                      <div>
                                        <span className="text-[8px] text-gold/60 uppercase tracking-widest font-semibold">Nile Dusk:</span>
                                        <p className="text-sand-dark/80 mt-0.5">{day.evening}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Support */}
        <div>
          <div className="glass-panel p-6 rounded-xl">
            <h3 className="text-lg font-serif font-bold text-sand-light border-b border-gold/10 pb-3 mb-4 flex items-center gap-2">
              <MessageSquare size={16} className="text-gold" />
              VIP Concierge
            </h3>

            {ticketSuccess ? (
              <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-lg text-xs text-emerald-300 text-center animate-fadeIn">
                <p className="font-bold mb-1">Ticket Submitted ✓</p>
                <p className="text-emerald-400/80">A concierge agent will respond shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">Subject</label>
                  <input type="text" placeholder="e.g. Booking inquiry"
                    value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)}
                    className="input-luxury" required />
                </div>
                <div>
                  <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">Message</label>
                  <textarea rows={4} placeholder="Describe your question..."
                    value={ticketMsg} onChange={(e) => setTicketMsg(e.target.value)}
                    className="input-luxury resize-none" required />
                </div>
                <button type="submit" className="btn-gold w-full text-sm py-2.5">Submit Ticket</button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
