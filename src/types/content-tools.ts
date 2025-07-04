export type ContentToolType =
  | "BLOG_WRITER"
  | "FACEBOOK_VIDEO_AD"
  | "FACEBOOK_IMAGE_AD"
  | "GOOGLE_SEARCH_AD"
  | "SEO_KEYWORD_RESEARCH";

export interface ContentToolField {
  id: string;
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "select";
  required: boolean;
  clientVisible: boolean;
  placeholder?: string;
  defaultValue?: string;
  options?: { label: string; value: string }[];
  order: number;
}

export interface ContentTool {
  id: string;
  type: ContentToolType;
  name: string;
  description?: string;
  prompt: string;
  webhookId?: string;
  webhook?: {
    id: string;
    name: string;
    url: string;
    productionUrl?: string;
    testingUrl?: string;
    isProduction: boolean;
    isActive: boolean;
  };
  fields?: ContentToolField[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    generatedContent: number;
  };
  generatedContent?: GeneratedContent[];
}

export interface GeneratedContent {
  id: string;
  toolId: string;
  clientId: string;
  prompt: string;
  content: string;
  metadata?: any;
  createdBy: string;
  createdAt: string;
  tool?: ContentTool;
  client?: {
    id: string;
    name: string;
    businessName: string;
  };
}
