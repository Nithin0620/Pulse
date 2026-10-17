import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Location01Icon,
  Target02Icon,
  Call02Icon,
  Clock01Icon,
  Navigation01Icon,
  AlertCircleIcon,
  RotateLeft01Icon,
  Hospital01Icon,
  StethoscopeIcon,
  Medicine01Icon,
  Loading03Icon,
} from 'hugeicons-react';
import { useSettings } from '../context/SettingsContext';
import { getCurrentPositionSafe } from '../services/sosService';
import {
  fetchNearbyPlaces,
  formatDistance,
  type Amenity,
  type Place,
} from '../services/overpassService';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

type Filter = 'all' | Amenity;
type GeoStatus = 'idle' | 'requesting' | 'granted' | 'denied';

const AMENITY_COLORS: Record<Amenity, string> = {
  hospital: '#ef4444',
  clinic: '#0d9488',
  pharmacy: '#10b981',
};

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const directionsUrl = (lat: number, lng: number): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

const amenityIcon = (a: Amenity) => {
  const cls = 'shrink-0';
  if (a === 'hospital') return <Hospital01Icon size={16} className={cls} style={{ color: AMENITY_COLORS.hospital }} />;
  if (a === 'clinic') return <StethoscopeIcon size={16} className={cls} style={{ color: AMENITY_COLORS.clinic }} />;
  return <Medicine01Icon size={16} className={cls} style={{ color: AMENITY_COLORS.pharmacy }} />;
};

const makeDivIcon = (color: string): L.DivIcon =>
  L.divIcon({
    className: 'pulse-amenity-marker',
    html: `<span style="
      display:block;width:18px;height:18px;border-radius:9999px;
      background:${color};border:2.5px solid #ffffff;
      box-shadow:0 2px 5px rgba(0,0,0,0.3);"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });

export const NearbyCare: React.FC = () => {
  const { language } = useSettings();

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mapRef = useRef<L.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const placeLayerRef = useRef<L.LayerGroup | null>(null);
  const markersById = useRef<Map<string, L.Marker>>(new Map());

  const labels = useMemo(() => {
    if (language === 'hi') {
      return {
        title: 'पास की देखभाल',
        subtitle: 'आपके 5 किलोमीटर के दायरे में अस्पताल, क्लिनिक और फार्मेसी',
        locateMe: 'फिर से ढूँढें',
        loading: 'पास की जगहें ढूँढ रहे हैं…',
        denied: 'पास की देखभाल देखने के लिए लोकेशन चालू करें',
        retry: 'फिर कोशिश करें',
        error: 'परिणाम लोड नहीं हो सके — फिर कोशिश करने के लिए टैप करें',
        none: 'पास में कुछ नहीं मिला',
        all: 'सभी',
        hospital: 'अस्पताल',
        clinic: 'क्लिनिक',
        pharmacy: 'फार्मेसी',
        directions: 'दिशा-निर्देश',
        call: 'कॉल करें',
        count: (n: number) => `${n} जगहें मिलीं`,
      };
    }
    if (language === 'ta') {
      return {
        title: 'அருகிலுள்ள கவனிப்பு',
        subtitle: 'உங்களுக்கு 5 கி.மீ. தொலைவில் மருத்துவமனைகள், கிளினிக்குகள், மருந்தகங்கள்',
        locateMe: 'மீண்டும் கண்டுபிடி',
        loading: 'அருகிலுள்ள இடங்களைக் கண்டறிகிறோம்…',
        denied: 'அருகிலுள்ள கவனிப்பைக் காண இடத்தை இயக்கவும்',
        retry: 'மீண்டும் முயற்சிக்கவும்',
        error: 'முடிவுகளை ஏற்ற முடியவில்லை — மீண்டும் முயற்சிக்க தட்டவும்',
        none: 'அருகில் எதுவும் கிடைக்கவில்லை',
        all: 'அனைத்தும்',
        hospital: 'மருத்துவமனைகள்',
        clinic: 'கிளினிக்குகள்',
        pharmacy: 'மருந்தகங்கள்',
        directions: 'வழிகாட்டு',
        call: 'அழை',
        count: (n: number) => `${n} இடங்கள் கிடைத்தன`,
      };
    }
    return {
      title: 'Nearby Care',
      subtitle: 'Hospitals, clinics & pharmacies within 5 km of you',
      locateMe: 'Locate me',
      loading: 'Finding nearby places…',
      denied: 'Enable location to find nearby care',
      retry: 'Try again',
      error: 'Could not load results — tap to retry',
      none: 'No places found nearby',
      all: 'All',
      hospital: 'Hospitals',
      clinic: 'Clinics',
      pharmacy: 'Pharmacies',
      directions: 'Get Directions',
      call: 'Call',
      count: (n: number) => `${n} places found`,
    };
  }, [language]);

  /* ===== Geolocation ===== */
  const requestLocation = useCallback(async () => {
    setGeoStatus('requesting');
    setError(null);
    const pos = await getCurrentPositionSafe();
    if (!pos) {
      setGeoStatus('denied');
      setCoords(null);
      return;
    }
    setGeoStatus('granted');
    setCoords(pos);
  }, []);

  useEffect(() => {
    void requestLocation();
  }, [requestLocation]);

  /* ===== Overpass fetch ===== */
  useEffect(() => {
    if (!coords) return;
    const ac = new AbortController();
    const myLat = coords.lat;
    const myLng = coords.lng;

    setLoading(true);
    setError(null);
    fetchNearbyPlaces(myLat, myLng, ac.signal)
      .then((res) => {
        if (ac.signal.aborted) return;
        setPlaces(res);
      })
      .catch((err) => {
        if (ac.signal.aborted) return;
        console.warn('[NearbyCare] overpass failed', err);
        setError(labels.error);
        setPlaces([]);
      })
      .finally(() => {
        if (ac.signal.aborted) return;
        setLoading(false);
      });

    return () => ac.abort();
  }, [coords, labels.error]);

  /* ===== Map init / teardown ===== */
  useEffect(() => {
    if (!coords || !mapDivRef.current) return;
    if (mapRef.current) {
      mapRef.current.setView([coords.lat, coords.lng], 14);
      userMarkerRef.current?.setLatLng([coords.lat, coords.lng]);
      return;
    }

    const map = L.map(mapDivRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 14,
      scrollWheelZoom: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    userMarkerRef.current = L.circleMarker([coords.lat, coords.lng], {
      radius: 8,
      color: '#0d9488',
      fillColor: '#0d9488',
      fillOpacity: 0.8,
      weight: 2.5,
    }).addTo(map);

    placeLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
      placeLayerRef.current = null;
      markersById.current.clear();
    };
  }, [coords]);

  /* ===== Markers ===== */
  useEffect(() => {
    const layer = placeLayerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    layer.clearLayers();
    markersById.current.clear();

    const filtered = filter === 'all' ? places : places.filter((p) => p.amenity === filter);

    filtered.forEach((p) => {
      const marker = L.marker([p.lat, p.lng], {
        icon: makeDivIcon(AMENITY_COLORS[p.amenity]),
      });

      const phoneRow = p.phone
        ? `<div style="margin-top:4px;font-size:12px;">
             <a href="tel:${escapeHtml(p.phone)}" style="color:#0d9488;text-decoration:none;font-weight:600;">
               ${escapeHtml(p.phone)}
             </a>
           </div>`
        : '';
      const hoursRow = p.openingHours
        ? `<div style="margin-top:3px;font-size:11px;color:#64748b;">${escapeHtml(p.openingHours)}</div>`
        : '';

      marker.bindPopup(
        `<div style="min-width:180px;font-family:inherit;">
           <div style="font-weight:600;font-size:13px;color:#0f172a;line-height:1.3;">
             ${escapeHtml(p.name)}
           </div>
           <div style="margin-top:3px;font-size:11px;color:#0d9488;font-weight:600;">
             ${formatDistance(p.distanceMeters)}
           </div>
           ${phoneRow}
           ${hoursRow}
           <a href="${directionsUrl(p.lat, p.lng)}" target="_blank" rel="noopener noreferrer"
              style="display:inline-block;margin-top:8px;padding:6px 10px;background:#0d9488;color:#ffffff;
                     font-weight:600;font-size:11px;border-radius:6px;text-decoration:none;">
             ${escapeHtml(labels.directions)}
           </a>
         </div>`,
        { maxWidth: 260 }
      );

      marker.on('click', () => setSelectedId(p.id));
      marker.addTo(layer);
      markersById.current.set(p.id, marker);
    });
  }, [places, filter, labels.directions]);

  const handleSelectFromList = useCallback((p: Place) => {
    setSelectedId(p.id);
    const map = mapRef.current;
    if (!map) return;
    map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
    const m = markersById.current.get(p.id);
    if (m) {
      window.setTimeout(() => m.openPopup(), 350);
    }
  }, []);

  const filteredPlaces = useMemo(
    () => (filter === 'all' ? places : places.filter((p) => p.amenity === filter)),
    [places, filter]
  );

  const filterChips: { id: Filter; label: string; color?: string }[] = [
    { id: 'all', label: labels.all },
    { id: 'hospital', label: labels.hospital, color: AMENITY_COLORS.hospital },
    { id: 'clinic', label: labels.clinic, color: AMENITY_COLORS.clinic },
    { id: 'pharmacy', label: labels.pharmacy, color: AMENITY_COLORS.pharmacy },
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Location01Icon size={26} className="text-teal-600 dark:text-teal-400" />
            <span>{labels.title}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{labels.subtitle}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={requestLocation}
          disabled={geoStatus === 'requesting' || loading}
          className="gap-2 self-start sm:self-auto h-9 text-xs"
        >
          {geoStatus === 'requesting' ? (
            <Loading03Icon size={14} className="animate-spin text-teal-600" />
          ) : (
            <Target02Icon size={14} />
          )}
          <span>{labels.locateMe}</span>
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {filterChips.map((chip) => {
          const isActive = filter === chip.id;
          return (
            <Button
              key={chip.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(chip.id)}
              className={`h-8 text-xs gap-1.5 ${
                isActive ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''
              }`}
            >
              {chip.color && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: chip.color }}
                />
              )}
              <span>{chip.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Denied state */}
      {geoStatus === 'denied' && (
        <Card className="text-center py-10">
          <CardContent className="p-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
              <AlertCircleIcon size={22} />
            </div>
            <p className="text-sm font-medium text-foreground">{labels.denied}</p>
            <Button
              onClick={requestLocation}
              size="sm"
              className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white h-9 text-xs"
            >
              <Target02Icon size={14} />
              <span>{labels.locateMe}</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Map */}
      {geoStatus !== 'denied' && (
        <div className="relative rounded-lg overflow-hidden border border-border bg-card h-[280px] sm:h-[380px] lg:h-[460px]">
          {!coords && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground z-10 bg-background/60 backdrop-blur-[1px]">
              <div className="flex items-center gap-2 text-xs">
                <Loading03Icon size={16} className="animate-spin text-teal-600" />
                <span>{labels.loading}</span>
              </div>
            </div>
          )}
          <div ref={mapDivRef} className="absolute inset-0" />
        </div>
      )}

      {/* Count line */}
      {coords && !loading && !error && places.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <Badge variant="outline" className="text-[11px] font-normal">
            {labels.count(filteredPlaces.length)}
          </Badge>
          <span className="text-[11px]">Map data © OpenStreetMap</span>
        </div>
      )}

      {/* Error state */}
      {error && coords && (
        <Card
          onClick={() => setCoords({ ...coords })}
          className="cursor-pointer border-destructive/30 hover:border-destructive/50 transition-colors p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircleIcon size={18} className="text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-xs font-medium text-foreground">{error}</div>
              <div className="text-xs text-destructive font-medium mt-1 inline-flex items-center gap-1">
                <RotateLeft01Icon size={11} />
                <span>{labels.retry}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Results list */}
      {!loading && !error && coords && filteredPlaces.length > 0 && (
        <div className="space-y-2">
          {filteredPlaces.map((p) => {
            const isSelected = selectedId === p.id;
            return (
              <Card
                key={p.id}
                className={`transition-colors text-left ${
                  isSelected ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20' : 'hover:border-border/80'
                }`}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <button
                      onClick={() => handleSelectFromList(p)}
                      className="flex items-start gap-3 flex-1 min-w-0 text-left"
                    >
                      <div
                        className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 border"
                        style={{
                          background: `${AMENITY_COLORS[p.amenity]}15`,
                          borderColor: `${AMENITY_COLORS[p.amenity]}40`,
                        }}
                      >
                        {amenityIcon(p.amenity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {p.name}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-medium">
                            <Navigation01Icon size={11} />
                            {formatDistance(p.distanceMeters)}
                          </span>
                          {p.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Call02Icon size={11} />
                              <span className="truncate max-w-[150px]">{p.phone}</span>
                            </span>
                          )}
                          {p.openingHours && (
                            <span className="inline-flex items-center gap-1">
                              <Clock01Icon size={11} />
                              <span className="truncate max-w-[180px]">{p.openingHours}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      {p.phone && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                        >
                          <a href={`tel:${p.phone}`}>
                            <Call02Icon size={12} />
                            <span>{labels.call}</span>
                          </a>
                        </Button>
                      )}
                      <Button
                        asChild
                        size="sm"
                        className="h-8 text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        <a
                          href={directionsUrl(p.lat, p.lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Navigation01Icon size={12} />
                          <span>{labels.directions}</span>
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && coords && filteredPlaces.length === 0 && (
        <Card className="text-center py-8">
          <Location01Icon size={26} className="mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">{labels.none}</p>
        </Card>
      )}
    </div>
  );
};

export default NearbyCare;
