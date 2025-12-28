import axios from 'axios';

const BASE_URL = import.meta.env.VITE_AUTH_API_URL;

export const authService = {
  async login(email, password) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        mail: email,
        contrasena: password,
      });

      const data = response.data;

      if (data.status && data.Token) {
        return {
          success: true,
          token: data.Token,
          userId: data.id,
        };
      } else {
        return {
          success: false,
          error: data.message || 'Error al iniciar sesión',
        };
      }
    } catch (error) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data?.message || 'Error al iniciar sesión',
        };
      } else if (error.request) {
        return {
          success: false,
          error: 'Error de red. Por favor, intente nuevamente.',
        };
      } else {
        return {
          success: false,
          error: error.message || 'Error al iniciar sesión',
        };
      }
    }
  },

  // Helper function to get auth headers for API requests
  getAuthHeaders(token) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  },
};

