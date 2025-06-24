export type WebhookType = "FORM" | "CONTENT_TOOL" | "GENERAL";

export interface Webhook {
  id: string;
  name: string;
  url: string;
  type: WebhookType;
  entityId?: string;
  headers?: Record<string, string>;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    executions: number;
  };
  executions?: WebhookExecution[];
}

export interface WebhookExecution {
  id: string;
  webhookId: string;
  payload: any;
  response?: any;
  statusCode?: number;
  error?: string;
  executedAt: string;
  webhook?: Webhook;
}
