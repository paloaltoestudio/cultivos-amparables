import { useCallback, useRef, useEffect, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const getContainerStyle = () => ({
  width: '100%',
  height: '300px', // Default mobile height
  borderRadius: '0.5rem',
});

// For desktop, we'll use CSS to override
const containerStyleDesktop = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem',
};

const defaultCenter = {
  lat: 4.570868, // Colombia center
  lng: -74.297333,
};

function GoogleMapComponent({ 
  latitude, 
  longitude, 
  onMarkerDragEnd,
  onMapClick,
  apiKey 
}) {
  // All hooks must be declared before any conditional returns
  const mapRef = useRef(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [mapHeight, setMapHeight] = useState('300px');
  const lastLatRef = useRef(null);
  const lastLngRef = useRef(null);
  const isDraggingRef = useRef(false);
  const isMapClickRef = useRef(false);

  // Handle responsive map height
  useEffect(() => {
    const updateMapHeight = () => {
      setMapHeight(window.innerWidth >= 640 ? '400px' : '300px');
    };
    
    updateMapHeight();
    window.addEventListener('resize', updateMapHeight);
    
    return () => window.removeEventListener('resize', updateMapHeight);
  }, []);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
  });

  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleDragEnd = useCallback((e) => {
    if (onMarkerDragEnd) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      // Update marker position immediately without recentering
      setMarkerPosition({ lat, lng });
      lastLatRef.current = lat;
      lastLngRef.current = lng;
      // Mark that we're updating from a drag
      isDraggingRef.current = true;
      onMarkerDragEnd(lat, lng);
      // Reset drag flag after a short delay
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 100);
    }
  }, [onMarkerDragEnd]);

  const handleMapClick = useCallback((e) => {
    if (onMapClick) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      // Update marker position immediately without recentering
      setMarkerPosition({ lat, lng });
      lastLatRef.current = lat;
      lastLngRef.current = lng;
      // Mark that we're updating from a map click
      isMapClickRef.current = true;
      onMapClick(lat, lng);
      // Reset map click flag after a short delay
      setTimeout(() => {
        isMapClickRef.current = false;
      }, 100);
    }
  }, [onMapClick]);

  // Update center and marker position only when coordinates actually change
  // Don't recenter if the change came from a marker drag
  useEffect(() => {
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        // Only update if coordinates actually changed
        const latChanged = lastLatRef.current !== lat;
        const lngChanged = lastLngRef.current !== lng;
        
        if (latChanged || lngChanged) {
          lastLatRef.current = lat;
          lastLngRef.current = lng;
          
          const newMarker = { lat, lng };
          
          // Only update map center if the change didn't come from a drag or map click
          if (!isDraggingRef.current && !isMapClickRef.current) {
            const newCenter = { lat, lng };
            setMapCenter(newCenter);
          }
          
          // Always update marker position
          setMarkerPosition(newMarker);
        }
      }
    } else {
      if (lastLatRef.current !== null || lastLngRef.current !== null) {
        lastLatRef.current = null;
        lastLngRef.current = null;
        setMapCenter(defaultCenter);
        setMarkerPosition(null);
      }
    }
  }, [latitude, longitude]);

  const hasMarker = markerPosition !== null;

  if (!isLoaded) {
    return (
      <div className="bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
        <div className="text-center text-gray-500">
          <p className="text-sm">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 rounded-lg border border-gray-300 overflow-hidden min-h-[300px] sm:min-h-[400px]">
      <GoogleMap
        mapContainerStyle={{
          width: '100%',
          height: mapHeight,
          borderRadius: '0.5rem',
        }}
        center={mapCenter}
        zoom={hasMarker ? 15 : 6}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick ? handleMapClick : undefined}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          mapTypeId: 'hybrid',
        }}
      >
        {hasMarker && markerPosition && (
          <Marker
            position={markerPosition}
            draggable={true}
            onDragEnd={handleDragEnd}
          />
        )}
      </GoogleMap>
    </div>
  );
}

export default GoogleMapComponent;

