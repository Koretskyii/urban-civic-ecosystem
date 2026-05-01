export interface CityInitData {
  name: string;
  region: string;
  domain?: string;
  document?: string;
  userId?: string;
}

export type City = {
  id: string;
  name: string;
  region: string;
  domain: string | null;
};
