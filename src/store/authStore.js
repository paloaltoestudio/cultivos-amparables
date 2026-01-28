import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      userId: null,
      nombre: null,
      exp: null, // Unix timestamp (seconds) when token expires
      login: (token, userId, nombre, exp) => {
        set({ token, userId, nombre, exp: exp ?? null });
      },
      logout: () => {
        set({ token: null, userId: null, nombre: null, exp: null });
      },
      isTokenExpired: () => {
        const { exp } = get();
        if (exp == null) return false;
        return Date.now() / 1000 > exp;
      },
    }),
    {
      name: 'auth-storage', // localStorage key
    }
  )
);

// Selector for isAuthenticated (false if no token or token expired)
export const useIsAuthenticated = () => {
  const token = useAuthStore((state) => state.token);
  const exp = useAuthStore((state) => state.exp);
  if (!token) return false;
  if (exp != null && Date.now() / 1000 > exp) return false;
  return true;
};

export default useAuthStore;

