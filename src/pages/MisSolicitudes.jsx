import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cropService } from '../services/cropService';
import useAuthStore from '../store/authStore';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const LIST_SKELETON_COUNT = 5;

function MisSolicitudes() {
  const navigate = useNavigate();
  const { token, userId } = useAuthStore((state) => ({ 
    token: state.token, 
    userId: state.userId 
  }));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applications, setApplications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 0,
  });

  const loadApplications = useCallback(async (page = 1) => {
    if (!token || !userId) return;
    
    setLoading(true);
    setError('');

    const response = await cropService.searchApplications(userId, token, page, limit);

    if (response.success) {
      setApplications(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } else {
      setError(response.error || 'Error al cargar las solicitudes');
    }

    setLoading(false);
  }, [token, userId, limit]);

  useEffect(() => {
    if (token && userId) {
      loadApplications(currentPage);
    }
  }, [token, userId, currentPage, loadApplications]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setCurrentPage(newPage);
      // Scroll to top when page changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Breadcrumbs */}
      <div className="mb-3 sm:mb-4 text-xs sm:text-sm" style={{ color: '#666666' }}>
        <span>Home / </span>
        <span className="font-bold">Mis solicitudes</span>
      </div>

      {/* Title */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#3DAF2D' }}>
          Mis solicitudes
        </h1>
      </div>

      {/* Error Message */}
      {error && !loading && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Applications List or Skeleton */}
      {loading ? (
        <>
          <div className="space-y-3">
            {Array.from({ length: LIST_SKELETON_COUNT }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <Skeleton height={22} width="70%" className="mb-2" />
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2">
                      <Skeleton height={16} width={140} />
                      <Skeleton height={16} width={120} />
                    </div>
                  </div>
                  <Skeleton height={20} width={20} circle />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <Skeleton width={220} height={24} />
            <div className="flex gap-2">
              <Skeleton width={90} height={36} borderRadius={9999} />
              <Skeleton width={90} height={36} borderRadius={9999} />
            </div>
          </div>
        </>
      ) : applications.length > 0 ? (
        <>
          <div className="space-y-3">
            {applications.map((application) => (
            <div
              key={application.id}
              onClick={() => handleApplicationClick(application.id)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 break-words">
                    {application.descriptor || `Solicitud #${application.consecutivo}`}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Creado:</span> <span className="break-words">{formatDate(application.creado)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Creado por:</span> <span className="break-words">{parseCreatedBy(application.creado_por)}</span>
                    </div>
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1"
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

          {/* Pagination Controls */}
          {pagination.total_pages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
              <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Mostrando {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, pagination.total)} de {pagination.total} solicitudes
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 text-sm font-medium transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  Anterior
                </button>
                
                <div className="flex items-center gap-1">
                  {(() => {
                    const pages = [];
                    const totalPages = pagination.total_pages;
                    
                    if (totalPages <= 0) return pages;
                    
                    // Always show first page
                    if (totalPages > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => handlePageChange(1)}
                          disabled={loading}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            currentPage === 1
                              ? 'bg-gray-800 text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          1
                        </button>
                      );
                    }

                    // Show ellipsis if current page is far from start
                    if (currentPage > 3 && totalPages > 4) {
                      pages.push(
                        <span key="ellipsis-start" className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }

                    // Show pages around current page
                    const startPage = Math.max(2, currentPage - 1);
                    const endPage = Math.min(totalPages - 1, currentPage + 1);
                    
                    for (let i = startPage; i <= endPage; i++) {
                      // Skip if it's the first or last page (already shown)
                      if (i !== 1 && i !== totalPages) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            disabled={loading}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                              currentPage === i
                                ? 'bg-gray-800 text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {i}
                          </button>
                        );
                      }
                    }

                    // Show ellipsis if current page is far from end
                    if (currentPage < totalPages - 2 && totalPages > 4) {
                      pages.push(
                        <span key="ellipsis-end" className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }

                    // Always show last page (if more than 1 page)
                    if (totalPages > 1) {
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => handlePageChange(totalPages)}
                          disabled={loading}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            currentPage === totalPages
                              ? 'bg-gray-800 text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {totalPages}
                        </button>
                      );
                    }

                    return pages;
                  })()}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.total_pages || loading}
                  className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 text-sm font-medium transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
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

