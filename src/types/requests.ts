export type RequestStatus = "TO_DO" | "IN_PROGRESS" | "DONE";

export interface RequestComment {
  id: string;
  requestId: string;
  text: string;
  dudaUuid?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Request {
  id: string;
  clientId: string;
  description: string;
  status: RequestStatus;
  clientVisible: boolean;
  dudaData?: any;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  client?: {
    id: string;
    name: string;
    businessName: string;
  };
  comments?: RequestComment[];
}
