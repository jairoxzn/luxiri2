import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { logAuditEvent } from "@/lib/loyalty/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const tiers = await prisma.loyaltyTier.findMany({
    orderBy: { orderIndex: "asc" },
    include: {
      _count: {
        select: { customers: true },
      },
    },
  });

  return NextResponse.json({ tiers });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN]);
  if (!auth.authorized) return auth.response;

  try {
    const data = await request.json();
    const { id, minSpend, pointsMultiplier, discountPercent, description, perks } = data;

    if (!id) {
      return NextResponse.json({ error: "ID del nivel requerido" }, { status: 400 });
    }

    const updated = await prisma.loyaltyTier.update({
      where: { id },
      data: {
        ...(minSpend !== undefined && { minSpend: parseFloat(minSpend) }),
        ...(pointsMultiplier !== undefined && { pointsMultiplier: parseFloat(pointsMultiplier) }),
        ...(discountPercent !== undefined && { discountPercent: parseFloat(discountPercent) }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(perks !== undefined && { perks: typeof perks === "string" ? perks : JSON.stringify(perks) }),
      },
    });

    await logAuditEvent({
      userId: auth.session.userId,
      action: "UPDATE_TIER",
      entity: "LoyaltyTier",
      entityId: id,
      details: data,
    });

    return NextResponse.json({
      success: true,
      tier: updated,
      message: `Nivel VIP ${updated.name} actualizado exitosamente`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

