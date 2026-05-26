export interface City {
  id: string;
  name: string;
  region: string;
  domain: string;
  centerLat?: number | null;
  centerLng?: number | null;
}

export interface Alert {
  id: string;
  cityId: string;
  alertTypeId: string;
  publisherId?: string | null;
  severity: AlertSeverity;
  expiresAt?: string | null;
  title: string;
  content: string;
  timestamp: string;
  alertType: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface AlertType {
  id: string;
  name: string;
}

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface AlertListQuery {
  includeDeleted?: boolean;
  search?: string;
  severity?: AlertSeverity;
  onlyActive?: boolean;
}

export interface CreateAlertPayload {
  alertTypeId: string;
  severity: AlertSeverity;
  expiresAt?: string;
  title: string;
  content: string;
}

export interface UpdateAlertPayload {
  alertTypeId?: string;
  severity?: AlertSeverity;
  expiresAt?: string | null;
  title?: string;
  content?: string;
}

export interface News {
  id: string;
  publisherId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  publishedAt?: string | null;
}

export interface NewsListQuery {
  includeDeleted?: boolean;
  search?: string;
}

export interface CreateNewsPayload {
  title: string;
  content: string;
}

export interface UpdateNewsPayload {
  title?: string;
  content?: string;
}

export interface Post {
  id: string;
  authorId: string;
  communityId: string;
  content: string;
  createdAt: string;
  author?: {
    name: string;
  };
}

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  authorId: string;
  author?: {
    name: string;
  };
}

export interface Chat {
  id: string;
  messages: Message[];
}

export interface Community {
  id: string;
  name: string;
  description: string;
  cityId: string;
  createdAt: string;
  chats: Chat[];
  posts: Post[];
}

export interface DomainVerificationData {
  domain: string;
  token: string;
}

export interface CityMember {
  userId: string;
  name: string;
  email: string;
  joinedAt: string;
  role: 'admin' | 'citizen' | 'organizer' | 'municipality';
}
