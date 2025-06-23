import { z } from "zod";

export const clientSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  businessName: z
    .string()
    .min(1, "Business name is required")
    .max(100, "Business name must be 100 characters or less"),
  address: z.string().optional().nullable(),
  dudaSiteId: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

export interface Client {
  id: string;
  name: string;
  businessName: string;
  address: string | null;
  dudaSiteId: string | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientWithActivityCount extends Client {
  _count: {
    activityLogs: number;
  };
}
