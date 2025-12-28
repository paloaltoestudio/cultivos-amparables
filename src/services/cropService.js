import axios from 'axios';

const BASE_URL = import.meta.env.VITE_CROP_API_URL;

export const cropService = {
  async validateCrop(latitude, longitude, cropCode, token) {
    try {
      const response = await axios.post(
        `${BASE_URL}/validate-data?token=${encodeURIComponent(token)}`,
        {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          crop_code: parseInt(cropCode),
        }
      );

      return {
        success: true,
        data: response.data,
      };
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
};

