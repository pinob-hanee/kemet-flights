import React, { useState } from 'react';
import { useStore } from './store/useStore';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AIConcierge from './components/AIConcierge';

import Home from './pages/Home';
import Flights from './pages/Flights';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import { NotFound } from './pages/NotFound';

import { KeyRound, Mail, User as UserIcon, X, Eye, EyeOff } from 'lucide-react';
import api from './lib/api';

export default function App() {
  const { user, setUser, setToken } = useStore();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthError('');
    setShowPassword(false);
    setAuthOpen(true);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      if (authMode === 'register') {
        // Register returns no token — auto-login afterward
        await api.post('/auth/register', {
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
        });
        // Auto-login with same credentials
        const loginRes = await api.post('/auth/login', {
          email: authForm.email,
          password: authForm.password,
        });
        const { token, id, email, name, role, walletBalance, loyaltyPoints } = loginRes.data.data || {};
        if (token) {
          setToken(token);
          setUser({ id, email, name, role, walletBalance, loyaltyPoints });
          setAuthOpen(false);
          setAuthForm({ name: '', email: '', password: '' });
        }
      } else {
        // Direct login
        const res = await api.post('/auth/login', {
          email: authForm.email,
          password: authForm.password,
        });
        const { token, id, email, name, role, walletBalance, loyaltyPoints } = res.data.data || {};
        if (token) {
          setToken(token);
          setUser({ id, email, name, role, walletBalance, loyaltyPoints });
          setAuthOpen(false);
          setAuthForm({ name: '', email: '', password: '' });
        } else {
          setAuthError('No token received. Please try again.');
        }
      }
    } catch (err: any) {
      // Mock fallback ONLY when backend is completely unreachable (no response at all)
      if (!err.response && authForm.email && authForm.password) {
        setToken('mock_jwt_token_kemet_offline_2026');
        setUser({
          id: 'u-offline-1',
          name: authMode === 'register' ? authForm.name || 'New Traveler' : 'Demo Traveler',
          email: authForm.email,
          role: authForm.email.toLowerCase().includes('admin') ? 'ADMIN' : 'CUSTOMER',
        });
        setAuthOpen(false);
        setAuthForm({ name: '', email: '', password: '' });
      } else {
        // Real API error — show the message
        setAuthError(err?.response?.data?.error?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'flights':
        return <Flights onNavigate={handleNavigate} />;
      case 'checkout':
        return <Checkout onNavigate={handleNavigate} onOpenAuth={() => openAuth('login')} />;
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'admin':
        return <Admin />;
      default:
        return <NotFound onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-nile text-slate-100 font-sans">
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenAuth={() => openAuth('login')}
      />

      <main className="flex-grow pt-16">
        {renderPage()}
      </main>

      <Footer onNavigate={handleNavigate} />
      <AIConcierge />

      {/* ── Auth Modal ── */}
      {authOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-nile-dark/80 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setAuthOpen(false)}
        >
          <div className="w-full max-w-md glass-panel p-8 border border-gold/30 rounded-2xl shadow-gold relative animate-fadeIn">
            <button
              onClick={() => setAuthOpen(false)}
              className="absolute top-4 right-4 text-sand-dark hover:text-gold transition-colors"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="text-center mb-7">
              <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-3">
                <KeyRound size={20} className="text-gold" />
              </div>
              <h2 className="text-2xl font-serif text-gold-glint">
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-sand-dark/50 text-xs mt-1 uppercase tracking-widest">Kemet Flights</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {/* Name field (register only) */}
              {authMode === 'register' && (
                <div>
                  <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon size={15} className="absolute left-3 top-3 text-gold/40 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Ahmed Hassan"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      className="input-luxury pl-9"
                      required
                      minLength={2}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-3 text-gold/40 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="traveler@kemet.io"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className="input-luxury pl-9"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs text-gold/60 uppercase tracking-widest block mb-1.5">
                  Password {authMode === 'register' && <span className="text-sand-dark/40 normal-case">(min 8 characters)</span>}
                </label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-3 text-gold/40 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="input-luxury pl-9 pr-9"
                    required
                    minLength={authMode === 'register' ? 8 : 1}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gold/40 hover:text-gold transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {authError && (
                <div className="bg-rose-950/40 border border-rose-800/60 rounded-lg px-4 py-2.5 text-rose-400 text-sm">
                  {authError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full btn-gold py-3 mt-2 flex items-center justify-center gap-2"
              >
                {authLoading && (
                  <div className="w-4 h-4 border-2 border-nile border-t-transparent rounded-full animate-spin" />
                )}
                {authLoading
                  ? (authMode === 'register' ? 'Creating account...' : 'Signing in...')
                  : authMode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sand-dark/60 text-sm mt-5">
              {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
                className="text-gold hover:underline"
              >
                {authMode === 'login' ? 'Register' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
