import { useState, useRef } from 'react';
import { cropService } from '../services/cropService';
import useAuthStore from '../store/authStore';

function NuevaSolicitud() {
  const { token } = useAuthStore((state) => ({ token: state.token }));
  const formRef = useRef(null);
  const resultsRef = useRef(null);
  
  const [coordinateFormat, setCoordinateFormat] = useState('decimal'); // 'decimal' or 'dms'
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [cropCode, setCropCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validations, setValidations] = useState([]);
  const [expandedValidation, setExpandedValidation] = useState(null);
  const [solicitudId, setSolicitudId] = useState(null);
  
  // Massive upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // DMS state
  const [latDegrees, setLatDegrees] = useState('');
  const [latMinutes, setLatMinutes] = useState('');
  const [latSeconds, setLatSeconds] = useState('');
  const [latDirection, setLatDirection] = useState('N');
  const [longDegrees, setLongDegrees] = useState('');
  const [longMinutes, setLongMinutes] = useState('');
  const [longSeconds, setLongSeconds] = useState('');
  const [longDirection, setLongDirection] = useState('E');

  const scrollToTop = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Convert DMS to decimal degrees
  const dmsToDecimal = (degrees, minutes, seconds, direction) => {
    const deg = parseFloat(degrees) || 0;
    const min = parseFloat(minutes) || 0;
    const sec = parseFloat(seconds) || 0;
    
    let decimal = deg + (min / 60) + (sec / 3600);
    
    // Apply direction (negative for South and West)
    if (direction === 'S' || direction === 'W') {
      decimal = -decimal;
    }
    
    return decimal;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let finalLatitude, finalLongitude;

    if (coordinateFormat === 'dms') {
      // Validate DMS inputs
      if (!latDegrees || !latMinutes || !latSeconds || !longDegrees || !longMinutes || !longSeconds || !cropCode) {
        setError('Por favor, complete todos los campos');
        return;
      }

      // Convert DMS to decimal
      finalLatitude = dmsToDecimal(latDegrees, latMinutes, latSeconds, latDirection);
      finalLongitude = dmsToDecimal(longDegrees, longMinutes, longSeconds, longDirection);

      // Validate conversion
      if (isNaN(finalLatitude) || isNaN(finalLongitude)) {
        setError('Por favor, ingrese valores numéricos válidos');
        return;
      }

      // Validate ranges
      if (Math.abs(finalLatitude) > 90 || Math.abs(finalLongitude) > 180) {
        setError('Las coordenadas están fuera del rango válido');
        return;
      }
    } else {
      // Validate decimal inputs
      if (!latitude || !longitude || !cropCode) {
        setError('Por favor, complete todos los campos');
        return;
      }

      finalLatitude = parseFloat(latitude);
      finalLongitude = parseFloat(longitude);

      if (isNaN(finalLatitude) || isNaN(finalLongitude)) {
        setError('Por favor, ingrese valores numéricos válidos');
        return;
      }
    }

    const numCropCode = parseInt(cropCode);
    if (isNaN(numCropCode)) {
      setError('Por favor, ingrese un código de cultivo válido');
      return;
    }

    setLoading(true);

    const response = await cropService.validateCrop(finalLatitude, finalLongitude, cropCode, token, solicitudId);

    if (response.success) {
      const responseData = response.data;
      
      // Save Solicitud ID if this is the first validation
      if (!solicitudId && responseData['Solicitud ID']) {
        setSolicitudId(responseData['Solicitud ID']);
      }

      // Extract validation result from resultado_proceso array
      const resultadoProceso = responseData.resultado_proceso || [];
      const validationResult = resultadoProceso[0] || {};

      // Add new validation to the list
      const newValidation = {
        id: Date.now(),
        latitude: finalLatitude,
        longitude: finalLongitude,
        cropCode,
        solicitudId: responseData['Solicitud ID'],
        unidadRiesgoId: responseData['Unidad Riesgo ID'],
        estadoRegistro: responseData.estado_registro,
        resultado: validationResult,
        timestamp: new Date(),
      };
      setValidations([...validations, newValidation]);
      
      // Clear form
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
      setExpandedValidation(newValidation.id);

      // Scroll to results section after a short delay to ensure DOM is updated
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : response.error?.detail || response.error?.message || JSON.stringify(response.error) || 'Error al validar el cultivo';
      setError(errorMessage);
    }

    setLoading(false);
  };

  const handleNewValidation = () => {
    setError('');
    scrollToTop();
  };

  const toggleValidation = (id) => {
    setExpandedValidation(expandedValidation === id ? null : id);
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        await handleFileUpload(file);
      } else {
        setUploadError('Por favor, seleccione un archivo Excel (.xlsx o .xls)');
      }
    }
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        await handleFileUpload(file);
      } else {
        setUploadError('Por favor, seleccione un archivo Excel (.xlsx o .xls)');
      }
    }
  };

  const handleFileUpload = async (file) => {
    setUploadError('');
    setUploadedFile(file);
    setUploading(true);

    const response = await cropService.uploadMassiveFile(
      file,
      token,
      solicitudId,
      'Test', // descriptor
      null // email - can be added later if needed
    );

    if (response.success) {
      setShowSuccessMessage(true);
      setUploadedFile(null);
    } else {
      setUploadError(response.error || 'Error al subir el archivo');
      setUploadedFile(null);
    }

    setUploading(false);
  };

  const handleDownloadTemplate = () => {
    // TODO: Implement template download
    console.log('Download template');
  };

  return (
    <div className="p-8 relative">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4 flex flex-col items-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-2 border-2 border-purple-400 rounded-full border-r-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Procesando validación</h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Por favor espere, esto puede tomar unos momentos...
            </p>
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="mb-4 text-sm" style={{ color: '#666666' }}>
        <span>Home / </span>
        <span className="font-bold">Nueva solicitud</span>
      </div>

      {/* Title */}
      <div className="mb-6 flex items-center gap-2">
        <h1 className="text-3xl font-bold" style={{ color: '#3DAF2D' }}>
          Nueva solicitud {validations.length > 0 ? validations.length : ''}
        </h1>
        <svg className="w-5 h-5 cursor-pointer" style={{ color: '#3DAF2D' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </div>

      {/* Form and Map Section */}
      <div ref={formRef} className="grid grid-cols-2 gap-6 mb-6">
        {/* Left: Form */}
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-full text-sm border border-red-200">
                {error}
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
                      onChange={(e) => setLatitude(e.target.value)}
                      required
                      placeholder="Latitud"
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-full text-base focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      style={{ '--tw-ring-color': '#3DAF2D' }}
                      onFocus={(e) => e.target.style.borderColor = '#3DAF2D'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
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
                      onChange={(e) => setLongitude(e.target.value)}
                      required
                      placeholder="Longitud"
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-full text-base focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      style={{ '--tw-ring-color': '#3DAF2D' }}
                      onFocus={(e) => e.target.style.borderColor = '#3DAF2D'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
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
                onClick={() => {
                  setCoordinateFormat(coordinateFormat === 'decimal' ? 'dms' : 'decimal');
                  setError('');
                }}
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

        {/* Right: Map */}
        <div className="bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center min-h-[400px]">
          <div className="text-center text-gray-500">
            <svg className="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-sm">Mapa</p>
          </div>
        </div>
      </div>

      {/* Massive Upload Section */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors ${
          isDragging
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 bg-white'
        } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center">
          {uploading ? (
            <>
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-sm text-gray-600">Subiendo archivo...</p>
            </>
          ) : (
            <>
              <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Consulta masiva (.xlsx)</h3>
              <p className="text-sm text-gray-500 mb-4">
                Arrastre y suelte su archivo aquí o haga clic para seleccionar
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-medium cursor-pointer hover:bg-gray-300 transition-colors mb-2"
              >
                Seleccionar archivo
              </label>
              <button
                onClick={handleDownloadTemplate}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Descargar plantilla
              </button>
              {uploadedFile && (
                <p className="text-sm text-green-600 mt-2">
                  Archivo seleccionado: {uploadedFile.name}
                </p>
              )}
              {uploadError && (
                <p className="text-sm text-red-600 mt-2">{uploadError}</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Success Message Modal */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Solicitud Enviada
              </h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Estamos procesando tu solicitud, te enviaremos un email una vez esté lista tu consulta. Puedes cerrar esta ventana o hacer otra petición.
              </p>
              <button
                onClick={() => setShowSuccessMessage(false)}
                className="px-6 py-2 bg-gray-800 text-white rounded-full text-base font-medium transition-colors hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {validations.length > 0 && (
        <div ref={resultsRef} className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Resultados</h2>
          
          <div className="space-y-3">
            {validations.map((validation, index) => (
              <div key={validation.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <button
                  onClick={() => toggleValidation(validation.id)}
                  className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-800">
                    Consulta {index + 1}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      expandedValidation === validation.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedValidation === validation.id && (
                  <div className="px-6 pb-6 pt-4 border-t border-gray-200">
                    <div className="space-y-4">
                      {Object.entries(validation.resultado).map(([key, value]) => (
                        <div key={key} className="pb-3 last:pb-0">
                          {key.includes('?') ? (
                            // Question format
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-1">
                                {key}
                              </div>
                              <div className="text-base text-gray-800 font-semibold">
                                {value}
                              </div>
                            </div>
                          ) : (
                            // Label format
                            <div>
                              <div className="text-sm font-medium text-gray-600 mb-1">
                                {key}
                              </div>
                              <div className="text-base text-gray-800 font-semibold">
                                {value}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nueva Validación Button */}
      {validations.length > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleNewValidation}
            className="px-6 py-3 bg-gray-300 text-gray-800 rounded-full text-base font-medium transition-colors hover:bg-gray-400"
          >
            Nueva validación
          </button>
        </div>
      )}
    </div>
  );
}

export default NuevaSolicitud;

