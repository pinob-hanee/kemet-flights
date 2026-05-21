import React, { useState, useEffect, useMemo } from 'react';
import { Plane, Filter, ChevronDown, AlertCircle, Loader2, Search, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import api from '../lib/api';

interface FlightsProps {
  onNavigate: (page: string) => void;
}

function formatDuration(iso: string): string {
  if (!iso) return '';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = match[1] ? `${match[1]}h ` : '';
  const m = match[2] ? `${match[2]}m` : '';
  return `${h}${m}`.trim();
}

function formatTime(iso: string): string {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function StopsBadge({ stops }: { stops: number }) {
  if (stops === 0) return <span className="badge-confirmed">Direct</span>;
  if (stops === 1) return <span className="badge-pending">1 Stop</span>;
  return <span className="badge-cancelled">{stops} Stops</span>;
}

function FlightCard({ offer, onSelect }: { offer: any; onSelect: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const outbound = offer.slices?.[0];
  const inbound = offer.slices?.[1];
  if (!outbound) return null;

  const firstSeg = outbound.segments?.[0];
  const lastSeg = outbound.segments?.[outbound.segments.length - 1];
  const stops = (outbound.segments?.length ?? 1) - 1;
  const airlineName =
    firstSeg?.marketing_carrier?.name || offer.owner?.name || 'Unknown Airline';
  const price = parseFloat(offer.total_amount || '0').toLocaleString();
  const currency = offer.total_currency || 'USD';

  return (
    <div className="bg-nile-light/30 border border-gold/10 hover:border-gold/30 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-gold">
      <div className="p-4 md:p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          {/* Airline */}
          <div className="flex items-center gap-2.5 lg:w-40 shrink-0">
            <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
              <Plane size={14} className="text-gold" />
            </div>
            <div>
              <div className="text-sand-light text-xs font-semibold">{airlineName}</div>
              {firstSeg?.marketing_carrier_flight_number && (
                <div className="text-sand-dark/50 text-[10px]">
                  {firstSeg.marketing_carrier_flight_number}
                </div>
              )}
            </div>
          </div>

          {/* Outbound slice */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="text-center shrink-0">
                <div className="text-2xl font-bold text-sand-light leading-none">{formatTime(firstSeg?.departing_at)}</div>
                <div className="text-xs font-mono text-gold mt-0.5">{firstSeg?.origin?.iata_code}</div>
                <div className="text-[10px] text-sand-dark/50">{formatDate(firstSeg?.departing_at)}</div>
              </div>

              <div className="flex-1 text-center px-2">
                <div className="text-[10px] text-sand-dark/50 mb-1">{formatDuration(outbound.duration)}</div>
                <div className="relative flex items-center">
                  <div className="flex-1 h-px bg-gold/20" />
                  <Plane size={12} className="text-gold/70 mx-1.5 shrink-0" />
                  <div className="flex-1 h-px bg-gold/20" />
                </div>
                <div className="mt-1.5">
                  <StopsBadge stops={stops} />
                </div>
              </div>

              <div className="text-center shrink-0">
                <div className="text-2xl font-bold text-sand-light leading-none">{formatTime(lastSeg?.arriving_at)}</div>
                <div className="text-xs font-mono text-gold mt-0.5">{lastSeg?.destination?.iata_code}</div>
                <div className="text-[10px] text-sand-dark/50">{formatDate(lastSeg?.arriving_at)}</div>
              </div>
            </div>
          </div>

          {/* Return slice (compact) */}
          {inbound && (() => {
            const rf = inbound.segments?.[0];
            const rl = inbound.segments?.[inbound.segments.length - 1];
            const rs = (inbound.segments?.length ?? 1) - 1;
            return (
              <>
                <div className="hidden lg:block w-px h-12 bg-gold/10 shrink-0" />
                <div className="hidden lg:block shrink-0">
                  <div className="text-[10px] text-gold/50 uppercase mb-1">Return</div>
                  <div className="flex items-center gap-2">
                    <div className="text-center">
                      <div className="text-base font-bold text-sand-light/80 leading-none">{formatTime(rf?.departing_at)}</div>
                      <div className="text-[10px] font-mono text-gold/60">{rf?.origin?.iata_code}</div>
                    </div>
                    <div className="flex items-center gap-1 px-1">
                      <div className="w-6 h-px bg-gold/15" />
                      <Plane size={9} className="text-gold/40 shrink-0" />
                      <div className="w-6 h-px bg-gold/15" />
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-sand-light/80 leading-none">{formatTime(rl?.arriving_at)}</div>
                      <div className="text-[10px] font-mono text-gold/60">{rl?.destination?.iata_code}</div>
                    </div>
                    <div className="ml-1">
                      <StopsBadge stops={rs} />
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Price + CTA */}
          <div className="flex flex-col items-end gap-2 shrink-0 lg:w-36">
            <div className="text-right">
              <div className="text-2xl font-bold text-gold leading-none">
                {currency} {price}
              </div>
              <div className="text-xs text-sand-dark/50 mt-0.5">
                per person · {offer.passengers?.length || 1} pax
              </div>
            </div>
            <button onClick={onSelect} className="btn-gold text-sm px-5 py-2 w-full text-center rounded-lg">
              Select
            </button>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-gold/50 hover:text-gold flex items-center gap-1 transition-colors"
            >
              Flight details
              <ChevronDown size={11} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded segment details */}
      {expanded && (
        <div className="border-t border-gold/10 px-5 py-4 bg-nile-dark/40">
          {offer.slices?.map((slice: any, si: number) => (
            <div key={si} className={si > 0 ? 'mt-5 pt-5 border-t border-gold/10' : ''}>
              <div className="text-xs text-gold/50 uppercase tracking-widest mb-4">
                {si === 0 ? '✈ Outbound' : '↩ Return'} — {formatDuration(slice.duration)}
              </div>
              {slice.segments?.map((seg: any, idx: number) => (
                <div key={idx} className="flex items-start gap-4 mb-4 last:mb-0">
                  <div className="flex flex-col items-center shrink-0 pt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-gold border-2 border-nile-dark" />
                    {idx < slice.segments.length - 1 && (
                      <div className="w-px flex-1 bg-gold/20 my-1" style={{ minHeight: 28 }} />
                    )}
                    <div className="w-2.5 h-2.5 rounded-full bg-gold/40 border-2 border-nile-dark" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sand-light text-sm font-medium">
                          {seg.origin?.city_name} ({seg.origin?.iata_code})
                        </div>
                        <div className="text-sand-dark/50 text-xs mt-0.5">
                          Departs {formatTime(seg.departing_at)} · {formatDate(seg.departing_at)}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="text-sand-light text-sm font-medium">
                          {seg.destination?.city_name} ({seg.destination?.iata_code})
                        </div>
                        <div className="text-sand-dark/50 text-xs mt-0.5">
                          Arrives {formatTime(seg.arriving_at)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-1.5 text-xs text-sand-dark/50">
                      {seg.marketing_carrier?.name} · {seg.marketing_carrier_flight_number} ·{' '}
                      {formatDuration(seg.duration)}
                    </div>
                    {idx < slice.segments.length - 1 && (
                      <div className="mt-2 text-xs text-amber-400/80 bg-amber-950/30 border border-amber-800/30 px-2.5 py-1 rounded-md inline-block">
                        Layover at {seg.destination?.name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div className="mt-4 pt-3 border-t border-gold/10 text-xs text-sand-dark/50 flex flex-wrap gap-3">
            <span>
              Cabin:{' '}
              <span className="text-sand-light capitalize">
                {offer.passengers?.[0]?.cabin_class_marketing_name || 'Economy'}
              </span>
            </span>
            {offer.conditions?.refund_before_departure?.allowed === true && (
              <span className="text-emerald-400/80">Refundable</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Flights({ onNavigate }: FlightsProps) {
  const { offerRequestId, offers, flightSearch, setOffers, setSelectedOffer } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'duration'>('price');
  const [filterStops, setFilterStops] = useState<number | null>(null);
  const [filterAirline, setFilterAirline] = useState<string | null>(null);
  const [filterMaxPrice, setFilterMaxPrice] = useState<number>(999999);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    if (offerRequestId && offers.length === 0) fetchOffers();
  }, [offerRequestId]);

  const fetchOffers = async () => {
    if (!offerRequestId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/flights/offers?offer_request_id=${offerRequestId}`);
      setOffers(res.data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load flight offers');
    } finally {
      setLoading(false);
    }
  };

  const airlines = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    offers.forEach((o) => {
      const name = o.slices?.[0]?.segments?.[0]?.marketing_carrier?.name || o.owner?.name;
      if (name && !seen.has(name)) { seen.add(name); list.push(name); }
    });
    return list;
  }, [offers]);

  const maxPrice = useMemo(
    () => Math.ceil(Math.max(...offers.map((o) => parseFloat(o.total_amount) || 0), 5000)),
    [offers]
  );

  const filtered = useMemo(() => {
    let res = [...offers];
    if (filterStops !== null)
      res = res.filter((o) => (o.slices?.[0]?.segments?.length ?? 1) - 1 === filterStops);
    if (filterAirline)
      res = res.filter((o) => {
        const n = o.slices?.[0]?.segments?.[0]?.marketing_carrier?.name || o.owner?.name;
        return n === filterAirline;
      });
    if (filterMaxPrice < maxPrice)
      res = res.filter((o) => parseFloat(o.total_amount) <= filterMaxPrice);
    res.sort((a, b) => parseFloat(a.total_amount) - parseFloat(b.total_amount));
    return res;
  }, [offers, filterStops, filterAirline, filterMaxPrice, maxPrice]);

  const handleSelect = (offer: any) => {
    setSelectedOffer(offer);
    onNavigate('checkout');
  };

  const FiltersPanel = () => (
    <div className="glass-panel p-5 rounded-xl">
      <h3 className="text-gold font-serif mb-5 flex items-center gap-2 text-sm uppercase tracking-wider">
        <Filter size={14} /> Filters
      </h3>

      {/* Stops */}
      <div className="mb-6">
        <div className="text-xs text-gold/50 uppercase tracking-widest mb-3">Stops</div>
        {[null, 0, 1, 2].map((s) => (
          <label key={String(s)} className="flex items-center gap-2 py-1.5 cursor-pointer group">
            <input
              type="radio"
              name="stops"
              checked={filterStops === s}
              onChange={() => setFilterStops(s)}
              className="accent-gold"
            />
            <span className="text-sand-light text-sm group-hover:text-gold transition-colors">
              {s === null ? 'Any stops' : s === 0 ? 'Direct only' : `${s} stop${s > 1 ? 's' : ''}`}
            </span>
          </label>
        ))}
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="text-xs text-gold/50 uppercase tracking-widest mb-3">Max Price</div>
        <input
          type="range"
          min={0}
          max={maxPrice}
          value={filterMaxPrice >= maxPrice ? maxPrice : filterMaxPrice}
          onChange={(e) => setFilterMaxPrice(Number(e.target.value))}
          className="w-full accent-gold"
        />
        <div className="text-gold text-sm mt-2">
          Up to {filterMaxPrice >= maxPrice ? maxPrice : filterMaxPrice}{' '}
          {offers[0]?.total_currency || 'USD'}
        </div>
      </div>

      {/* Airlines */}
      {airlines.length > 0 && (
        <div>
          <div className="text-xs text-gold/50 uppercase tracking-widest mb-3">Airline</div>
          {[null, ...airlines].map((a) => (
            <label key={String(a)} className="flex items-center gap-2 py-1.5 cursor-pointer group">
              <input
                type="radio"
                name="airline"
                checked={filterAirline === a}
                onChange={() => setFilterAirline(a)}
                className="accent-gold"
              />
              <span className="text-sand-light text-sm group-hover:text-gold transition-colors">
                {a === null ? 'All airlines' : a}
              </span>
            </label>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => { setFilterStops(null); setFilterAirline(null); setFilterMaxPrice(999999); }}
        className="mt-5 text-xs text-gold/50 hover:text-gold transition-colors"
      >
        Reset filters
      </button>
    </div>
  );

  return (
    <div className="min-h-screen pt-4">
      {/* Search summary bar */}
      <div className="bg-nile-blue/70 border-b border-gold/10 py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-gold font-bold font-mono text-sm">{flightSearch.origin?.iata_code || '???'}</span>
            <Plane size={13} className="text-gold" />
            <span className="text-gold font-bold font-mono text-sm">{flightSearch.destination?.iata_code || '???'}</span>
          </div>
          <span className="text-sand-dark/60 text-sm">
            {flightSearch.departureDate}
            {flightSearch.returnDate && ` → ${flightSearch.returnDate}`}
          </span>
          <span className="text-sand-dark/60 text-sm capitalize">
            {flightSearch.passengers.adults + flightSearch.passengers.children + flightSearch.passengers.infants} pax ·{' '}
            {flightSearch.cabinClass.replace('_', ' ')}
          </span>
          <button
            onClick={() => onNavigate('home')}
            className="ml-auto btn-outline-gold text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <Search size={11} /> Modify Search
          </button>
          <button
            className="lg:hidden text-gold border border-gold/30 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <Filter size={11} /> Filters
          </button>
        </div>
      </div>

      {/* Mobile filters */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 z-40 flex items-end">
          <div className="absolute inset-0 bg-nile-dark/80" onClick={() => setShowMobileFilters(false)} />
          <div className="relative w-full bg-nile border-t border-gold/20 rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gold font-serif">Filters</span>
              <button onClick={() => setShowMobileFilters(false)}><X size={18} className="text-sand-dark" /></button>
            </div>
            <FiltersPanel />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar filters */}
          <div className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-24">
              <FiltersPanel />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Sort + count */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="text-sand-dark/70 text-sm">
                {loading ? 'Searching the skies...' : `${filtered.length} flights found`}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sand-dark/50 text-xs">Sort:</span>
                {[
                  { key: 'price', label: 'Cheapest' },
                  { key: 'duration', label: 'Fastest' },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSortBy(s.key as any)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      sortBy === s.key
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-gold/20 text-sand-dark hover:border-gold/40'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 size={44} className="text-gold animate-spin" />
                <p className="text-sand-dark/60 text-sm">Searching for the best fares...</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="glass-panel p-8 text-center rounded-xl">
                <AlertCircle size={40} className="text-rose-400 mx-auto mb-3" />
                <p className="text-rose-400 mb-5">{error}</p>
                <button onClick={() => onNavigate('home')} className="btn-gold text-sm">
                  New Search
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && filtered.length === 0 && (
              <div className="glass-panel p-14 text-center rounded-xl">
                <div className="text-5xl mb-4">✈️</div>
                <h3 className="text-gold font-serif text-xl mb-2">No flights found</h3>
                <p className="text-sand-dark/60 mb-6 text-sm">Try adjusting your filters or pick different dates</p>
                <button onClick={() => onNavigate('home')} className="btn-gold">
                  New Search
                </button>
              </div>
            )}

            {/* Flight cards */}
            <div className="space-y-3">
              {filtered.map((offer) => (
                <FlightCard key={offer.id} offer={offer} onSelect={() => handleSelect(offer)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
