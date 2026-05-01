import { create } from 'zustand';

export type Notification = {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
};

interface AppState {
  notifications: Notification[];
  sidebarOpen: boolean;

  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  notifications: [],
  sidebarOpen: true,

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
