import { NextRequest, NextResponse } from "next/server";
import { getActivityLogs } from "@/services/activity.service";
import { z } from "zod";

// Force dynamic rendering
export const dynamic = "force-dynamic";

const querySchema = z.object({
  clientId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = querySchema.parse({
      clientId: searchParams.get("clientId") || undefined,
      entityType: searchParams.get("entityType") || undefined,
      entityId: searchParams.get("entityId") || undefined,
      limit: searchParams.get("limit") || undefined,
      offset: searchParams.get("offset") || undefined,
    });

    const logs = await getActivityLogs(params);
    return NextResponse.json(logs);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}
