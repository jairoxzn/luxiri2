import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { logAuditEvent } from "@/lib/loyalty/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const rule = await prisma.loyaltyRule.findFirst({
    where: { isActive: true },
  });

  return NextResponse.json({ rule });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN]);
  if (!auth.authorized) return auth.response;

  try {
    const data = await request.json();
    const { spendPerPoint, minSpend, pointsExpiryMonths, name } = data;

    const existingRule = await prisma.loyaltyRule.findFirst({
      where: { isActive: true },
    });

    if (!existingRule) {
      return NextResponse.json({ error: "Regla no encontrada" }, { status: 404 });
    }

    const updated = await prisma.loyaltyRule.update({
      where: { id: existingRule.id },
      data: {
        ...(spendPerPoint !== undefined && { spendPerPoint: parseFloat(spendPerPoint) }),
        ...(minSpend !== undefined && { minSpend: parseFloat(minSpend) }),
        ...(pointsExpiryMonths !== undefined && { pointsExpiryMonths: parseInt(pointsExpiryMonths) }),
        ...(name && { name: name.trim() }),
      },
    });

    await logAuditEvent({
      userId: auth.session.userId,
      action: "UPDATE_LOYALTY_RULE",
      entity: "LoyaltyRule",
      entityId: updated.id,
      details: data,
    });

    return NextResponse.json({
      success: true,
      rule: updated,
      message: "Reglas de acumulación actualizadas correctamente",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

