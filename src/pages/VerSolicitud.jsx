import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cropService } from '../services/cropService';
import useAuthStore from '../store/authStore';
import FormAndMapSection from '../components/FormAndMapSection';
import LoadingOverlay from '../components/LoadingOverlay';
import MassiveUploadSection from '../components/MassiveUploadSection';
import { useValidationScroll } from '../hooks/useValidationScroll';

function VerSolicitud() {
  const { solicitudId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore((state) => ({ token: state.token }));
  const formRef = useRef(null);
  const resultsRef = useRef(null);
  const { scrollToLatestValidation, getValidationRef } = useValidationScroll();
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validations, setValidations] = useState([]);
  const [expandedValidation, setExpandedValidation] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 0,
  });

  const loadValidations = useCallback(async (page = 1, isInitialLoad = false) => {
    if (!solicitudId || !token) return null;
    
    if (isInitialLoad) {
      setInitialLoading(true);
    }
    setError('');

    const response = await cropService.searchValidations(solicitudId, token, page, limit);

    if (response.success) {
      const loadedValidations = response.data || [];
      setValidations(loadedValidations);
      setCurrentPage(page); // Update currentPage state to match loaded page
      if (response.pagination) {
        setPagination(response.pagination);
      }
      // Expand last validation by default (newest one, as API returns data in ascending order)
      // Only expand on initial load to avoid overriding manual expansion
      // When loading after a new validation is created, the expansion is handled in handleFormSubmit
      if (loadedValidations.length > 0 && isInitialLoad) {
        const lastValidation = loadedValidations[loadedValidations.length - 1];
        setExpandedValidation(lastValidation.id);
      }
      // Don't set expandedValidation when isInitialLoad is false - let the caller handle it
      
      if (isInitialLoad) {
        setInitialLoading(false);
      }
      
      return loadedValidations;
    } else {
      setError(response.error || 'Error al cargar las validaciones');
      if (isInitialLoad) {
        setInitialLoading(false);
      }
      return null;
    }
  }, [solicitudId, token, limit]);

  useEffect(() => {
    if (solicitudId && token) {
      loadValidations(1, true); // Pass page 1 and true for initial load
    }
  }, [solicitudId, token, loadValidations]);

  // Track when we're expecting a new validation to be added
  const expectingNewValidationRef = useRef(false);

  // Auto-expand last validation when validations change and we're expecting a new one
  useEffect(() => {
    if (expectingNewValidationRef.current && validations.length > 0) {
      const lastValidation = validations[validations.length - 1];
      
      // Expand the last validation
      setExpandedValidation(lastValidation.id);
      expectingNewValidationRef.current = false;
      
      // Scroll after a delay to ensure DOM is updated with the expanded state
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollToLatestValidation(lastValidation.id, null, 100);
        }, 400);
      });
    }
  }, [validations, scrollToLatestValidation]);


  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      loadValidations(newPage, false);
      // Scroll to top when page changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFormSubmit = async ({ latitude, longitude, cropCode }) => {
    setError('');
    setLoading(true);

    // Get descriptor from first validation if available
    const descriptor = validations.length > 0 && validations[0].descriptor 
      ? validations[0].descriptor 
      : 'Test';

    // Use the solicitudId from params to add validation to existing request
    const response = await cropService.validateCrop(latitude, longitude, cropCode, token, solicitudId, descriptor);

    if (response.success) {
      // Reload validations to show the new one (go to last page to see the new validation)
      // Since API returns data in ascending order, newest is at the end
      // First, get pagination info to find the last page
      const paginationResponse = await cropService.searchValidations(solicitudId, token, 1, limit);
      if (paginationResponse.success && paginationResponse.pagination) {
        const totalPages = paginationResponse.pagination.total_pages;
        
        // Go to the last page where the newest validation will be
        setCurrentPage(totalPages);
        
        // Set flag to indicate we're expecting a new validation
        expectingNewValidationRef.current = true;
        
        // Load validations - the useEffect will handle expansion and scrolling when validations update
        await loadValidations(totalPages, false);
      } else {
        // Fallback: just reload page 1
        await loadValidations(1, false);
      }

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

  if (initialLoading) {
    return (
      <div className="p-4 sm:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm sm:text-base text-gray-600">Cargando solicitud...</p>
        </div>
      </div>
    );
  }

  if (error && validations.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error}
        </div>
        <button
          onClick={() => navigate('/mis-solicitudes')}
          className="mt-4 px-4 py-2 bg-gray-300 text-gray-800 rounded-full text-sm font-medium hover:bg-gray-400"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 relative">
      {/* Loading Overlay */}
      <LoadingOverlay show={loading} />

      {/* Breadcrumbs */}
      <div className="mb-3 sm:mb-4 text-xs sm:text-sm" style={{ color: '#666666' }}>
        <span>Home / </span>
        <span className="font-bold">Ver solicitud</span>
      </div>

      

      {/* Title */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#3DAF2D' }}>
          {validations.length > 0 && validations[0].descriptor 
            ? validations[0].descriptor 
            : `Solicitud ${solicitudId?.substring(0, 8) || 'N/A'}`}
        </h1>
        <button
          onClick={() => navigate('/mis-solicitudes')}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors text-sm"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="text-xs sm:text-sm font-medium">Volver al listado</span>
        </button>
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
        onUploadSuccess={() => {
          setCurrentPage(1);
          loadValidations(1, false);
        }}
      />

      {/* Results Section */}
      {validations.length > 0 && (
        <div ref={resultsRef} className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Resultados</h2>
          
          <div className="space-y-3">
            {validations.map((validation, index) => {
              const resultado = validation.json_resultado?.[0] || {};
              
              return (
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
                        {/* Validation Info */}
                        {/* <div className="mb-4 pb-4 border-b border-gray-200">
                          <div className="text-xs text-gray-500 mb-2">Información de la validación</div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>
                              <span className="font-medium">ID:</span> {validation.id}
                            </div>
                            <div>
                              <span className="font-medium">Estado:</span> {validation.estado}
                            </div>
                            <div>
                              <span className="font-medium">Creado:</span> {validation.creado}
                            </div>
                            {validation.creado_por && validation.creado_por[0] && (
                              <div>
                                <span className="font-medium">Creado por:</span> {validation.creado_por[0].DisplayName || validation.creado_por[0].Email}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Coordenadas:</span> {validation.latitud}, {validation.longitud}
                            </div>
                          </div>
                        </div> */}

                        {/* Validation Results */}
                        {Object.entries(resultado).map(([key, value]) => (
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
              );
            })}
          </div>

          {/* Pagination Controls */}
          {pagination.total_pages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
              <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Mostrando {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, pagination.total)} de {pagination.total} validaciones
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

export default VerSolicitud;

