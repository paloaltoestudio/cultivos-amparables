import { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import { catalogService, CATALOG_IDS } from '../services/catalogService';

function CropValidationForm({ 
  onSubmit, 
  loading = false, 
  error: externalError = '', 
  onErrorChange,
  latitude: externalLatitude = '',
  longitude: externalLongitude = '',
  onCoordinatesChange,
  token
}) {
  const [coordinateFormat, setCoordinateFormat] = useState('decimal');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [cropCode, setCropCode] = useState('');
  const [error, setError] = useState('');
  const [crops, setCrops] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  
  // DMS state
  const [latDegrees, setLatDegrees] = useState('');
  const [latMinutes, setLatMinutes] = useState('');
  const [latSeconds, setLatSeconds] = useState('');
  const [latDirection, setLatDirection] = useState('N');
  const [longDegrees, setLongDegrees] = useState('');
  const [longMinutes, setLongMinutes] = useState('');
  const [longSeconds, setLongSeconds] = useState('');
  const [longDirection, setLongDirection] = useState('E');

  // Ref to track last external coordinates to detect changes
  const lastExternalLat = useRef(null);
  const lastExternalLng = useRef(null);
  // Ref to prevent loop when updating from external source
  const isUpdatingFromExternal = useRef(false);

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
    const deg = Math.floor(Math.abs(decimal));
    const minFloat = (Math.abs(decimal) - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = (minFloat - min) * 60;
    
    return { degrees: deg, minutes: min, seconds: sec };
  };

  // Update form when external coordinates change (from map)
  useEffect(() => {
    // Only update if coordinates actually changed
    if (externalLatitude && externalLongitude) {
      const latChanged = lastExternalLat.current !== externalLatitude;
      const lngChanged = lastExternalLng.current !== externalLongitude;
      
      if (latChanged || lngChanged) {
        isUpdatingFromExternal.current = true;
        lastExternalLat.current = externalLatitude;
        lastExternalLng.current = externalLongitude;
        
        if (coordinateFormat === 'decimal') {
          setLatitude(externalLatitude.toString());
          setLongitude(externalLongitude.toString());
        } else {
          // Convert decimal to DMS
          const latDMS = decimalToDMS(externalLatitude);
          const lngDMS = decimalToDMS(externalLongitude);
          
          setLatDegrees(latDMS.degrees.toString());
          setLatMinutes(latDMS.minutes.toString());
          setLatSeconds(latDMS.seconds.toFixed(2));
          setLatDirection(externalLatitude >= 0 ? 'N' : 'S');
          
          setLongDegrees(lngDMS.degrees.toString());
          setLongMinutes(lngDMS.minutes.toString());
          setLongSeconds(lngDMS.seconds.toFixed(2));
          setLongDirection(externalLongitude >= 0 ? 'E' : 'W');
        }
        
        // Reset flag after state updates complete
        setTimeout(() => {
          isUpdatingFromExternal.current = false;
        }, 50);
      }
    }
  }, [externalLatitude, externalLongitude, coordinateFormat]);

  // Update map when DMS values change (only if user manually changed them, not from map update)
  useEffect(() => {
    // Skip if updating from external source or not in DMS format
    if (isUpdatingFromExternal.current || coordinateFormat !== 'dms' || !onCoordinatesChange) {
      return;
    }
    
    if (latDegrees && latMinutes && latSeconds && longDegrees && longMinutes && longSeconds) {
      const lat = dmsToDecimal(latDegrees, latMinutes, latSeconds, latDirection);
      const lng = dmsToDecimal(longDegrees, longMinutes, longSeconds, longDirection);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        // Only update map if the converted DMS values are significantly different from external coordinates
        // This means the user manually typed in the DMS fields
        if (externalLatitude && externalLongitude) {
          const latDiff = Math.abs(lat - parseFloat(externalLatitude)) > 0.0001;
          const lngDiff = Math.abs(lng - parseFloat(externalLongitude)) > 0.0001;
          // Only call onCoordinatesChange if values are different (user manually typed)
          if (latDiff || lngDiff) {
            onCoordinatesChange(lat, lng);
          }
        } else {
          // No external coordinates yet, safe to update (user is typing initial values)
          onCoordinatesChange(lat, lng);
        }
      }
    }
  }, [latDegrees, latMinutes, latSeconds, latDirection, longDegrees, longMinutes, longSeconds, longDirection, coordinateFormat, onCoordinatesChange, externalLatitude, externalLongitude]);

  // Fetch crop catalog on mount
  useEffect(() => {
    const fetchCropCatalog = async () => {
      if (!token) {
        setLoadingCatalog(false);
        return;
      }

      setLoadingCatalog(true);
      setCatalogError('');

      const response = await catalogService.getCatalog(CATALOG_IDS.CROP, token);

      if (response.success && response.data) {
        // Sort crops by code for better UX
        const sortedCrops = [...response.data].sort((a, b) => a.codigo - b.codigo);
        setCrops(sortedCrops);
      } else {
        setCatalogError(response.error || 'Error al cargar el catálogo de cultivos');
        // Still allow form submission even if catalog fails to load
        setCrops([]);
      }

      setLoadingCatalog(false);
    };

    fetchCropCatalog();
  }, [token]);

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
    const newFormat = coordinateFormat === 'decimal' ? 'dms' : 'decimal';
    
    // Convert current coordinates to the new format
    if (newFormat === 'dms') {
      // Converting from decimal to DMS
      if (latitude && longitude) {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          isUpdatingFromExternal.current = true;
          const latDMS = decimalToDMS(lat);
          const lngDMS = decimalToDMS(lng);
          
          setLatDegrees(latDMS.degrees.toString());
          setLatMinutes(latDMS.minutes.toString());
          setLatSeconds(latDMS.seconds.toFixed(2));
          setLatDirection(lat >= 0 ? 'N' : 'S');
          
          setLongDegrees(lngDMS.degrees.toString());
          setLongMinutes(lngDMS.minutes.toString());
          setLongSeconds(lngDMS.seconds.toFixed(2));
          setLongDirection(lng >= 0 ? 'E' : 'W');
          
          setTimeout(() => {
            isUpdatingFromExternal.current = false;
          }, 50);
        }
      }
    } else {
      // Converting from DMS to decimal
      if (latDegrees && latMinutes && latSeconds && longDegrees && longMinutes && longSeconds) {
        const lat = dmsToDecimal(latDegrees, latMinutes, latSeconds, latDirection);
        const lng = dmsToDecimal(longDegrees, longMinutes, longSeconds, longDirection);
        if (!isNaN(lat) && !isNaN(lng)) {
          setLatitude(lat.toString());
          setLongitude(lng.toString());
        }
      }
    }
    
    setCoordinateFormat(newFormat);
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
            {loadingCatalog ? (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-full text-base bg-gray-100 text-gray-500 flex items-center justify-center">
                Cargando cultivos...
              </div>
            ) : catalogError ? (
              <div className="w-full px-4 py-2 border border-red-300 rounded-full text-base bg-red-50 text-red-600 text-sm">
                {catalogError}
              </div>
            ) : (
              <Select
                id="cropCode"
                value={crops.find(crop => crop.codigo.toString() === cropCode) ? {
                  value: cropCode,
                  label: crops.find(crop => crop.codigo.toString() === cropCode)?.cultivo || ''
                } : null}
                onChange={(selectedOption) => {
                  setCropCode(selectedOption ? selectedOption.value.toString() : '');
                }}
                options={crops.map(crop => ({
                  value: crop.codigo.toString(),
                  label: crop.cultivo
                }))}
                placeholder="Seleccione un cultivo"
                isSearchable={true}
                isClearable={false}
                isDisabled={loading || crops.length === 0}
                noOptionsMessage={({ inputValue }) => 
                  inputValue ? `No se encontró "${inputValue}"` : 'No hay cultivos disponibles'
                }
                loadingMessage={() => 'Cargando...'}
                styles={{
                  control: (baseStyles, state) => ({
                    ...baseStyles,
                    borderRadius: '9999px',
                    borderColor: state.isFocused ? '#3DAF2D' : '#d1d5db',
                    borderWidth: '1px',
                    padding: '2px 4px',
                    minHeight: '42px',
                    boxShadow: state.isFocused ? '0 0 0 1px #3DAF2D' : 'none',
                    '&:hover': {
                      borderColor: state.isFocused ? '#3DAF2D' : '#d1d5db',
                    },
                    backgroundColor: state.isDisabled ? '#f3f4f6' : 'white',
                    cursor: state.isDisabled ? 'not-allowed' : 'pointer',
                  }),
                  menu: (baseStyles) => ({
                    ...baseStyles,
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }),
                  menuList: (baseStyles) => ({
                    ...baseStyles,
                    padding: '4px',
                  }),
                  option: (baseStyles, state) => ({
                    ...baseStyles,
                    borderRadius: '0.375rem',
                    backgroundColor: state.isSelected
                      ? '#3DAF2D'
                      : state.isFocused
                      ? '#f0fdf4'
                      : 'white',
                    color: state.isSelected ? 'white' : '#1f2937',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    '&:active': {
                      backgroundColor: '#3DAF2D',
                      color: 'white',
                    },
                  }),
                  input: (baseStyles) => ({
                    ...baseStyles,
                    fontSize: '1rem',
                  }),
                  placeholder: (baseStyles) => ({
                    ...baseStyles,
                    color: '#9ca3af',
                    fontSize: '1rem',
                  }),
                  singleValue: (baseStyles) => ({
                    ...baseStyles,
                    fontSize: '1rem',
                    color: '#1f2937',
                  }),
                  indicatorSeparator: () => ({
                    display: 'none',
                  }),
                  dropdownIndicator: (baseStyles, state) => ({
                    ...baseStyles,
                    color: '#9ca3af',
                    padding: '4px',
                    transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }),
                }}
              />
            )}
            {!loadingCatalog && crops.length === 0 && !catalogError && (
              <p className="mt-1 text-xs text-gray-500">
                No hay cultivos disponibles. Verifique su conexión.
              </p>
            )}
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

