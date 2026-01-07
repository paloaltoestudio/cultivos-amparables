import { useState, useEffect } from 'react';

function CropValidationForm({ 
  onSubmit, 
  loading = false, 
  error: externalError = '', 
  onErrorChange,
  latitude: externalLatitude = '',
  longitude: externalLongitude = '',
  onCoordinatesChange
}) {
  const [coordinateFormat, setCoordinateFormat] = useState('decimal');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [cropCode, setCropCode] = useState('');
  const [error, setError] = useState('');
  
  // DMS state
  const [latDegrees, setLatDegrees] = useState('');
  const [latMinutes, setLatMinutes] = useState('');
  const [latSeconds, setLatSeconds] = useState('');
  const [latDirection, setLatDirection] = useState('N');
  const [longDegrees, setLongDegrees] = useState('');
  const [longMinutes, setLongMinutes] = useState('');
  const [longSeconds, setLongSeconds] = useState('');
  const [longDirection, setLongDirection] = useState('E');

  // Update form when external coordinates change (from map)
  useEffect(() => {
    if (externalLatitude && externalLongitude) {
      if (coordinateFormat === 'decimal') {
        setLatitude(externalLatitude.toString());
        setLongitude(externalLongitude.toString());
      } else {
        // Convert decimal to DMS
        const latDMS = decimalToDMS(Math.abs(externalLatitude));
        const lngDMS = decimalToDMS(Math.abs(externalLongitude));
        
        setLatDegrees(latDMS.degrees.toString());
        setLatMinutes(latDMS.minutes.toString());
        setLatSeconds(latDMS.seconds.toFixed(2));
        setLatDirection(externalLatitude >= 0 ? 'N' : 'S');
        
        setLongDegrees(lngDMS.degrees.toString());
        setLongMinutes(lngDMS.minutes.toString());
        setLongSeconds(lngDMS.seconds.toFixed(2));
        setLongDirection(externalLongitude >= 0 ? 'E' : 'W');
      }
    }
  }, [externalLatitude, externalLongitude, coordinateFormat]);

  // Update map when DMS values change
  useEffect(() => {
    if (coordinateFormat === 'dms' && onCoordinatesChange) {
      if (latDegrees && latMinutes && latSeconds && longDegrees && longMinutes && longSeconds) {
        const lat = dmsToDecimal(latDegrees, latMinutes, latSeconds, latDirection);
        const lng = dmsToDecimal(longDegrees, longMinutes, longSeconds, longDirection);
        if (!isNaN(lat) && !isNaN(lng)) {
          onCoordinatesChange(lat, lng);
        }
      }
    }
  }, [latDegrees, latMinutes, latSeconds, latDirection, longDegrees, longMinutes, longSeconds, longDirection, coordinateFormat, onCoordinatesChange]);

  // Convert DMS to decimal degrees
  const dmsToDecimal = (degrees, minutes, seconds, direction) => {
    const deg = parseFloat(degrees) || 0;
    const min = parseFloat(minutes) || 0;
    const sec = parseFloat(seconds) || 0;
    
    let decimal = deg + (min / 60) + (sec / 3600);
    
    if (direction === 'S' || direction === 'W') {
      decimal = -decimal;
    }
    
    return decimal;
  };

  // Convert decimal to DMS
  const decimalToDMS = (decimal) => {
    const deg = Math.floor(decimal);
    const minFloat = (decimal - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = (minFloat - min) * 60;
    
    return { degrees: deg, minutes: min, seconds: sec };
  };

  const clearForm = () => {
    if (coordinateFormat === 'dms') {
      setLatDegrees('');
      setLatMinutes('');
      setLatSeconds('');
      setLatDirection('N');
      setLongDegrees('');
      setLongMinutes('');
      setLongSeconds('');
      setLongDirection('E');
    } else {
      setLatitude('');
      setLongitude('');
    }
    setCropCode('');
    setError('');
    if (onErrorChange) {
      onErrorChange('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (onErrorChange) {
      onErrorChange('');
    }

    let finalLatitude, finalLongitude;

    if (coordinateFormat === 'dms') {
      // Validate DMS inputs
      if (!latDegrees || !latMinutes || !latSeconds || !longDegrees || !longMinutes || !longSeconds || !cropCode) {
        const errorMsg = 'Por favor, complete todos los campos';
        setError(errorMsg);
        if (onErrorChange) {
          onErrorChange(errorMsg);
        }
        return;
      }

      // Convert DMS to decimal
      finalLatitude = dmsToDecimal(latDegrees, latMinutes, latSeconds, latDirection);
      finalLongitude = dmsToDecimal(longDegrees, longMinutes, longSeconds, longDirection);

      // Validate conversion
      if (isNaN(finalLatitude) || isNaN(finalLongitude)) {
        const errorMsg = 'Por favor, ingrese valores numéricos válidos';
        setError(errorMsg);
        if (onErrorChange) {
          onErrorChange(errorMsg);
        }
        return;
      }

      // Validate ranges
      if (Math.abs(finalLatitude) > 90 || Math.abs(finalLongitude) > 180) {
        const errorMsg = 'Las coordenadas están fuera del rango válido';
        setError(errorMsg);
        if (onErrorChange) {
          onErrorChange(errorMsg);
        }
        return;
      }
    } else {
      // Validate decimal inputs
      if (!latitude || !longitude || !cropCode) {
        const errorMsg = 'Por favor, complete todos los campos';
        setError(errorMsg);
        if (onErrorChange) {
          onErrorChange(errorMsg);
        }
        return;
      }

      finalLatitude = parseFloat(latitude);
      finalLongitude = parseFloat(longitude);

      if (isNaN(finalLatitude) || isNaN(finalLongitude)) {
        const errorMsg = 'Por favor, ingrese valores numéricos válidos';
        setError(errorMsg);
        if (onErrorChange) {
          onErrorChange(errorMsg);
        }
        return;
      }
    }

    const numCropCode = parseInt(cropCode);
    if (isNaN(numCropCode)) {
      const errorMsg = 'Por favor, ingrese un código de cultivo válido';
      setError(errorMsg);
      if (onErrorChange) {
        onErrorChange(errorMsg);
      }
      return;
    }

    // Call parent's onSubmit callback with validated data
    const result = await onSubmit({
      latitude: finalLatitude,
      longitude: finalLongitude,
      cropCode: numCropCode,
    });

    // If onSubmit returns true, clear the form
    if (result === true) {
      clearForm();
    }
  };

  const handleFormatToggle = () => {
    setCoordinateFormat(coordinateFormat === 'decimal' ? 'dms' : 'decimal');
    setError('');
    if (onErrorChange) {
      onErrorChange('');
    }
  };

  // Display external error if provided, otherwise internal error
  const displayError = externalError || error;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {displayError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-full text-sm border border-red-200">
            {displayError}
          </div>
        )}

        <div className="space-y-4">
          {/* Decimal Format (Default) */}
          {coordinateFormat === 'decimal' && (
            <>
                  <div>
                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                      Latitud
                    </label>
                    <input
                      id="latitude"
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => {
                        setLatitude(e.target.value);
                        if (onCoordinatesChange && e.target.value && longitude) {
                          onCoordinatesChange(parseFloat(e.target.value), parseFloat(longitude));
                        }
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        if (onCoordinatesChange && e.target.value && longitude) {
                          const lat = parseFloat(e.target.value);
                          const lng = parseFloat(longitude);
                          if (!isNaN(lat) && !isNaN(lng)) {
                            onCoordinatesChange(lat, lng);
                          }
                        }
                      }}
                      required
                      placeholder="Latitud"
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-full text-base focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      style={{ '--tw-ring-color': '#3DAF2D' }}
                      onFocus={(e) => e.target.style.borderColor = '#3DAF2D'}
                    />
                  </div>

                  <div>
                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                      Longitud
                    </label>
                    <input
                      id="longitude"
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => {
                        setLongitude(e.target.value);
                        if (onCoordinatesChange && latitude && e.target.value) {
                          onCoordinatesChange(parseFloat(latitude), parseFloat(e.target.value));
                        }
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        if (onCoordinatesChange && latitude && e.target.value) {
                          const lat = parseFloat(latitude);
                          const lng = parseFloat(e.target.value);
                          if (!isNaN(lat) && !isNaN(lng)) {
                            onCoordinatesChange(lat, lng);
                          }
                        }
                      }}
                      required
                      placeholder="Longitud"
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-full text-base focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      style={{ '--tw-ring-color': '#3DAF2D' }}
                      onFocus={(e) => e.target.style.borderColor = '#3DAF2D'}
                    />
                  </div>
            </>
          )}

          {/* DMS Format */}
          {coordinateFormat === 'dms' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitud (Grados, Minutos, Segundos)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="number"
                    value={latDegrees}
                    onChange={(e) => setLatDegrees(e.target.value)}
                    required
                    placeholder="Grados"
                    min="0"
                    max="90"
                    disabled={loading}
                    className="px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    onFocus={(e) => e.target.style.borderColor = '#3DAF2D'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <input
                    type="number"
                    value={latMinutes}
                    onChange={(e) => setLatMinutes(e.target.value)}
                    required
                    placeholder="Minutos"
                    min="0"
                    max="59"
                    disabled={loading}
                    className="px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    onFocus={(e) => e.target.style.borderColor = '#3DAF2D'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <input
                    type="number"
                    step="any"
                    value={latSeconds}
                    onChange={(e) => setLatSeconds(e.target.value)}
                    required
                    placeholder="Segundos"
                    min="0"
                    max="59.999"
                    disabled={loading}
                    className="px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    onFocus={(e) => e.target.style.borderColor = '#3DAF2D'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <select
                    value={latDirection}
                    onChange={(e) => setLatDirection(e.target.value)}
                    disabled={loading}
                    className="px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    onFocus={(e) => e.target.style.borderColor = '#3DAF2D'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  >
                    <option value="N">N</option>
                    <option value="S">S</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitud (Grados, Minutos, Segundos)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="number"
                    value={longDegrees}
                    onChange={(e) => setLongDegrees(e.target.value)}
                    required
                    placeholder="Grados"
                    min="0"
                    max="180"
                    disabled={loading}
                    className="px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    onFocus={(e) => e.target.style.borderColor = '#3DAF2D'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <input
                    type="number"
                    value={longMinutes}
                    onChange={(e) => setLongMinutes(e.target.value)}
                    required
                    placeholder="Minutos"
                    min="0"
                    max="59"
                    disabled={loading}
                    className="px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    onFocus={(e) => e.target.style.borderColor = '#3DAF2D'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <input
                    type="number"
                    step="any"
                    value={longSeconds}
                    onChange={(e) => setLongSeconds(e.target.value)}
                    required
                    placeholder="Segundos"
                    min="0"
                    max="59.999"
                    disabled={loading}
                    className="px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    onFocus={(e) => e.target.style.borderColor = '#3DAF2D'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <select
                    value={longDirection}
                    onChange={(e) => setLongDirection(e.target.value)}
                    disabled={loading}
                    className="px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    onFocus={(e) => e.target.style.borderColor = '#3DAF2D'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  >
                    <option value="E">E</option>
                    <option value="W">W</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Código del Cultivo - Always visible */}
          <div>
            <label htmlFor="cropCode" className="block text-sm font-medium text-gray-700 mb-1">
              Código del Cultivo
            </label>
            <input
              id="cropCode"
              type="number"
              value={cropCode}
              onChange={(e) => setCropCode(e.target.value)}
              required
              placeholder="Código del Cultivo"
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-full text-base focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              style={{ '--tw-ring-color': '#3DAF2D' }}
              onFocus={(e) => e.target.style.borderColor = '#3DAF2D'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Toggle Button */}
          <button
            type="button"
            onClick={handleFormatToggle}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium transition-colors hover:bg-gray-300"
          >
            {coordinateFormat === 'decimal' ? 'Coordenadas GMS' : 'Latitud / Longitud'}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-2 bg-gray-800 text-white rounded-full text-base font-medium transition-colors hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Consultando...' : 'CONSULTAR'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CropValidationForm;

