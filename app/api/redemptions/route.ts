import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role, RedemptionStatus } from "@prisma/client";
import { requestRewardRedemption } from "@/lib/loyalty/points-engine";
import { logAuditEvent } from "@/lib/loyalty/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN, Role.OPERATOR, Role.CUSTOMER]);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");
  const limit = parseInt(searchParams.get("limit") || "50");
  const page = parseInt(searchParams.get("page") || "1");
  const skip = (page - 1) * limit;

  const where: any = {};

  if (auth.session.role === Role.CUSTOMER) {
    where.customerId = auth.session.customerId;
  } else if (customerId) {
    where.customerId = customerId;
  }

  if (status && status !== "ALL") {
    where.status = status as RedemptionStatus;
  }

  const [total, redemptions] = await Promise.all([
    prisma.redemption.count({ where }),
    prisma.redemption.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            tier: true,
          },
        },
        reward: true,
        approvedByUser: { select: { id: true, name: true } },
        validatedByUser: { select: { id: true, name: true } },
      },
      orderBy: { requestedAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    redemptions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN, Role.CUSTOMER, Role.OPERATOR]);
  if (!auth.authorized) return auth.response;

  try {
    const { rewardId, customerId: targetCustomerId, notes } = await request.json();

    if (!rewardId) {
      return NextResponse.json({ error: "Recompensa no especificada" }, { status: 400 });
    }

    let effectiveCustomerId = targetCustomerId;
    if (auth.session.role === Role.CUSTOMER) {
      effectiveCustomerId = auth.session.customerId;
    }

    if (!effectiveCustomerId) {
      return NextResponse.json({ error: "Cliente no identificado" }, { status: 400 });
    }

    const result = await requestRewardRedemption(effectiveCustomerId, rewardId, notes);

    await logAuditEvent({
      userId: auth.session.userId,
      action: "REQUEST_REDEMPTION",
      entity: "Redemption",
      entityId: result.redemption.id,
      details: {
        code: result.redemption.code,
        reward: result.redemption.reward.name,
        points: result.redemption.pointsSpent,
      },
    });

    return NextResponse.json({
      success: true,
      redemption: result.redemption,
      newBalance: result.newBalance,
      message: `¡Canje generado con éxito! Código: ${result.redemption.code}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

