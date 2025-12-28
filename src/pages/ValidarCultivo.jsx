import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { cropService } from '../services/cropService';

function ValidarCultivo() {
  const navigate = useNavigate();
  const { token, logout } = useAuthStore((state) => ({
    token: state.token,
    logout: state.logout,
  }));
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [cropCode, setCropCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    // Validate inputs
    if (!latitude || !longitude || !cropCode) {
      setError('Por favor, complete todos los campos');
      setLoading(false);
      return;
    }

    const numLatitude = parseFloat(latitude);
    const numLongitude = parseFloat(longitude);
    const numCropCode = parseInt(cropCode);

    if (isNaN(numLatitude) || isNaN(numLongitude) || isNaN(numCropCode)) {
      setError('Por favor, ingrese valores numéricos válidos');
      setLoading(false);
      return;
    }

    const response = await cropService.validateCrop(latitude, longitude, cropCode, token);

    if (response.success) {
      setResult(response.data);
    } else {
      // Ensure error is always a string
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : response.error?.detail || response.error?.message || JSON.stringify(response.error) || 'Error al validar el cultivo';
      setError(errorMessage);
    }

    setLoading(false);
  };

  const handleNewValidation = () => {
    setLatitude('');
    setLongitude('');
    setCropCode('');
    setError('');
    setResult(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-8 py-5 flex justify-between items-center mb-8">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Cultivos Amparables
          </h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            Panel de Control
          </button>
        </div>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-md text-sm font-medium transition-colors hover:bg-red-600"
        >
          Cerrar Sesión
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Validar Cultivo
        </h1>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="latitude" className="text-sm font-medium text-gray-700">
                  Latitud
                </label>
                <input
                  id="latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                  placeholder="Ej: 3.98007612"
                  disabled={loading}
                  className="px-4 py-3 border border-gray-300 rounded-lg text-base transition-colors focus:outline-none focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="longitude" className="text-sm font-medium text-gray-700">
                  Longitud
                </label>
                <input
                  id="longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                  placeholder="Ej: -73.48274232"
                  disabled={loading}
                  className="px-4 py-3 border border-gray-300 rounded-lg text-base transition-colors focus:outline-none focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="cropCode" className="text-sm font-medium text-gray-700">
                  Código de Cultivo
                </label>
                <input
                  id="cropCode"
                  type="number"
                  value={cropCode}
                  onChange={(e) => setCropCode(e.target.value)}
                  required
                  placeholder="Ej: 35"
                  disabled={loading}
                  className="px-4 py-3 border border-gray-300 rounded-lg text-base transition-colors focus:outline-none focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-base font-semibold transition-all hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? 'Validando...' : 'Validar'}
              </button>

              {result && (
                <button
                  type="button"
                  onClick={handleNewValidation}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg text-base font-semibold transition-all hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Nueva Validación
                </button>
              )}
            </div>
          </form>
        </div>

        {result && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Resultado de la Validación
            </h2>
            <div className="space-y-4">
              {Object.entries(result).map(([key, value]) => (
                <div key={key} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
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
    </div>
  );
}

export default ValidarCultivo;

