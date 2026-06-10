import type { CityRequestStatus, ReportType } from '@/types';

export type CreateCityRequestPayload = {
  title: string;
  description?: string;
  priority?: number;
  locationLat: number;
  locationLng: number;
  address?: string;
};

export type CreateCityRequestInput = {
  cityId: string;
  payload: CreateCityRequestPayload;
  files?: File[];
};

export type AssignDepartmentPayload = {
  departmentId: string;
};

export type AssignDepartmentInput = {
  cityId: string;
  requestId: string;
  departmentId: string;
};

export type UpdateStatusPayload = {
  status: CityRequestStatus;
};

export type UpdateStatusInput = {
  cityId: string;
  requestId: string;
  status: CityRequestStatus;
};

export type CreateReportPayload = {
  type: ReportType;
  status?: CityRequestStatus;
  description?: string;
};

export type CreateReportInput = {
  cityId: string;
  requestId: string;
  payload: CreateReportPayload;
  files?: File[];
};

export type CreateMessagePayload = {
  content: string;
};

export type CreateMessageInput = {
  cityId: string;
  requestId: string;
  content: string;
};
