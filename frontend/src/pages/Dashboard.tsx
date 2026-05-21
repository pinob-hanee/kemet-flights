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
  createdAt: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useStore();
  const [bookings, setBookings] = useState<DuffelOrder[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get('/flights/my-bookings')
      .then((r) => setBookings(r.data.data || []))
      .catch(() => setBookings([]))
      .finally(() => setLoadingBookings(false));
  }, [user]);

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
                  <div key={b.id} className="bg-nile border border-gold/15 p-4 rounded-xl hover:border-gold/25 transition-colors">
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
                          <div className="text-[10px] text-sand-dark/35 mt-0.5">{b.passengerCount} passenger{b.passengerCount > 1 ? 's' : ''}</div>
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
