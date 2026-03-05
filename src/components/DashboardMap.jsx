import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

const COLOMBIA_CENTER = { lat: 4.570868, lng: -74.297333 };
const DEFAULT_ZOOM = 5;

// Distinct palette that reads well on hybrid/satellite maps
const CROP_PALETTE = [
  '#e74c3c', // red
  '#3498db', // blue
  '#2ecc71', // green
  '#f39c12', // orange
  '#9b59b6', // purple
  '#1abc9c', // teal
  '#e67e22', // dark orange
  '#e91e63', // pink
  '#00bcd4', // cyan
  '#8bc34a', // lime
  '#ff5722', // deep orange
  '#607d8b', // blue-grey
];

/** Deterministic color per crop name (same crop always gets same color). */
function colorForCrop(cultivo) {
  if (!cultivo) return CROP_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < cultivo.length; i++) {
    hash = cultivo.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CROP_PALETTE[Math.abs(hash) % CROP_PALETTE.length];
}

/** SVG circle icon as a data URI — requires window.google to be loaded for Size/Point. */
function makeMarkerIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
    <circle cx="9" cy="9" r="8" fill="${color}" stroke="white" stroke-width="2"/>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(18, 18),
    anchor: new window.google.maps.Point(9, 9),
  };
}

function formatValue(value) {
  if (value == null || value === '') return '—';
  return String(value);
}

function InfoTooltipContent({ point }) {
  const rows = [
    { label: 'Aptitud', value: point.aptitud },
    { label: 'Humedal', value: point.humedal },
    { label: 'Límite agrícola', value: point.limite_agricola },
    { label: 'Páramo', value: point.paramo },
    { label: 'Parque natural', value: point.parque_natural },
    { label: 'POT', value: point.pot },
    { label: 'Reserva forestal', value: point.reserva_forestal },
    { label: 'Amparable', value: point.amparable ? 'Sí' : 'No' },
  ];

  return (
    <div style={{ minWidth: 200, maxWidth: 280, padding: 4 }}>
      <div style={{ fontWeight: 600, fontSize: 13, borderBottom: '1px solid #e5e7eb', paddingBottom: 4, marginBottom: 8 }}>
        {formatValue(point.cultivo)}
      </div>
      {rows.map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4, fontSize: 12 }}>
          <span style={{ color: '#6b7280' }}>{label}:</span>
          <span style={{ fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={formatValue(value)}>
            {formatValue(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function DashboardMap({ apiKey, markers = [], className = '' }) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  // Always hold the latest validMarkers so onMapLoad can access them without stale closure
  const validMarkersRef = useRef([]);

  // Derive unique crops from the raw markers list (not filtered) so legend is complete
  const cropLegend = useMemo(() => {
    if (!Array.isArray(markers)) return [];
    const crops = [...new Set(markers.map((m) => m.cultivo).filter(Boolean))].sort();
    return crops.map((c) => ({ cultivo: c, color: colorForCrop(c) }));
  }, [markers]);

  const { isLoaded } = useJsApiLoader({
    // Same id as the form map so the script is only loaded once per session
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
  });

  const validMarkers = useMemo(() => {
    if (!Array.isArray(markers)) return [];
    return markers
      .map((m) => ({
        ...m,
        _lat: Number(m.latitud),
        _lng: Number(m.longitud),
      }))
      .filter((m) => Number.isFinite(m._lat) && Number.isFinite(m._lng))
      // Filter out clearly invalid coordinates (e.g. lat=74 which is outside Colombia)
      .filter((m) => m._lat >= -5 && m._lat <= 13 && m._lng >= -82 && m._lng <= -66);
  }, [markers]);

  // Keep ref in sync every render so onMapLoad always sees the latest list
  validMarkersRef.current = validMarkers;

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  }, []);

  const drawMarkers = useCallback(
    (map, points) => {
      clearMarkers();
      points.forEach((point) => {
        const gMarker = new window.google.maps.Marker({
          position: { lat: point._lat, lng: point._lng },
          map,
          title: point.cultivo ?? '',
          icon: makeMarkerIcon(colorForCrop(point.cultivo)),
        });
        gMarker.addListener('click', () => setSelectedPoint({ ...point }));
        markersRef.current.push(gMarker);
      });
    },
    [clearMarkers]
  );

  // Called once when the GoogleMap instance is ready
  const onMapLoad = useCallback(
    (map) => {
      mapRef.current = map;
      // Draw whatever markers are available right now
      drawMarkers(map, validMarkersRef.current);
    },
    [drawMarkers]
  );

  // Redraw whenever the data changes (e.g. after a filter change)
  useEffect(() => {
    if (mapRef.current && isLoaded) {
      drawMarkers(mapRef.current, validMarkers);
    }
  }, [validMarkers, isLoaded, drawMarkers]);

  // Clean up all markers when the component unmounts
  useEffect(() => {
    return () => clearMarkers();
  }, [clearMarkers]);

  const onInfoClose = useCallback(() => setSelectedPoint(null), []);

  if (!apiKey) {
    return (
      <div
        className={`rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center ${className}`}
        style={{ minHeight: 320 }}
      >
        <p className="text-sm text-gray-500">Configura VITE_GOOGLE_MAPS_API_KEY para ver el mapa.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center ${className}`}
        style={{ minHeight: 320 }}
      >
        <p className="text-sm text-gray-500">Cargando mapa...</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="rounded-lg overflow-hidden border border-gray-200" style={{ minHeight: 320 }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: 320 }}
        center={COLOMBIA_CENTER}
        zoom={DEFAULT_ZOOM}
        onLoad={onMapLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          mapTypeId: 'hybrid',
        }}
      >
        {selectedPoint && (
          <InfoWindow
            position={{ lat: selectedPoint._lat, lng: selectedPoint._lng }}
            onCloseClick={onInfoClose}
          >
            <InfoTooltipContent point={selectedPoint} />
          </InfoWindow>
        )}
      </GoogleMap>
      </div>

      {cropLegend.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-1">
          {cropLegend.map(({ cultivo, color }) => (
            <div key={cultivo} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span
                className="inline-block rounded-full flex-shrink-0"
                style={{ width: 10, height: 10, backgroundColor: color }}
              />
              {cultivo}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DashboardMap;
