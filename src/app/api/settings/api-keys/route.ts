import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  encryptApiKey,
  decryptApiKey,
  getLastFourChars,
} from "@/lib/encryption";
import { z } from "zod";

const apiKeySchema = z.object({
  service: z.enum(["anthropic", "openai"]),
  apiKey: z.string().min(1, "API key is required"),
});

// GET /api/settings/api-keys - List all API keys (masked)
export async function GET(request: NextRequest) {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Return masked keys only
    const maskedKeys = apiKeys.map((key) => ({
      id: key.id,
      service: key.service,
      maskedKey: `${"•".repeat(32)}${key.lastFour}`,
      lastFour: key.lastFour,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
    }));

    return NextResponse.json({ keys: maskedKeys });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

// POST /api/settings/api-keys - Create or update an API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = apiKeySchema.parse(body);

    const encryptedKey = encryptApiKey(validatedData.apiKey);
    const lastFour = getLastFourChars(validatedData.apiKey);

    // Check if key exists for this service
    const existingKey = await prisma.apiKey.findUnique({
      where: { service: validatedData.service },
    });

    if (existingKey) {
      // Update existing key
      const updatedKey = await prisma.apiKey.update({
        where: { service: validatedData.service },
        data: {
          encryptedKey,
          lastFour,
        },
      });

      return NextResponse.json({
        message: "API key updated successfully",
        key: {
          id: updatedKey.id,
          service: updatedKey.service,
          maskedKey: `${"•".repeat(32)}${updatedKey.lastFour}`,
          lastFour: updatedKey.lastFour,
        },
      });
    } else {
      // Create new key
      const newKey = await prisma.apiKey.create({
        data: {
          service: validatedData.service,
          encryptedKey,
          lastFour,
          createdBy: "system", // TODO: Get from auth context
        },
      });

      return NextResponse.json({
        message: "API key saved successfully",
        key: {
          id: newKey.id,
          service: newKey.service,
          maskedKey: `${"•".repeat(32)}${newKey.lastFour}`,
          lastFour: newKey.lastFour,
        },
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error saving API key:", error);
    return NextResponse.json(
      { error: "Failed to save API key" },
      { status: 500 }
    );
  }
}
