import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { AUTH_STORAGE_KEY } from '@/constants/constants';

const clearAccessTokenCookie = () => {
  if (typeof document === 'undefined') return;
  document.cookie = 'access_token=; Max-Age=0; path=/';
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User, token: string) => void;
  setToken: (token: string) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user, token) => set({ user, token, isAuthenticated: true }),

      setToken: (token) => set({ token, isAuthenticated: true }),

      logout: () => {
        clearAccessTokenCookie();
        set({ user: null, token: null, isAuthenticated: false });
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    },
  ),
);
