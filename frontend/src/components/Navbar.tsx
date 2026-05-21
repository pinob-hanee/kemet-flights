import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Plane, User as UserIcon, LogOut, Menu, X } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenAuth: () => void;
}

export default function Navbar({ currentPage, onNavigate, onOpenAuth }: NavbarProps) {
  const { user, logout } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { id: 'home', label: 'Search Flights' },
    { id: 'dashboard', label: 'My Bookings' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-nile/95 backdrop-blur-md border-b border-gold/15 shadow-glass'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-16 gap-6">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
              <Plane size={14} className="text-gold" />
            </div>
            <div className="hidden sm:block">
              <span className="font-serif text-lg text-gold-glint">Kemet</span>
              <span className="text-sand-dark/50 text-xs ml-1.5">Flights</span>
            </div>
          </button>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPage === link.id
                    ? 'text-gold bg-gold/10'
                    : 'text-sand-dark hover:text-sand-light hover:bg-white/5'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden sm:block text-sand-dark/60 text-sm truncate max-w-32">{user.name}</span>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="w-8 h-8 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold hover:bg-gold/20 transition-colors"
                  title="My Bookings"
                >
                  <UserIcon size={15} />
                </button>
                <button
                  onClick={logout}
                  className="w-8 h-8 rounded-full bg-rose-900/30 border border-rose-800/40 flex items-center justify-center text-rose-400 hover:bg-rose-900/50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={13} />
                </button>
              </>
            ) : (
              <button onClick={onOpenAuth} className="btn-gold text-sm px-5 py-2">
                Sign In
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden text-sand-light ml-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden glass-panel border-t border-gold/10 py-4 px-2 animate-slideUp">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => { onNavigate(link.id); setMobileOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  currentPage === link.id ? 'text-gold bg-gold/10' : 'text-sand-light hover:bg-gold/5'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
