import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Location01Icon,
  ArrowRight01Icon,
  Hospital01Icon,
  Stethoscope02Icon,
  Medicine01Icon,
  Target02Icon,
  Alert02Icon,
  Loading03Icon,
  Navigation01Icon,
} from 'hugeicons-react';
import { useSettings } from '../context/SettingsContext';
import { getCurrentPositionSafe } from '../services/sosService';
import {
  fetchNearbyPlaces,
  formatDistance,
  type Amenity,
  type Place,
} from '../services/overpassService';

interface NearbyCareCardProps {
  onOpen?: () => void;
}

const AMENITY_COLORS: Record<Amenity, string> = {
  hospital: '#ef4444',
  clinic: '#f59e0b',
  pharmacy: '#10b981',
};

const PREVIEW_PLACE_LIMIT = 8;
const LIST_PLACE_LIMIT = 3;

const amenityIcon = (a: Amenity, size = 12) => {
  const cls = 'shrink-0';
  if (a === 'hospital') return <Hospital01Icon size={size} className={cls} style={{ color: AMENITY_COLORS.hospital }} />;
  if (a === 'clinic') return <Stethoscope02Icon size={size} className={cls} style={{ color: AMENITY_COLORS.clinic }} />;
  return <Medicine01Icon size={size} className={cls} style={{ color: AMENITY_COLORS.pharmacy }} />;
};

const makeDivIcon = (color: string): L.DivIcon =>
  L.divIcon({
    className: 'pulse-amenity-marker',
    html: `<span style="
      display:block;width:14px;height:14px;border-radius:9999px;
      background:${color};border:2px solid #ffffff;
      box-shadow:0 1px 3px rgba(0,0,0,0.3);"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

export const NearbyCareCard: React.FC<NearbyCareCardProps> = ({ onOpen }) => {
  const { language } = useSettings();

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [denied, setDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState<Place[]>([]);
  const [error, setError] = useState(false);

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const placeLayerRef = useRef<L.LayerGroup | null>(null);

  const labels = (() => {
    if (language === 'hi') {
      return {
        title: 'पास के अस्पताल और क्लीनिक',
        subtitle: 'दवाइयाँ और आपातकालीन सुविधाएँ',
        openFull: 'नक्शा देखें',
        loading: 'स्थान ढूँढ रहे हैं…',
        denied: 'स्थान की अनुमति नहीं मिली',
        error: 'सुविधाएँ लोड नहीं हो सकीं',
        none: 'पास में कोई सुविधा नहीं मिली',
        chips: ['अस्पताल', 'क्लीनिक', 'दवा की दुकान'],
      };
    }
    return {
      title: 'Nearby Care Facilities',
      subtitle: 'Clinics, pharmacies, and emergency services',
      openFull: 'View map',
      loading: 'Finding location…',
      denied: 'Location access denied',
      error: 'Could not load facilities',
      none: 'No facilities found nearby',
      chips: ['Hospitals', 'Clinics', 'Pharmacies'],
    };
  })();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const pos = await getCurrentPositionSafe();
      if (cancelled) return;
      if (!pos) {
        setDenied(true);
        setLoading(false);
        return;
      }
      setCoords(pos);
      try {
        const found = await fetchNearbyPlaces(pos.lat, pos.lng);
        if (!cancelled) {
          setPlaces(found);
          setError(false);
        }
      } catch (err) {
        console.warn('NearbyCareCard: Overpass failed', err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapDivRef.current || mapInstanceRef.current || !coords) return;
    const map = L.map(mapDivRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.circleMarker([coords.lat, coords.lng], {
      radius: 6,
      fillColor: '#0D9488',
      color: '#ffffff',
      weight: 2,
      fillOpacity: 1,
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);
    placeLayerRef.current = layer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      placeLayerRef.current = null;
    };
  }, [coords]);

  useEffect(() => {
    const layer = placeLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    places.slice(0, PREVIEW_PLACE_LIMIT).forEach((p) => {
      L.marker([p.lat, p.lng], {
        icon: makeDivIcon(AMENITY_COLORS[p.amenity]),
        interactive: false,
        keyboard: false,
      }).addTo(layer);
    });
  }, [places]);

  const handleClick = () => {
    onOpen?.();
  };

  const top3 = places.slice(0, LIST_PLACE_LIMIT);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className="card-modern cursor-pointer transition-colors hover:border-primary/50 focus:outline-none focus:border-primary group"
    >
      {/* Header */}
      <div className="flex items-start gap-2.5 mb-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <Location01Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-foreground truncate">{labels.title}</div>
          <p className="text-[11px] text-muted-foreground truncate">
            {labels.subtitle}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-primary font-medium text-xs shrink-0 group-hover:translate-x-0.5 transition-transform">
          <span className="hidden sm:inline text-xs">{labels.openFull}</span>
          <ArrowRight01Icon size={14} />
        </span>
      </div>

      {/* Preview body */}
      {denied ? (
        <div className="bg-secondary/40 border border-dashed border-border rounded-lg p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0">
            <Target02Icon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-foreground">{labels.denied}</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Hospital01Icon size={12} className="text-destructive" />
                <span>{labels.chips[0]}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Stethoscope02Icon size={12} className="text-amber-500" />
                <span>{labels.chips[1]}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Medicine01Icon size={12} className="text-emerald-500" />
                <span>{labels.chips[2]}</span>
              </span>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-2.5 flex items-center gap-2">
          <Alert02Icon size={14} className="text-destructive shrink-0" />
          <span className="text-xs font-medium text-foreground">{labels.error}</span>
        </div>
      ) : (
        <>
          <div className="relative h-[130px] rounded-lg overflow-hidden border border-border bg-secondary">
            {(loading || !coords) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/80">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Loading03Icon size={14} className="animate-spin text-primary" />
                  <span className="text-xs font-medium">{labels.loading}</span>
                </div>
              </div>
            )}
            <div ref={mapDivRef} className="absolute inset-0" />
            <span className="absolute bottom-1 right-1.5 text-[9px] text-muted-foreground font-medium pointer-events-none bg-card/80 px-1 py-0.5 rounded">
              © OpenStreetMap
            </span>
          </div>

          {!loading && top3.length > 0 && (
            <ul className="mt-2 space-y-1">
              {top3.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-2 bg-secondary/30 border border-border rounded-lg px-2.5 py-1.5"
                >
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0 border"
                    style={{
                      background: `${AMENITY_COLORS[p.amenity]}1a`,
                      borderColor: `${AMENITY_COLORS[p.amenity]}40`,
                    }}
                  >
                    {amenityIcon(p.amenity, 11)}
                  </span>
                  <span className="flex-1 min-w-0 text-xs font-medium text-foreground truncate">
                    {p.name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary shrink-0">
                    <Navigation01Icon size={10} />
                    {formatDistance(p.distanceMeters)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {!loading && coords && top3.length === 0 && !error && (
            <div className="mt-2 text-center text-xs text-muted-foreground py-1">
              {labels.none}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NearbyCareCard;
