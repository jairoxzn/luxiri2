import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role, CustomerStatus, RedemptionStatus, PointTransactionType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth([Role.ADMIN]);
  if (!auth.authorized) return auth.response;

  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      totalCustomers,
      activeCustomers,
      newCustomersThisMonth,
      totalBookings,
      totalSalesAgg,
      pointsIssuedAgg,
      pointsRedeemedAgg,
      pendingRedemptions,
      tiers,
      recentCustomers,
      recentBookings,
      recentRedemptions,
      services,
      monthlyBookings,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: CustomerStatus.ACTIVE } }),
      prisma.customer.count({ where: { registeredAt: { gte: startOfMonth } } }),
      prisma.booking.count(),
      prisma.booking.aggregate({
        _sum: { amount: true },
        where: { paymentStatus: "PAGADO" },
      }),
      prisma.pointTransaction.aggregate({
        _sum: { points: true },
        where: { type: PointTransactionType.EARNED },
      }),
      prisma.pointTransaction.aggregate({
        _sum: { points: true },
        where: { type: PointTransactionType.REDEEMED },
      }),
      prisma.redemption.count({ where: { status: RedemptionStatus.PENDIENTE } }),
      prisma.loyaltyTier.findMany({
        include: { _count: { select: { customers: true } } },
        orderBy: { orderIndex: "asc" },
      }),
      prisma.customer.findMany({
        take: 5,
        orderBy: { registeredAt: "desc" },
        include: { tier: true },
      }),
      prisma.booking.findMany({
        take: 5,
        orderBy: { bookingDate: "desc" },
        include: { customer: true, service: true },
      }),
      prisma.redemption.findMany({
        take: 5,
        orderBy: { requestedAt: "desc" },
        include: { customer: true, reward: true },
      }),
      prisma.service.findMany({
        include: {
          _count: { select: { bookings: true } },
          bookings: { select: { amount: true } },
        },
        take: 6,
      }),
      // Monthly bookings for the past 6 months
      prisma.booking.findMany({
        select: {
          bookingDate: true,
          amount: true,
          pointsEarned: true,
        },
        orderBy: { bookingDate: "asc" },
        take: 300,
      }),
    ]);

    // Process tier distribution for charts
    const tierDistribution = tiers.map((t) => ({
      name: t.name,
      value: t._count.customers,
      color: t.color,
    }));

    // Process top services
    const topServices = services
      .map((s) => ({
        name: s.name.length > 25 ? s.name.slice(0, 25) + "..." : s.name,
        fullName: s.name,
        bookingsCount: s._count.bookings,
        revenue: s.bookings.reduce((acc, curr) => acc + Number(curr.amount), 0),
      }))
      .sort((a, b) => b.bookingsCount - a.bookingsCount)
      .slice(0, 5);

    // Group bookings by month
    const monthsMap: { [key: string]: { month: string; ventas: number; puntos: number; servicios: number } } = {};
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

    monthlyBookings.forEach((b) => {
      const d = new Date(b.bookingDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      if (!monthsMap[key]) {
        monthsMap[key] = { month: key, ventas: 0, puntos: 0, servicios: 0 };
      }
      monthsMap[key].ventas += Number(b.amount);
      monthsMap[key].puntos += b.pointsEarned;
      monthsMap[key].servicios += 1;
    });

    const monthlyTrends = Object.values(monthsMap);

    return NextResponse.json({
      kpis: {
        totalCustomers,
        activeCustomers,
        newCustomersThisMonth,
        totalBookings,
        totalRevenue: Number(totalSalesAgg._sum.amount || 0),
        pointsIssued: Number(pointsIssuedAgg._sum.points || 0),
        pointsRedeemed: Math.abs(Number(pointsRedeemedAgg._sum.points || 0)),
        pendingRedemptions,
      },
      charts: {
        tierDistribution,
        topServices,
        monthlyTrends,
      },
      recent: {
        customers: recentCustomers,
        bookings: recentBookings,
        redemptions: recentRedemptions,
      },
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

