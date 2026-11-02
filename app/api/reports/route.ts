import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN]);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "consumos";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const tierId = searchParams.get("tierId");
  const serviceId = searchParams.get("serviceId");

  try {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    if (type === "consumos") {
      const where: any = {};
      if (startDate || endDate) where.bookingDate = dateFilter;
      if (serviceId && serviceId !== "ALL") where.serviceId = serviceId;

      const items = await prisma.booking.findMany({
        where,
        include: {
          customer: { include: { tier: true } },
          service: true,
          operator: { select: { name: true } },
        },
        orderBy: { bookingDate: "desc" },
        take: 200,
      });

      return NextResponse.json({ items });
    }

    if (type === "clientes") {
      const where: any = {};
      if (startDate || endDate) where.registeredAt = dateFilter;
      if (tierId && tierId !== "ALL") where.tierId = tierId;

      const items = await prisma.customer.findMany({
        where,
        include: {
          tier: true,
          card: true,
          _count: { select: { bookings: true, redemptions: true } },
        },
        orderBy: { totalSpent: "desc" },
        take: 200,
      });

      return NextResponse.json({ items });
    }

    if (type === "puntos") {
      const where: any = {};
      if (startDate || endDate) where.createdAt = dateFilter;

      const items = await prisma.pointTransaction.findMany({
        where,
        include: {
          customer: { include: { tier: true } },
          operator: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      });

      return NextResponse.json({ items });
    }

    if (type === "canjes") {
      const where: any = {};
      if (startDate || endDate) where.requestedAt = dateFilter;

      const items = await prisma.redemption.findMany({
        where,
        include: {
          customer: { include: { tier: true } },
          reward: true,
          validatedByUser: { select: { name: true } },
        },
        orderBy: { requestedAt: "desc" },
        take: 200,
      });

      return NextResponse.json({ items });
    }

    return NextResponse.json({ items: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

