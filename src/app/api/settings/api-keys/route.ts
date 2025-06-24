import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

const apiKeySchema = z.object({
  service: z.enum(["anthropic", "openai"]),
  apiKey: z.string().min(1, "API key is required"),
});

// Simple encryption for API keys (in production, use a proper encryption service)
function encryptApiKey(apiKey: string): string {
  // In production, use proper encryption with a secure key management system
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(
    process.env.ENCRYPTION_KEY || "default-encryption-key",
    "salt",
    32
  );
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(apiKey, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

function decryptApiKey(encryptedData: string): string {
  try {
    const [ivHex, encrypted] = encryptedData.split(":");
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(
      process.env.ENCRYPTION_KEY || "default-encryption-key",
      "salt",
      32
    );
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Failed to decrypt API key:", error);
    return "";
  }
}

// GET /api/settings/api-keys - Get all API keys (masked)
export async function GET(request: NextRequest) {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      orderBy: { service: "asc" },
    });

    // Return masked API keys
    const maskedKeys = apiKeys.map((key) => ({
      id: key.id,
      service: key.service,
      lastFour: key.lastFour,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
    }));

    return NextResponse.json(maskedKeys);
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

    // Extract last 4 characters for display
    const lastFour = validatedData.apiKey.slice(-4);

    // Encrypt the API key
    const encryptedKey = encryptApiKey(validatedData.apiKey);

    // Check if key already exists for this service
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
        id: updatedKey.id,
        service: updatedKey.service,
        lastFour: updatedKey.lastFour,
        message: "API key updated successfully",
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

      return NextResponse.json(
        {
          id: newKey.id,
          service: newKey.service,
          lastFour: newKey.lastFour,
          message: "API key created successfully",
        },
        { status: 201 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid API key data", details: error.errors },
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

// DELETE /api/settings/api-keys/[service] - Delete an API key
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get("service");

    if (!service) {
      return NextResponse.json(
        { error: "Service parameter is required" },
        { status: 400 }
      );
    }

    await prisma.apiKey.delete({
      where: { service },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}
