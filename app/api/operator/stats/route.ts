import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role, RedemptionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth([Role.ADMIN, Role.OPERATOR]);
  if (!auth.authorized) return auth.response;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      servicesToday,
      activeRedemptions,
      recentBookings,
    ] = await Promise.all([
      prisma.booking.count({
        where: { bookingDate: { gte: today } },
      }),
      prisma.redemption.count({
        where: { status: { in: [RedemptionStatus.PENDIENTE, RedemptionStatus.APROBADO] } },
      }),
      prisma.booking.findMany({
        where: { bookingDate: { gte: today } },
        include: { customer: true, service: true },
        orderBy: { bookingDate: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      servicesToday,
      activeRedemptions,
      recentBookings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

