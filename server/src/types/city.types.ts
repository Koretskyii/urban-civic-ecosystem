export interface CityInitData {
  name: string;
  region: string;
  centerLat?: number;
  centerLng?: number;
  domain?: string;
  document?: string;
  userId?: string;
}

export interface DomainVerificationData {
  domain: string;
  token: string;
}

export interface City {
  id: string;
  name: string;
  region: string;
  centerLat: number | null;
  centerLng: number | null;
  domain: string | null;
}
