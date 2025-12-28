import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      userId: null,
      login: (token, userId) => {
        set({ token, userId });
      },
      logout: () => {
        set({ token: null, userId: null });
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

