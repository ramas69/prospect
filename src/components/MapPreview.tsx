import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Circle, useMap, useMapEvents } from 'react-leaflet';
import { MapPin, Target, Trash2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface MapPreviewProps {
  onZoneSelect?: (data: { lat: number; lng: number; radius: number; googleMapsUrl: string; cityName?: string }) => void;
  initialCenter?: { lat: number; lng: number };
  searchTerm?: string;
  locationQuery?: string;
}

interface DrawingZone {
  center: { lat: number; lng: number };
  radius: number;
}

function DrawingControl({ onZoneCreated, hasZone }: { onZoneCreated: (zone: DrawingZone) => void; hasZone: boolean }) {
  const map = useMap();
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempRadius, setTempRadius] = useState(0);
  const centerMarkerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useMapEvents({
    click(e) {
      if (isDrawing) {
        if (!centerMarkerRef.current) {
          centerMarkerRef.current = L.marker(e.latlng, {
            icon: L.divIcon({
              className: 'custom-marker',
              html: '<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            })
          }).addTo(map);

          circleRef.current = L.circle(e.latlng, {
            radius: 100,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
            weight: 2
          }).addTo(map);
        } else {
          finishDrawing();
        }
      }
    },
    mousemove(e) {
      if (isDrawing && centerMarkerRef.current && circleRef.current) {
        const center = centerMarkerRef.current.getLatLng();
        const radius = center.distanceTo(e.latlng);
        circleRef.current.setRadius(radius);
        setTempRadius(radius);
      }
    }
  });

  const startDrawing = () => {
    setIsDrawing(true);
    map.getContainer().style.cursor = 'crosshair';
  };

  const finishDrawing = () => {
    if (centerMarkerRef.current && circleRef.current) {
      const center = centerMarkerRef.current.getLatLng();
      const radius = circleRef.current.getRadius();

      onZoneCreated({
        center: { lat: center.lat, lng: center.lng },
        radius
      });

      // Cleanup temporary drawing layers
      map.removeLayer(centerMarkerRef.current);
      map.removeLayer(circleRef.current);
      centerMarkerRef.current = null;
      circleRef.current = null;

      setIsDrawing(false);
      map.getContainer().style.cursor = '';
    }
  };

  const cancelDrawing = () => {
    if (centerMarkerRef.current) {
      map.removeLayer(centerMarkerRef.current);
      centerMarkerRef.current = null;
    }
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }
    setIsDrawing(false);
    setTempRadius(0);
    map.getContainer().style.cursor = '';
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ top: '20px', right: '20px' }}>
      <div className="leaflet-control border-0 shadow-none">
        {!isDrawing ? (
          <button
            onClick={startDrawing}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group ${!hasZone ? 'ring-2 ring-green-500/50 ring-offset-2 dark:ring-offset-gray-900' : ''}`}
            title="Dessiner une zone de recherche"
          >
            {!hasZone && (
              <span className="absolute -inset-3 rounded-full bg-green-400/30 animate-ping pointer-events-none" />
            )}
            <div className={`p-1.5 rounded-full transition-colors z-10 ${!hasZone ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50'}`}>
              <Target className={`w-4 h-4 ${!hasZone ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
            </div>
            <span className="z-10">Dessiner une zone</span>
          </button>
        ) : (
          <div className="flex flex-col gap-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 px-1 mb-1 text-center">
              {!centerMarkerRef.current ? (
                <span>📍 Placez le centre</span>
              ) : (
                <span>⭕ Rayon: {(tempRadius / 1000).toFixed(2)} km</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={finishDrawing}
                disabled={!centerMarkerRef.current}
                className="flex-1 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all active:scale-95"
              >
                Valider
              </button>
              <button
                onClick={cancelDrawing}
                className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-xl transition-colors"
                title="Annuler"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Fix for map tiles not loading fully when container resizes
function MapResizer() {
  const map = useMap();

  useEffect(() => {
    // Invalidate size after a short delay to ensure container has resized
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

function SearchControl({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
      setQuery(''); // Clear the input field
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="leaflet-top leaflet-left" style={{ top: '20px', left: '60px' }}>
      <div className="leaflet-control border-0 shadow-none">
        <div className="flex bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full shadow-lg overflow-hidden transition-all duration-300 focus-within:shadow-xl hover:bg-white dark:hover:bg-gray-800">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Rechercher une ville..."
            className="pl-5 pr-2 py-3 text-sm border-0 bg-transparent focus:outline-none dark:text-white placeholder-gray-400 w-[240px] transition-all"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="px-5 py-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-l border-gray-100 dark:border-gray-700/50"
          >
            Chercher
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MapPreview({ onZoneSelect, initialCenter, searchTerm, locationQuery }: MapPreviewProps) {
  const [center, setCenter] = useState<{ lat: number; lng: number }>(
    initialCenter || { lat: 48.8566, lng: 2.3522 }
  );
  const [cityName, setCityName] = useState<string | undefined>();
  const [zone, setZone] = useState<DrawingZone | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (locationQuery) {
      // Check if query is in "City (X km)" format to avoid unnecessary re-searches
      // which can cause map jumps if the format isn't understood by Nominatim
      const match = locationQuery.match(/^(.+?)\s\(\d+(\.\d+)?\s?km\)$/);
      const queryToSearch = match ? match[1] : locationQuery;

      // Only search if the city is different from current one
      // This prevents the map from resetting when we update the parent with the radius
      if (queryToSearch !== cityName) {
        handleSearch(queryToSearch);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationQuery]);

  const generateGoogleMapsUrl = (lat: number, lng: number, radiusMeters: number): string => {
    const radiusRounded = Math.round(radiusMeters);
    // Replace spaces with + for Google Maps format
    const formattedSearch = searchTerm
      ? searchTerm.trim().split(/\s+/).join('+')
      : 'search';

    return `https://www.google.com/maps/search/${formattedSearch}/@${lat},${lng},${radiusRounded}m/data=!3m2!1e3!4b1`;
  };

  useEffect(() => {
    if (zone && onZoneSelect) {
      const googleMapsUrl = generateGoogleMapsUrl(zone.center.lat, zone.center.lng, zone.radius);
      onZoneSelect({
        lat: zone.center.lat,
        lng: zone.center.lng,
        radius: zone.radius,
        googleMapsUrl,
        cityName: cityName // On renvoie le nom de la ville
      });
    }
  }, [searchTerm, zone, cityName]);

  const handleZoneCreated = (newZone: DrawingZone) => {
    setZone(newZone);
    const googleMapsUrl = generateGoogleMapsUrl(newZone.center.lat, newZone.center.lng, newZone.radius);

    if (onZoneSelect) {
      onZoneSelect({
        lat: newZone.center.lat,
        lng: newZone.center.lng,
        radius: newZone.radius,
        googleMapsUrl,
        cityName: cityName // On renvoie le nom de la ville
      });
    }
  };

  const handleClearZone = () => {
    setZone(null);
    if (onZoneSelect) {
      onZoneSelect({
        lat: center.lat,
        lng: center.lng,
        radius: 0,
        googleMapsUrl: ''
      });
    }
  };

  const handleSearch = async (query: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const newCenter = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        setCenter(newCenter);
        setCityName(query); // On mémorise le nom de la ville cherchée

        if (mapRef.current) {
          mapRef.current.setView([newCenter.lat, newCenter.lng], 13);
        }
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapResizer />
        <DrawingControl onZoneCreated={handleZoneCreated} hasZone={!!zone} />
        <SearchControl onSearch={handleSearch} />

        {/* Clear Button Overlay */}
        {zone && (
          <div className="leaflet-top leaflet-right" style={{ top: '80px', right: '20px' }}>
            <div className="leaflet-control border-0 shadow-none">
              <button
                onClick={handleClearZone}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full shadow-lg transition-all duration-300 animate-in slide-in-from-right-4"
                title="Effacer la zone"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Effacer</span>
              </button>
            </div>
          </div>
        )}

        {zone && (
          <Circle
            center={[zone.center.lat, zone.center.lng]}
            radius={zone.radius}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.2,
              weight: 2
            }}
          />
        )}
      </MapContainer>

      {/* Zone Info Overlay (Bottom Left) */}
      {zone && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] animate-in slide-in-from-bottom-6 duration-500">
          <div className="flex items-center gap-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-white/20">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 pr-4">
              <div className="p-1 bg-blue-100 rounded-full">
                <MapPin className="w-3 h-3 text-blue-600" />
              </div>
              <span className="font-mono font-medium">{zone.center.lat.toFixed(3)}, {zone.center.lng.toFixed(3)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 font-bold">
              <Target className="w-4 h-4 text-blue-600" />
              <span>{(zone.radius / 1000).toFixed(2)} km</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
