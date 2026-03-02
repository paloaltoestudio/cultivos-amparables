import axios from 'axios';

const BASE_URL = import.meta.env.VITE_CROP_API_URL;

export const cropService = {
  async validateCrop(latitude, longitude, cropCode, token, solicitudId = null, descriptor = 'Test') {
    try {
      // cropCode is the catalog item id (e.g. UUID string from execute-catalog)
      const requestBody = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        crop_code: typeof cropCode === 'number' ? cropCode : String(cropCode),
        descriptor: descriptor || 'Test',
      };

      // If solicitudId is provided, add it to the request to add validation to existing solicitud
      // This allows adding multiple crop queries to the same request
      if (solicitudId) {
        requestBody.solicitud_id = solicitudId;
      }

      const response = await axios.post(
        `${BASE_URL}/application/submit-application?token=${encodeURIComponent(token)}`,
        requestBody
      );

      // Handle new response structure
      if (response.data.status === 'success' && response.data.data) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          error: 'Respuesta inesperada del servidor',
        };
      }
    } catch (error) {
      if (error.response) {
        // Handle array of errors (FastAPI/Pydantic format)
        const errorData = error.response.data;
        let errorMessage;
        if (Array.isArray(errorData)) {
          errorMessage = errorData.map(err => err.msg || JSON.stringify(err)).join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || 'Error al validar el cultivo';
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
          error: error.message || 'Error al validar el cultivo',
        };
      }
    }
  },

  async uploadMassiveFile(file, token, solicitudId = null, descriptor = null, email = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      if (solicitudId) {
        formData.append('solicitud_id', solicitudId);
      }
      if (descriptor) {
        formData.append('descriptor', descriptor);
      }
      if (email) {
        formData.append('email', email);
      }

      const response = await axios.post(
        `${BASE_URL}/application/massive-application?token=${encodeURIComponent(token)}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.status === 'success' || response.status === 200) {
        return {
          success: true,
          data: response.data,
        };
      } else {
        return {
          success: false,
          error: 'Error al procesar el archivo',
        };
      }
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data;
        let errorMessage;
        if (Array.isArray(errorData)) {
          errorMessage = errorData.map(err => err.msg || JSON.stringify(err)).join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || 'Error al procesar el archivo';
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
          error: error.message || 'Error al procesar el archivo',
        };
      }
    }
  },

  async searchValidations(solicitudId, token, page = 1, limit = 10) {
    try {
      const response = await axios.post(
        `${BASE_URL}/application/search-validations?token=${encodeURIComponent(token)}`,
        {
          solicitud_id: solicitudId,
          page: page,
          limit: limit,
        }
      );

      if (response.data.status === 'success' && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          pagination: response.data.pagination || null,
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
          errorMessage = errorData.detail || errorData.message || 'Error al buscar validaciones';
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
          error: error.message || 'Error al buscar validaciones',
        };
      }
    }
  },

  async searchApplications(userId, token, page = 1, limit = 10) {
    try {
      const response = await axios.post(
        `${BASE_URL}/application/search-applications?token=${encodeURIComponent(token)}`,
        {
          usuario_id: userId,
          page: page,
          limit: limit,
        }
      );

      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: response.data.data,
          pagination: response.data.pagination || null,
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
          errorMessage = errorData.detail || errorData.message || 'Error al buscar solicitudes';
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
          error: error.message || 'Error al buscar solicitudes',
        };
      }
    }
  },
};

