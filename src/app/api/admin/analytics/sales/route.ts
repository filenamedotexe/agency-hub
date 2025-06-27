import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, endOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    // Get orders in date range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            serviceTemplate: true,
          },
        },
      },
    });

    // Calculate metrics
    const totalRevenue = orders
      .filter((o) => o.paymentStatus === "SUCCEEDED")
      .reduce((sum, order) => sum + Number(order.total), 0);

    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get previous period for comparison
    const prevStartDate = startOfDay(subDays(new Date(), days * 2));
    const prevEndDate = startOfDay(subDays(new Date(), days));

    const prevOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
        paymentStatus: "SUCCEEDED",
      },
    });

    const prevRevenue = prevOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    );
    const revenueChange =
      prevRevenue > 0
        ? (((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)
        : 0;

    // New customers
    const newCustomers = await prisma.client.count({
      where: {
        firstOrderDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Refunds
    const refundedOrders = orders.filter((o) => o.status === "REFUNDED");
    const refundAmount = refundedOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    );
    const refundRate =
      totalOrders > 0 ? (refundedOrders.length / totalOrders) * 100 : 0;

    // Revenue chart data
    const revenueChart = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dayOrders = orders.filter(
        (o) =>
          startOfDay(new Date(o.createdAt)).getTime() === date.getTime() &&
          o.paymentStatus === "SUCCEEDED"
      );

      revenueChart.push({
        date: date.toISOString(),
        revenue: dayOrders.reduce((sum, order) => sum + Number(order.total), 0),
        orders: dayOrders.length,
      });
    }

    // Top services
    const serviceRevenue = new Map();
    orders
      .filter((o) => o.paymentStatus === "SUCCEEDED")
      .forEach((order) => {
        order.items.forEach((item) => {
          const serviceName = item.serviceName;
          const current = serviceRevenue.get(serviceName) || 0;
          serviceRevenue.set(serviceName, current + Number(item.total));
        });
      });

    const topServices = Array.from(serviceRevenue.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Service distribution
    const serviceDistribution = Array.from(serviceRevenue.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Conversion funnel (mock data for now)
    const conversionFunnel = {
      storeVisits: totalOrders * 10, // Mock: assume 10% conversion
      addToCart: totalOrders * 5,
      checkoutStarted: totalOrders * 2,
      ordersCompleted: totalOrders,
      cartRate: 50,
      checkoutRate: 20,
      conversionRate: 10,
    };

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      avgOrderValue,
      revenueChange: Number(revenueChange),
      newCustomers,
      refundAmount,
      refundRate,
      revenueChart,
      topServices,
      serviceDistribution,
      conversionFunnel,
    });
  } catch (error) {
    console.error("Error fetching sales metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales metrics" },
      { status: 500 }
    );
  }
}
