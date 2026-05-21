import React from 'react';
import { useStore } from '../store/useStore';
import { Compass, ArrowLeft } from 'lucide-react';

interface NotFoundProps {
  onNavigate: (page: string) => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onNavigate }) => {
  // English-only mode

  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div className="space-y-6 animate-fadeIn">
        <div className="h-20 w-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold mx-auto">
          <Compass className="h-10 w-10 animate-float" />
        </div>
        <div>
          <h1 className="text-8xl font-serif text-gold-glint font-extrabold">404</h1>
          <h2 className="text-2xl font-serif text-sand-light mt-2">
            Lost in the Desert Sands
          </h2>
          <p className="text-sm text-sand-dark mt-3 max-w-md mx-auto">
            The sacred scroll you seek does not exist. Let us guide you back to the golden path.
          </p>
        </div>
        <button
          onClick={() => onNavigate('home')}
          className="btn-gold inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to the Palace
        </button>
      </div>
    </div>
  );
};
export default NotFound;
