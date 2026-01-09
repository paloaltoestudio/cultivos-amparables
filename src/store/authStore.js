import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      userId: null,
      nombre: null,
      login: (token, userId, nombre) => {
        set({ token, userId, nombre });
      },
      logout: () => {
        set({ token: null, userId: null, nombre: null });
      },
    }),
    {
      name: 'auth-storage', // localStorage key
    }
  )
);

// Selector for isAuthenticated
export const useIsAuthenticated = () => {
  const token = useAuthStore((state) => state.token);
  return !!token;
};

export default useAuthStore;

