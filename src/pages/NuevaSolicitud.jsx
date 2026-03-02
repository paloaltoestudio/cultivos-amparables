import { useState, useRef } from 'react';
import { cropService } from '../services/cropService';
import useAuthStore from '../store/authStore';
import FormAndMapSection from '../components/FormAndMapSection';
import LoadingOverlay from '../components/LoadingOverlay';
import MassiveUploadSection from '../components/MassiveUploadSection';
import { useValidationScroll } from '../hooks/useValidationScroll';

function NuevaSolicitud() {
  const { token } = useAuthStore((state) => ({ token: state.token }));
  const formRef = useRef(null);
  const resultsRef = useRef(null);
  const { scrollToLatestValidation, getValidationRef } = useValidationScroll();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validations, setValidations] = useState([]);
  const [expandedValidation, setExpandedValidation] = useState(null);
  const [solicitudId, setSolicitudId] = useState(null);
  const [descriptor, setDescriptor] = useState('');
  const [isDescriptorLocked, setIsDescriptorLocked] = useState(false);

  const scrollToTop = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFormSubmit = async ({ latitude, longitude, cropCode }) => {
    setError('');
    
    // Validate descriptor is provided
    if (!descriptor.trim()) {
      setError('Por favor, ingrese un nombre para la solicitud');
      return false;
    }
    
    setLoading(true);

    const response = await cropService.validateCrop(latitude, longitude, cropCode, token, solicitudId, descriptor);

    if (response.success) {
      const responseData = response.data;
      
      // Save Solicitud ID if this is the first validation
      if (!solicitudId && responseData['Solicitud ID']) {
        setSolicitudId(responseData['Solicitud ID']);
        // Lock the descriptor after first successful submission
        setIsDescriptorLocked(true);
      }

      // Extract validation result from resultado_proceso array
      const resultadoProceso = responseData.resultado_proceso || [];
      const validationResult = resultadoProceso[0] || {};

      // Add new validation to the list
      const newValidation = {
        id: Date.now(),
        latitude,
        longitude,
        cropCode,
        solicitudId: responseData['Solicitud ID'],
        unidadRiesgoId: responseData['Unidad Riesgo ID'],
        estadoRegistro: responseData.estado_registro,
        resultado: validationResult,
        timestamp: new Date(),
      };
      setValidations([...validations, newValidation]);
      
      // Scroll to the newest validation using the centralized hook
      scrollToLatestValidation(newValidation.id, setExpandedValidation, 200);

      setLoading(false);
      return true; // Return true to indicate success and clear form
    } else {
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : response.error?.detail || response.error?.message || JSON.stringify(response.error) || 'Error al validar el cultivo';
      setError(errorMessage);
      setLoading(false);
      return false; // Return false to keep form data
    }
  };

  const handleNewValidation = () => {
    setError('');
    scrollToTop();
  };

  const toggleValidation = (id) => {
    setExpandedValidation(expandedValidation === id ? null : id);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 relative">
      {/* Loading Overlay */}
      <LoadingOverlay show={loading} />

      {/* Breadcrumbs */}
      <div className="mb-3 sm:mb-4 text-xs sm:text-sm" style={{ color: '#666666' }}>
        <span>Home / </span>
        <span className="font-bold">Nueva solicitud</span>
      </div>

      {/* Title */}
      <div className="mb-4 sm:mb-6 flex items-center gap-2">
        {isDescriptorLocked ? (
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#3DAF2D' }}>
            {descriptor || 'Nueva solicitud'}
          </h1>
        ) : (
          <>
            <input
              type="text"
              value={descriptor}
              onChange={(e) => setDescriptor(e.target.value)}
              placeholder="Nombre de la solicitud"
              className="text-xl sm:text-2xl lg:text-3xl font-bold bg-transparent border-b-2 border-gray-300 outline-none flex-1 px-2 pb-1 focus:border-green-500 transition-colors"
              style={{ 
                color: '#3DAF2D',
              }}
            />
          </>
        )}
      </div>

      {/* Form and Map Section */}
            <FormAndMapSection
              ref={formRef}
              onSubmit={handleFormSubmit}
              loading={loading}
              error={error}
              onErrorChange={setError}
              token={token}
            />

      {/* Massive Upload Section */}
      <MassiveUploadSection
        token={token}
        solicitudId={solicitudId}
      />

      {/* Results Section */}
             {validations.length > 0 && (
               <div ref={resultsRef} className="mb-6">
                 <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Resultados</h2>
          
          <div className="space-y-3">
            {validations.map((validation, index) => (
              <div 
                key={validation.id}
                data-validation-item
                ref={getValidationRef(validation.id)}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
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
                      {Object.entries(validation.resultado || {}).map(([key, value]) => {
                        // React cannot render objects; show primitives or format objects/arrays
                        const displayValue =
                          value === null || value === undefined
                            ? '—'
                            : typeof value === 'object' && value !== null && !(value instanceof Date)
                            ? typeof value.mensaje === 'string'
                              ? value.mensaje + (value.codigo_DANE ? ` (código DANE: ${value.codigo_DANE})` : '')
                              : JSON.stringify(value)
                            : String(value);
                        return (
                          <div key={key} className="pb-3 last:pb-0">
                            {key.includes('?') ? (
                              <div>
                                <div className="text-sm font-medium text-gray-700 mb-1">
                                  {key}
                                </div>
                                <div className="text-base text-gray-800 font-semibold">
                                  {displayValue}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-sm font-medium text-gray-600 mb-1">
                                  {key}
                                </div>
                                <div className="text-base text-gray-800 font-semibold">
                                  {displayValue}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
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

