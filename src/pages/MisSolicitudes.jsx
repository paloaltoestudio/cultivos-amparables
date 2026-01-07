import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cropService } from '../services/cropService';
import useAuthStore from '../store/authStore';
import LoadingOverlay from '../components/LoadingOverlay';

function MisSolicitudes() {
  const navigate = useNavigate();
  const { token, userId } = useAuthStore((state) => ({ 
    token: state.token, 
    userId: state.userId 
  }));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    if (token && userId) {
      loadApplications();
    }
  }, [token, userId]);

  const loadApplications = async () => {
    setLoading(true);
    setError('');

    const response = await cropService.searchApplications(userId, token);

    if (response.success) {
      setApplications(response.data || []);
    } else {
      setError(response.error || 'Error al cargar las solicitudes');
    }

    setLoading(false);
  };

  const handleApplicationClick = (applicationId) => {
    navigate(`/solicitud/${applicationId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const parseCreatedBy = (createdByString) => {
    if (!createdByString) return 'N/A';
    try {
      const parsed = JSON.parse(createdByString);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0].DisplayName || parsed[0].Email || 'N/A';
      }
      return 'N/A';
    } catch {
      return createdByString;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingOverlay show={loading} title="Cargando solicitudes" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Breadcrumbs */}
      <div className="mb-4 text-sm" style={{ color: '#666666' }}>
        <span>Home / </span>
        <span className="font-bold">Mis solicitudes</span>
      </div>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: '#3DAF2D' }}>
          Mis solicitudes
        </h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Applications List */}
      {applications.length > 0 ? (
        <div className="space-y-3">
          {applications.map((application) => (
            <div
              key={application.id}
              onClick={() => handleApplicationClick(application.id)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {application.descriptor || `Solicitud #${application.consecutivo}`}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    
                    <div>
                      <span className="font-medium">Creado:</span> {formatDate(application.creado)}
                    </div>
                    <div>
                      <span className="font-medium">Creado por:</span> {parseCreatedBy(application.creado_por)}
                    </div>
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 ml-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-600">
            {error ? 'Error al cargar las solicitudes' : 'No tienes solicitudes registradas.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default MisSolicitudes;

