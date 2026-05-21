import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Wallet, Star, Calendar, MessageSquare, Shield, Compass, Plane } from 'lucide-react';
import api from '../lib/api';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, flightSearch } = useStore();
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-panel p-12 text-center max-w-md rounded-2xl border border-gold/20">
          <Shield size={40} className="text-gold mx-auto mb-4" />
          <h2 className="text-gold font-serif text-xl mb-3">Sign In Required</h2>
          <p className="text-sand-dark/70 mb-6 text-sm">Please sign in to view your bookings.</p>
          <button onClick={() => onNavigate('home')} className="btn-gold">
            Back to Search
          </button>
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

  const walletBalance = typeof user.walletBalance === 'number' ? user.walletBalance.toFixed(2) : '500.00';
  const loyaltyPoints = user.loyaltyPoints ?? 100;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="glass-panel p-6 mb-8 border-gold/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-xl">
        <div>
          <div className="divider-pharaoh max-w-xs mb-3 text-gold/40">My Account</div>
          <h1 className="text-2xl md:text-3xl font-serif text-gold-glint font-bold">
            Welcome, {user.name}
          </h1>
          <p className="text-xs text-sand-dark/60 mt-1">
            Manage your flight bookings, wallet and support tickets.
          </p>
        </div>
        <span className="text-[10px] text-gold uppercase tracking-widest font-bold bg-gold/10 border border-gold/30 px-3 py-1.5 rounded-full flex items-center gap-1">
          <Shield size={11} />
          {user.role}
        </span>
      </div>

      {/* Stats row */}
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
            <span className="text-[10px] text-gold uppercase tracking-wider font-bold">Membership</span>
            <Compass size={18} className="text-gold" />
          </div>
          <div className="text-xl font-bold text-sand-light font-serif">PHARAONIC GOLD</div>
          <div className="text-xs text-gold/70 mt-1">VIP Airport Lounge Access</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

        {/* Bookings section */}
        <div className="lg:col-span-2 space-y-5">
          <div className="glass-panel p-6 rounded-xl">
            <h3 className="text-lg font-serif font-bold text-sand-light border-b border-gold/10 pb-3 mb-5 flex items-center gap-2">
              <Plane size={18} className="text-gold" />
              My Flight Bookings
            </h3>

            {/* Recent search reminder */}
            {flightSearch.origin && flightSearch.destination ? (
              <div className="bg-nile border border-gold/15 p-4 rounded-lg mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-gold font-bold font-mono text-sm">{flightSearch.origin.iata_code}</span>
                    <Plane size={12} className="text-gold" />
                    <span className="text-gold font-bold font-mono text-sm">{flightSearch.destination.iata_code}</span>
                  </div>
                  <div className="text-sand-dark/60 text-xs">
                    {flightSearch.departureDate}
                    {flightSearch.returnDate && ` → ${flightSearch.returnDate}`}
                  </div>
                  <div className="text-sand-dark/50 text-xs capitalize">
                    {flightSearch.passengers.adults + flightSearch.passengers.children + flightSearch.passengers.infants} pax · {flightSearch.cabinClass.replace('_', ' ')}
                  </div>
                  <button
                    onClick={() => onNavigate('flights')}
                    className="ml-auto btn-outline-gold text-xs px-3 py-1"
                  >
                    View Results
                  </button>
                </div>
              </div>
            ) : null}

            <div className="text-center py-12 border border-dashed border-gold/15 rounded-xl">
              <Calendar size={36} className="text-gold/30 mx-auto mb-3" />
              <p className="text-sand-dark/50 text-sm mb-4">
                Your confirmed bookings will appear here after checkout.
              </p>
              <button
                onClick={() => onNavigate('home')}
                className="btn-gold text-sm px-6 py-2"
              >
                Search Flights
              </button>
            </div>
          </div>
        </div>

        {/* Support panel */}
        <div>
          <div className="glass-panel p-6 rounded-xl">
            <h3 className="text-lg font-serif font-bold text-sand-light border-b border-gold/10 pb-3 mb-4 flex items-center gap-2">
              <MessageSquare size={16} className="text-gold" />
              VIP Concierge Support
            </h3>

            {ticketSuccess ? (
              <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-lg text-xs text-emerald-300 text-center animate-fadeIn">
                <p className="font-bold mb-1">Support Ticket Submitted</p>
                <p className="text-emerald-400/80">A concierge agent will respond within minutes.</p>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Booking inquiry"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="input-luxury"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">Message</label>
                  <textarea
                    rows={4}
                    placeholder="Describe your issue or question..."
                    value={ticketMsg}
                    onChange={(e) => setTicketMsg(e.target.value)}
                    className="input-luxury resize-none"
                    required
                  />
                </div>
                <button type="submit" className="btn-gold w-full text-sm py-2.5">
                  Submit Ticket
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
