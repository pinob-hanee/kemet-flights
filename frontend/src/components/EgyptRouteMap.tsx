import React, { useState } from 'react';

const CITIES = [
  { id: 'CAI', label: 'Cairo', emoji: '👑', x: 220, y: 145, code: 'CAI' },
  { id: 'ALY', label: 'Alexandria', emoji: '🏛️', x: 165, y: 100, code: 'ALY' },
  { id: 'HRG', label: 'Hurghada', emoji: '🏖️', x: 295, y: 220, code: 'HRG' },
  { id: 'LXR', label: 'Luxor', emoji: '🏺', x: 255, y: 320, code: 'LXR' },
  { id: 'ASW', label: 'Aswan', emoji: '🛶', x: 265, y: 400, code: 'ASW' },
  { id: 'SWW', label: 'Siwa', emoji: '🌴', x: 75, y: 195, code: 'SWW' },
];

const ROUTES = [
  ['CAI', 'ALY'], ['CAI', 'HRG'], ['CAI', 'LXR'], ['CAI', 'SWW'],
  ['LXR', 'ASW'], ['LXR', 'HRG'], ['HRG', 'ASW'],
];

interface EgyptRouteMapProps {
  onCitySelect?: (origin: string, destination: string) => void;
  activeCities?: string[];
}

export const EgyptRouteMap: React.FC<EgyptRouteMapProps> = ({ onCitySelect, activeCities = [] }) => {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);

  const getCityById = (id: string) => CITIES.find(c => c.id === id);

  const handleCityClick = (cityId: string) => {
    if (!selectedOrigin) {
      setSelectedOrigin(cityId);
    } else if (selectedOrigin === cityId) {
      setSelectedOrigin(null);
    } else {
      onCitySelect?.(selectedOrigin, cityId);
      setSelectedOrigin(null);
    }
  };

  const isRouteActive = (a: string, b: string) =>
    (selectedOrigin === a || selectedOrigin === b) ||
    (activeCities.includes(a) && activeCities.includes(b));

  return (
    <div className="relative w-full" style={{ maxWidth: 420 }}>
      <div className="text-center mb-3">
        <span className="text-[10px] text-gold uppercase tracking-widest font-bold">
          {selectedOrigin
            ? `From ${getCityById(selectedOrigin)?.label} — select destination`
            : 'Click a city to begin your royal journey'}
        </span>
      </div>
      <svg
        viewBox="0 0 420 480"
        className="w-full"
        style={{ filter: 'drop-shadow(0 0 24px rgba(212,175,55,0.08))' }}
      >
        {/* Background glow */}
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#0D0F12" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="arrowGold" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="rgba(212,175,55,0.6)" />
          </marker>
        </defs>

        <rect width="420" height="480" fill="url(#mapGlow)" rx="16" />

        {/* Egypt landmass silhouette (approximate) */}
        <path
          d="M 100 60 L 340 60 L 360 140 L 340 220 L 310 300 L 290 420 L 250 460 L 210 460 L 180 400 L 150 300 L 100 200 Z"
          fill="rgba(212,175,55,0.03)"
          stroke="rgba(212,175,55,0.08)"
          strokeWidth="1"
        />

        {/* Nile River approximate */}
        <path
          d="M 230 440 Q 240 360 255 280 Q 260 220 240 160 Q 225 120 215 80"
          fill="none"
          stroke="rgba(30,100,180,0.2)"
          strokeWidth="3"
          strokeDasharray="4 4"
        />

        {/* Routes */}
        {ROUTES.map(([a, b]) => {
          const ca = getCityById(a);
          const cb = getCityById(b);
          if (!ca || !cb) return null;
          const active = isRouteActive(a, b);
          return (
            <g key={`${a}-${b}`}>
              <line
                x1={ca.x} y1={ca.y} x2={cb.x} y2={cb.y}
                stroke={active ? 'rgba(212,175,55,0.7)' : 'rgba(212,175,55,0.15)'}
                strokeWidth={active ? 2 : 1}
                strokeDasharray={active ? '6 3' : '4 6'}
                style={{ transition: 'all 0.3s ease' }}
                markerEnd={active ? 'url(#arrowGold)' : undefined}
              />
              {active && (
                <circle r="3" fill="#D4AF37" opacity="0.9" filter="url(#glow)">
                  <animateMotion
                    dur="2s"
                    repeatCount="indefinite"
                    path={`M${ca.x},${ca.y} L${cb.x},${cb.y}`}
                  />
                </circle>
              )}
            </g>
          );
        })}

        {/* City Nodes */}
        {CITIES.map(city => {
          const isSelected = selectedOrigin === city.id;
          const isActive = activeCities.includes(city.id);
          const isHovered = hoveredCity === city.id;
          return (
            <g
              key={city.id}
              onClick={() => handleCityClick(city.id)}
              onMouseEnter={() => setHoveredCity(city.id)}
              onMouseLeave={() => setHoveredCity(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Outer glow ring */}
              {(isSelected || isActive) && (
                <circle
                  cx={city.x} cy={city.y} r={22}
                  fill="none"
                  stroke="rgba(212,175,55,0.4)"
                  strokeWidth="1"
                >
                  <animate attributeName="r" values="18;26;18" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Node circle */}
              <circle
                cx={city.x} cy={city.y} r={isHovered || isSelected ? 18 : 14}
                fill={isSelected ? 'rgba(212,175,55,0.25)' : isHovered ? 'rgba(212,175,55,0.12)' : 'rgba(13,15,18,0.7)'}
                stroke={isSelected ? '#D4AF37' : isActive ? 'rgba(212,175,55,0.6)' : 'rgba(212,175,55,0.3)'}
                strokeWidth={isSelected ? 2 : 1}
                filter={isSelected || isHovered ? 'url(#glow)' : undefined}
                style={{ transition: 'all 0.25s ease' }}
              />
              {/* Emoji */}
              <text
                x={city.x} y={city.y + 5}
                textAnchor="middle"
                fontSize={isHovered || isSelected ? '14' : '12'}
                style={{ transition: 'all 0.25s ease', userSelect: 'none' }}
              >
                {city.emoji}
              </text>
              {/* City label */}
              <text
                x={city.x} y={city.y + (isHovered ? 33 : 29)}
                textAnchor="middle"
                fill={isSelected ? '#D4AF37' : 'rgba(212,175,55,0.7)'}
                fontSize="9"
                fontFamily="Montserrat, sans-serif"
                fontWeight="600"
                letterSpacing="1"
                style={{ transition: 'all 0.25s ease', userSelect: 'none' }}
              >
                {city.label.toUpperCase()}
              </text>
              {/* IATA Code badge */}
              <text
                x={city.x} y={city.y + (isHovered ? 44 : 40)}
                textAnchor="middle"
                fill="rgba(212,175,55,0.4)"
                fontSize="7"
                fontFamily="monospace"
                style={{ userSelect: 'none' }}
              >
                {city.code}
              </text>
            </g>
          );
        })}
      </svg>

      {selectedOrigin && (
        <button
          onClick={() => setSelectedOrigin(null)}
          className="mt-2 text-xs text-sand-dark/50 hover:text-gold transition-colors mx-auto block"
        >
          ✕ Clear selection
        </button>
      )}
    </div>
  );
};

export default EgyptRouteMap;
