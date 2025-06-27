import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { invoiceService } from "@/lib/services/invoice-service";

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoice = await invoiceService.generateInvoice(params.orderId);

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
