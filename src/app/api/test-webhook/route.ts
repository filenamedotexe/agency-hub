import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// POST /api/test-webhook - Test a webhook endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookUrl, payload, headers = {} } = body;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "Webhook URL is required" },
        { status: 400 }
      );
    }

    // Send test request to webhook
    // Note: n8n webhooks in test mode wait for GET to establish connection,
    // but we're sending POST with data as that's what the actual webhook expects
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log("Webhook test response:", {
      url: webhookUrl,
      status: response.status,
      statusText: response.statusText,
      responseData,
    });

    return NextResponse.json({
      success: response.ok,
      statusCode: response.status,
      statusText: response.statusText,
      response: responseData,
      webhookUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error testing webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to test webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
