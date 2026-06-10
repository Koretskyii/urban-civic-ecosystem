export type CityRequestStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED';
export type ReportType = 'PROGRESS' | 'RESOLUTION' | 'REJECTION';

export type Department = {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  isDefault: boolean;
};

export type CreateDepartmentPayload = {
  name: string;
  description?: string;
};

export type UpdateDepartmentPayload = Partial<CreateDepartmentPayload>;

export type Attachment = {
  id: string;
  fileName: string;
  mimeType?: string | null;
  url: string;
  type?: string | null;
  uploadedAt: string;
};

export type CityRequestListItem = {
  id: string;
  title: string;
  status: CityRequestStatus;
  priority: number;
  address?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  createdAt: string;
  userId: string;
  user: { name: string };
  assignedDepartment?: {
    id: string;
    name: string;
    type: string;
  } | null;
};

export type CityRequestMessage = {
  id: string;
  chatId: string;
  authorId: string;
  content: string;
  timestamp: string;
  author: {
    id: string;
    name: string;
  };
};

export type CityRequestReport = {
  id: string;
  description?: string | null;
  authorId: string;
  type: ReportType;
  status?: CityRequestStatus | null;
  cityRequestId: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
  };
  attachments: Attachment[];
};

export type CityRequestDetail = {
  id: string;
  cityId: string;
  userId: string;
  title: string;
  description?: string | null;
  status: CityRequestStatus;
  locationLat?: number | null;
  locationLng?: number | null;
  address?: string | null;
  priority: number;
  assignedDepartmentId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
  };
  attachments: Attachment[];
  assignedDepartment?: Department | null;
  reports: CityRequestReport[];
  chat?: {
    id: string;
    messages: CityRequestMessage[];
  } | null;
};

export type CityRequestScope = 'all' | 'mine';

export type GetCityRequestsQuery = {
  scope?: CityRequestScope;
  status?: CityRequestStatus;
  departmentId?: string;
  priority?: number;
  search?: string;
  limit?: number;
  cursor?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
};

export type CityRequestRealtimeEvent =
  | 'message.created'
  | 'report.created'
  | 'status.updated'
  | 'assignment.updated';

export type CityRequestRealtimeEnvelope<TPayload = unknown> = {
  requestId: string;
  emittedAt: string;
  payload: TPayload;
};
