import { useState, useRef } from 'react';
import { cropService } from '../services/cropService';
import useAuthStore from '../store/authStore';

function NuevaSolicitud() {
  const { token } = useAuthStore((state) => ({ token: state.token }));
  const formRef = useRef(null);
  
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [cropCode, setCropCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validations, setValidations] = useState([]);
  const [expandedValidation, setExpandedValidation] = useState(null);

  const scrollToTop = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    if (!latitude || !longitude || !cropCode) {
      setError('Por favor, complete todos los campos');
      return;
    }

    const numLatitude = parseFloat(latitude);
    const numLongitude = parseFloat(longitude);
    const numCropCode = parseInt(cropCode);

    if (isNaN(numLatitude) || isNaN(numLongitude) || isNaN(numCropCode)) {
      setError('Por favor, ingrese valores numéricos válidos');
      return;
    }

    setLoading(true);

    const response = await cropService.validateCrop(latitude, longitude, cropCode, token);

    if (response.success) {
      // Add new validation to the list
      const newValidation = {
        id: Date.now(),
        latitude,
        longitude,
        cropCode,
        data: response.data,
        timestamp: new Date(),
      };
      setValidations([...validations, newValidation]);
      
      // Clear form
      setLatitude('');
      setLongitude('');
      setCropCode('');
      setExpandedValidation(newValidation.id);
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

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Nueva solicitud</h1>

      {/* Form Section */}
      <div ref={formRef} className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-4 items-end">
            <div className="flex-1">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex-1">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex-1">
              <label htmlFor="cropCode" className="block text-sm font-medium text-gray-700 mb-1">
                Código del cultivo
              </label>
              <input
                id="cropCode"
                type="number"
                value={cropCode}
                onChange={(e) => setCropCode(e.target.value)}
                required
                placeholder="Codigo del cultivo"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md text-base font-medium transition-colors hover:bg-gray-400 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? 'Consultando...' : 'CONSULTAR'}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {validations.length > 0 && (
        <div className="mb-6">
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
                  <div className="px-6 pb-6 pt-2 border-t border-gray-200">
                    <div className="space-y-3 mt-4">
                      {Object.entries(validation.data).map(([key, value]) => (
                        <div key={key} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                          <div className="text-sm font-medium text-gray-600 mb-1">
                            {key}
                          </div>
                          <div className="text-base text-gray-800 font-semibold">
                            {value}
                          </div>
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
        <div className="flex justify-center">
          <button
            onClick={handleNewValidation}
            className="px-6 py-3 bg-gray-300 text-gray-800 rounded-md text-base font-medium transition-colors hover:bg-gray-400"
          >
            Nueva validación
          </button>
        </div>
      )}
    </div>
  );
}

export default NuevaSolicitud;

