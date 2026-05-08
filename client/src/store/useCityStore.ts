import { create } from 'zustand';
import { City } from '@/types';
interface CityStore {
  currentCity: City | null;
  cities: City[];

  setCurrentCity: (city: City) => void;
  setCities: (cities: City[]) => void;
  clearCurrentCity: () => void;
}

export const useCityStore = create<CityStore>((set) => ({
  currentCity: null,
  cities: [],

  setCurrentCity: (city) => set({ currentCity: city }),

  setCities: (cities) => set({ cities }),

  clearCurrentCity: () => set({ currentCity: null }),
}));
