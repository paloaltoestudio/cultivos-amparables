import { useCallback, useRef } from 'react';
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
  const mapRef = useRef(null);

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

  if (!isLoaded) {
    return (
      <div className="bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center min-h-[400px]">
        <div className="text-center text-gray-500">
          <p className="text-sm">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  const center = latitude && longitude 
    ? { lat: parseFloat(latitude), lng: parseFloat(longitude) }
    : defaultCenter;

  const hasMarker = latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude));

  return (
    <div className="bg-gray-100 rounded-lg border border-gray-300 overflow-hidden min-h-[400px]">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
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
        {hasMarker && (
          <Marker
            position={{ lat: parseFloat(latitude), lng: parseFloat(longitude) }}
            draggable={true}
            onDragEnd={handleDragEnd}
          />
        )}
      </GoogleMap>
    </div>
  );
}

export default GoogleMapComponent;

