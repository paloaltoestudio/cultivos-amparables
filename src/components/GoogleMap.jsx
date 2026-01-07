import { useCallback, useRef, useEffect, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
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
  const lastLatRef = useRef(null);
  const lastLngRef = useRef(null);

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
      onMarkerDragEnd(lat, lng);
    }
  }, [onMarkerDragEnd]);

  const handleMapClick = useCallback((e) => {
    if (onMapClick) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      onMapClick(lat, lng);
    }
  }, [onMapClick]);

  // Update center and marker position only when coordinates actually change
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
          
          const newCenter = { lat, lng };
          const newMarker = { lat, lng };
          
          setMapCenter(newCenter);
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
      <div className="bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center min-h-[400px]">
        <div className="text-center text-gray-500">
          <p className="text-sm">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 rounded-lg border border-gray-300 overflow-hidden min-h-[400px]">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={hasMarker ? 15 : 6}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick ? handleMapClick : undefined}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
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

