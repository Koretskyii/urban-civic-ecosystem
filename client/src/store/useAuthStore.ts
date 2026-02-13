import { create } from 'zustand';

export type User = {
  id: string;
  name: string;
  email: string;
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user, token) => set({ user, token, isAuthenticated: true }),

  logout: () => set({ user: null, token: null, isAuthenticated: false }),

  setLoading: (isLoading) => set({ isLoading }),
}));
