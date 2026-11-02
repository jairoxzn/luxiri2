import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { logAuditEvent } from "@/lib/loyalty/audit";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth([Role.ADMIN]);
  if (!auth.authorized) return auth.response;

  const { id } = params;

  try {
    const data = await request.json();
    const { name, description, promoType, multiplier, bonusPoints, startDate, endDate, terms, isActive } = data;

    const updated = await prisma.promotion.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(promoType && { promoType }),
        ...(multiplier !== undefined && { multiplier: parseFloat(multiplier) }),
        ...(bonusPoints !== undefined && { bonusPoints: parseInt(bonusPoints) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(terms !== undefined && { terms: terms?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await logAuditEvent({
      userId: auth.session.userId,
      action: "UPDATE_PROMOTION",
      entity: "Promotion",
      entityId: id,
      details: data,
    });

    return NextResponse.json({
      success: true,
      promotion: updated,
      message: "Promoción actualizada correctamente",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth([Role.ADMIN]);
  if (!auth.authorized) return auth.response;

  const { id } = params;

  try {
    await prisma.promotion.update({
      where: { id },
      data: { isActive: false },
    });

    await logAuditEvent({
      userId: auth.session.userId,
      action: "DEACTIVATE_PROMOTION",
      entity: "Promotion",
      entityId: id,
    });

    return NextResponse.json({ success: true, message: "Promoción desactivada" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

