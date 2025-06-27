import { prisma } from "@/lib/prisma";

export class InvoiceService {
  async generateInvoice(orderId: string) {
    // Get order with all details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        items: true,
        invoice: true,
      },
    });

    if (!order) throw new Error("Order not found");
    if (order.invoice) return order.invoice; // Already generated

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { number: "desc" },
    });

    const invoiceNumber = this.generateInvoiceNumber(lastInvoice?.number);

    // For now, we'll create a simple invoice record
    // In production, you'd generate a PDF here and upload it to storage
    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        orderId: orderId,
        pdfUrl: `/api/invoices/${invoiceNumber}/pdf`, // Placeholder URL
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return invoice;
  }

  private generateInvoiceNumber(lastNumber?: string): string {
    const prefix = process.env.INVOICE_PREFIX || "INV";
    const year = new Date().getFullYear();

    if (!lastNumber) {
      const startingNumber = process.env.INVOICE_STARTING_NUMBER || "1000";
      return `${prefix}-${year}-${startingNumber}`;
    }

    const parts = lastNumber.split("-");
    const lastYear = parseInt(parts[1]);
    const lastSequence = parseInt(parts[2]);

    if (lastYear < year) {
      return `${prefix}-${year}-${process.env.INVOICE_STARTING_NUMBER || "1000"}`;
    }

    return `${prefix}-${year}-${(lastSequence + 1).toString().padStart(4, "0")}`;
  }

  async sendInvoice(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        order: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!invoice) throw new Error("Invoice not found");

    // In production, you'd send an email here
    // For now, just update the sent timestamp
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { sentAt: new Date() },
    });
  }
}

export const invoiceService = new InvoiceService();
