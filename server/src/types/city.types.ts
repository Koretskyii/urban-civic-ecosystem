export interface CityInitData {
  name: string;
  region: string;
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
  domain: string | null;
}
