import { forwardRef, useState } from 'react';
import CropValidationForm from './CropValidationForm';
import GoogleMapComponent from './GoogleMap';

const FormAndMapSection = forwardRef(({ onSubmit, loading, error, onErrorChange, token }, ref) => {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const handleCoordinatesChange = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleMapMarkerDrag = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleMapClick = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  return (
    <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Left: Form */}
      <CropValidationForm
        onSubmit={onSubmit}
        loading={loading}
        error={error}
        onErrorChange={onErrorChange}
        latitude={latitude}
        longitude={longitude}
        onCoordinatesChange={handleCoordinatesChange}
        token={token}
      />

      {/* Right: Map */}
      <GoogleMapComponent
        latitude={latitude}
        longitude={longitude}
        onMarkerDragEnd={handleMapMarkerDrag}
        onMapClick={handleMapClick}
        apiKey={googleMapsApiKey}
      />
    </div>
    
  );
});

FormAndMapSection.displayName = 'FormAndMapSection';

export default FormAndMapSection;

