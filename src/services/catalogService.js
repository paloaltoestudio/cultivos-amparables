import axios from 'axios';

const BASE_URL = import.meta.env.VITE_CROP_API_URL;

export const catalogService = {
  /**
   * Fetches a catalog by its ID
   * @param {string} catalogId - The ID of the catalog to fetch
   * @param {string} token - Authentication token
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getCatalog(catalogId, token) {
    try {
      const response = await axios.post(
        `${BASE_URL}/catalog/execute-catalog?token=${encodeURIComponent(token)}`,
        {
          id: catalogId,
        }
      );

      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: response.data.data,
          catalogId: response.data.catalog_id,
        };
      } else {
        return {
          success: false,
          error: 'Respuesta inesperada del servidor',
        };
      }
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data;
        let errorMessage;
        if (Array.isArray(errorData)) {
          errorMessage = errorData.map(err => err.msg || JSON.stringify(err)).join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || 'Error al obtener el catálogo';
        }
        return {
          success: false,
          error: errorMessage,
        };
      } else if (error.request) {
        return {
          success: false,
          error: 'Error de red. Por favor, intente nuevamente.',
        };
      } else {
        return {
          success: false,
          error: error.message || 'Error al obtener el catálogo',
        };
      }
    }
  },
};

// Catalog IDs constants for reusability
export const CATALOG_IDS = {
  CROP: '172980ba-b2d6-4ecb-ad15-56f286eb296b',
  // Add more catalog IDs here as needed in the future
};

