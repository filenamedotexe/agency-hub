import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptApiKey, getLastFourChars } from "@/lib/encryption";

// DELETE /api/settings/api-keys/[id] - Delete an API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.apiKey.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "API key deleted successfully" });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}

// PUT /api/settings/api-keys/[id] - Update an API key
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    const encryptedKey = encryptApiKey(apiKey);
    const lastFour = getLastFourChars(apiKey);

    const updatedKey = await prisma.apiKey.update({
      where: { id: params.id },
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
  } catch (error) {
    console.error("Error updating API key:", error);
    return NextResponse.json(
      { error: "Failed to update API key" },
      { status: 500 }
    );
  }
}
