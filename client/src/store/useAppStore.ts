import { create } from 'zustand';

export type City = {
  id: string;
  name: string;
  region: string | null;
};

export type Notification = {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
};

interface AppState {
  currentCity: City | null;
  cities: City[];
  notifications: Notification[];
  sidebarOpen: boolean;

  setCurrentCity: (city: City) => void;
  setCities: (cities: City[]) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentCity: null,
  cities: [],
  notifications: [],
  sidebarOpen: true,

  setCurrentCity: (city) => set({ currentCity: city }),

  setCities: (cities) => set({ cities }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, notification],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
