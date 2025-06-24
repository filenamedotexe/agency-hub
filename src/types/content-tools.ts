export type ContentToolType =
  | "BLOG_WRITER"
  | "FACEBOOK_VIDEO_AD"
  | "FACEBOOK_IMAGE_AD"
  | "GOOGLE_SEARCH_AD"
  | "SEO_KEYWORD_RESEARCH";

export interface ContentTool {
  id: string;
  type: ContentToolType;
  name: string;
  description?: string;
  prompt: string;
  webhookId?: string;
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
