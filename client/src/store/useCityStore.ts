import { create } from 'zustand';

export type City = {
  id: string;
  name: string;
  region: string;
  domain: string | null;
};

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
