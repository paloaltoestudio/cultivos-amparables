import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cropService } from '../services/cropService';
import useAuthStore from '../store/authStore';
import FormAndMapSection from '../components/FormAndMapSection';
import LoadingOverlay from '../components/LoadingOverlay';
import MassiveUploadSection from '../components/MassiveUploadSection';
import { useValidationScroll } from '../hooks/useValidationScroll';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const RESULTS_SKELETON_COUNT = 5;

function formatConsultaDate(creado) {
  if (!creado) return null;
  const date = new Date(creado.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return null;
  const day = date.getDate();
  const month = MESES[date.getMonth()];
  const year = date.getFullYear();
  return `${day} de ${month} de ${year}`;
}

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
  const [formSectionOpen, setFormSectionOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
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
    } else {
      setPageLoading(true);
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
      // On initial load: expand first result. When user adds a new validation, expansion is handled in the useEffect below.
      if (loadedValidations.length > 0 && isInitialLoad) {
        const firstValidation = loadedValidations[0];
        setExpandedValidation(firstValidation.id);
      }
      // Don't set expandedValidation when isInitialLoad is false - let the caller handle it
      
      if (isInitialLoad) {
        setInitialLoading(false);
      } else {
        setPageLoading(false);
      }
      
      return loadedValidations;
    } else {
      setError(response.error || 'Error al cargar las validaciones');
      if (isInitialLoad) {
        setInitialLoading(false);
      } else {
        setPageLoading(false);
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

  const scrollToForm = () => {
    setFormSectionOpen(true);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
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
    scrollToForm();
  };

  const toggleValidation = (id) => {
    setExpandedValidation(expandedValidation === id ? null : id);
  };

  if (initialLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-3 sm:mb-4">
          <Skeleton width={140} height={14} />
        </div>
        <div className="mb-4 sm:mb-6 flex justify-between items-center">
          <Skeleton width={220} height={32} />
          <Skeleton width={140} height={36} borderRadius={9999} />
        </div>
        <div className="mb-6">
          <Skeleton width={120} height={28} className="mb-4" />
          <div className="space-y-3">
            {Array.from({ length: RESULTS_SKELETON_COUNT }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
                <Skeleton height={24} className="mb-2" />
                <Skeleton height={20} width="60%" />
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between items-center">
            <Skeleton width={180} height={32} />
            <div className="flex gap-2">
              <Skeleton width={80} height={36} borderRadius={9999} />
              <Skeleton width={80} height={36} borderRadius={9999} />
            </div>
          </div>
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
        <div className="flex items-center">
          <button
            onClick={() => navigate('/mis-solicitudes')}
            className="flex items-center gap-2 py-2 text-gray-700 hover:text-gray-900 transition-colors text-sm"
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
      </div>

      {/* Form section - hidden by default; open when user clicks "Nueva solicitud" or "Nueva validación" */}
      <div ref={formRef} className="mb-6">
        {formSectionOpen ? (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Nueva validación</h2>
              <button
                type="button"
                onClick={() => setFormSectionOpen(false)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Ocultar
              </button>
            </div>
            <FormAndMapSection
              ref={null}
              onSubmit={handleFormSubmit}
              loading={loading}
              error={error}
              onErrorChange={setError}
              token={token}
            />
            {/* Consulta masiva - inside Nueva validación so it hides with the section */}
            <MassiveUploadSection
              token={token}
              solicitudId={solicitudId}
              onUploadSuccess={() => {
                setCurrentPage(1);
                loadValidations(1, false);
              }}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={scrollToForm}
            className="w-full py-4 px-4 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva solicitud
          </button>
        )}
      </div>

      {/* Results Section - shown first to drive user to results */}
      {(validations.length > 0 || pageLoading) && (
        <div ref={resultsRef} className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Resultados</h2>
          
          {pageLoading ? (
            <div className="space-y-3">
              {Array.from({ length: RESULTS_SKELETON_COUNT }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex justify-between items-center">
                    <Skeleton height={24} width={200} />
                    <Skeleton height={20} width={20} circle />
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    <Skeleton height={18} width="90%" />
                    <Skeleton height={18} width="70%" />
                    <Skeleton height={18} width="80%" />
                  </div>
                </div>
              ))}
              <div className="mt-6 flex justify-between items-center">
                <Skeleton width={200} height={32} />
                <div className="flex gap-2">
                  <Skeleton width={90} height={36} borderRadius={9999} />
                  <Skeleton width={90} height={36} borderRadius={9999} />
                </div>
              </div>
            </div>
          ) : (
          <>
          <div className="space-y-3">
            {validations.map((validation, index) => {
              const resultado = validation.json_resultado?.[0] || {};
              const dateLabel = formatConsultaDate(validation.creado);
              const consultaLabel = dateLabel ? `Consulta ${dateLabel}` : `Consulta ${(currentPage - 1) * limit + index + 1}`;
              
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
                      {consultaLabel}
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

                        {/* Validation Results - value can be string, number, or object (e.g. { mensaje, codigo_DANE }) */}
                        {Object.entries(resultado).map(([key, value]) => {
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
              );
            })}
          </div>

          {/* Pagination Controls - only when not loading page */}
          {!pageLoading && pagination.total_pages > 1 && (
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
          </>
          )}
        </div>
      )}

      

      {/* Nueva Validación Button */}
      {validations.length > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={scrollToForm}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva solicitud
          </button>
        </div>
      )}
    </div>
  );
}

export default VerSolicitud;

