import type { CityCreationRequestStatus } from './admin.types';

export interface City {
  id: string;
  name: string;
  region: string;
  domain?: string | null;
  cityDomain?: {
    domainName: string;
  } | null;
  centerLat?: number | null;
  centerLng?: number | null;
  createdAt?: string;
  updatedAt?: string;
  verificationDocument?: {
    id: string;
    fileName: string;
    mimeType?: string | null;
    url: string;
    type?: string | null;
    uploadedAt: string;
  } | null;
}

export interface CityCreationRequestTracking {
  id: string;
  name: string;
  region: string;
  centerLat?: number | null;
  centerLng?: number | null;
  domain?: string | null;
  domainVerifiedAt?: string | null;
  status: CityCreationRequestStatus;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  city?: {
    id: string;
    name: string;
  } | null;
}

export interface DomainVerificationToken {
  id: string;
  domain: string;
  token: string;
  verifiedAt?: string | null;
  createdAt?: string;
}

export interface DomainVerificationResult {
  success: boolean;
  message: string;
  id: string;
  domain: string;
  token: string;
  verifiedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string | null;
  nextPage?: number | null;
  page?: number;
  limit?: number;
  total?: number;
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
  alertTypeId?: string;
  onlyActive?: boolean;
  limit?: number;
  cursor?: string;
  sortBy?: 'severity' | 'createdAt' | 'expiresAt' | 'title';
  sortOrder?: 'asc' | 'desc';
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
  attachments?: Array<{
    id: string;
    fileName: string;
    mimeType?: string | null;
    url: string;
    type?: string | null;
    uploadedAt: string;
  }>;
}

export interface NewsListQuery {
  includeDeleted?: boolean;
  search?: string;
  limit?: number;
  cursor?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateNewsPayload {
  title: string;
  content: string;
}

export interface UpdateNewsPayload {
  title?: string;
  content?: string;
}

export interface DomainVerificationData {
  domain: string;
  token: string;
}

// ─── Surveys ───

export type SurveyStatus = 'OPEN' | 'CLOSED';
export type ResultsVisibility = 'LIVE' | 'AFTER_VOTE' | 'AFTER_CLOSE';

export interface SurveyOption {
  id: string;
  text: string;
  position: number;
}

export interface SurveyVoteResult {
  optionId: string;
  count: number;
  percent: number;
}

export interface Survey {
  id: string;
  cityId: string;
  publisherId?: string | null;
  title: string;
  description?: string | null;
  status: SurveyStatus;
  resultsVisibility: ResultsVisibility;
  allowVoteChange: boolean;
  closesAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  myVote?: string | null;
  _count?: { votes: number; options: number };
  options?: SurveyOption[];
  results?: SurveyVoteResult[] | null;
}

export interface SurveyListQuery {
  includeDeleted?: boolean;
  status?: SurveyStatus;
  search?: string;
  limit?: number;
  cursor?: string;
  sortBy?: 'createdAt' | 'closesAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateSurveyPayload {
  title: string;
  description?: string;
  options: { text: string }[];
  closesAt?: string;
  resultsVisibility?: ResultsVisibility;
  allowVoteChange?: boolean;
}

export interface UpdateSurveyPayload {
  title?: string;
  description?: string;
  closesAt?: string | null;
  resultsVisibility?: ResultsVisibility;
}

export interface CastVotePayload {
  optionId: string;
}

// ─── City Members ───

export interface CityMember {
  userId: string;
  name: string;
  email: string;
  joinedAt: string;
  isBlocked: boolean;
  blockedAt?: string | null;
  blockedById?: string | null;
  role: 'admin' | 'citizen' | 'municipality';
}

export type CityMemberSortBy = 'name' | 'email' | 'joinedAt';

export interface CityMembersListQuery {
  search?: string;
  role?: CityMember['role'];
  limit?: number;
  page?: number;
  sortBy?: CityMemberSortBy;
  sortOrder?: 'asc' | 'desc';
}
