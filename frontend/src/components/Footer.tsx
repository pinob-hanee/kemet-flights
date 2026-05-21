import React from 'react';
import { Plane, Mail, Phone, MapPin } from 'lucide-react';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const nav = (page: string) => {
    onNavigate?.(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-nile-dark border-t border-gold/10 pt-14 pb-8 text-sand-light relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom right, rgba(212,175,55,0.03) 0%, transparent 60%)' }} />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                <Plane size={15} className="text-gold" />
              </div>
              <div>
                <span className="font-serif text-xl text-gold-glint">Kemet</span>
                <span className="text-sand-dark/50 text-sm ml-1.5">Flights</span>
              </div>
            </div>
            <p className="text-sand-dark/60 text-sm leading-relaxed max-w-xs">
              Search and book flights with the spirit of the ancients. Real-time fares across
              hundreds of airlines, in the golden aesthetic of pharaonic Egypt.
            </p>
            <div className="mt-5 space-y-2">
              <div className="flex items-center gap-2 text-sand-dark/50 text-xs">
                <Mail size={12} className="text-gold/50" />
                <span>support@kemetflights.io</span>
              </div>
              <div className="flex items-center gap-2 text-sand-dark/50 text-xs">
                <Phone size={12} className="text-gold/50" />
                <span>+20 2 2795 0000</span>
              </div>
              <div className="flex items-center gap-2 text-sand-dark/50 text-xs">
                <MapPin size={12} className="text-gold/50" />
                <span>Nile Corniche Tower, Cairo</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gold/80 text-xs uppercase tracking-widest font-semibold mb-5">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Search Flights', page: 'home' },
                { label: 'My Bookings', page: 'dashboard' },
                { label: 'Sign In', page: 'home' },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => nav(item.page)}
                    className="text-sand-dark/60 hover:text-gold text-sm transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-gold/80 text-xs uppercase tracking-widest font-semibold mb-5">
              Support
            </h4>
            <ul className="space-y-2.5">
              {['Help Center', 'Refund Policy', 'Baggage Info', 'Contact Us'].map((item) => (
                <li key={item}>
                  <span className="text-sand-dark/60 text-sm cursor-default">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gold/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sand-dark/40 text-xs">
            © 2026 Kemet Flights. Crafted with Pharaonic heritage.
          </p>
          <div className="flex items-center gap-1 text-sand-dark/40 text-xs">
            <span>Powered by</span>
            <span className="text-gold/60 font-semibold ml-1">Duffel</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Named export alias for backward compatibility
export { Footer };
