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
    const {
      name,
      description,
      imageUrl,
      category,
      pointsRequired,
      stock,
      minTierId,
      terms,
      isActive,
    } = data;

    const updated = await prisma.reward.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
        ...(category && { category: category.trim() }),
        ...(pointsRequired !== undefined && { pointsRequired: parseInt(pointsRequired) }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(minTierId !== undefined && { minTierId: minTierId || null }),
        ...(terms !== undefined && { terms: terms?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { minTier: true },
    });

    await logAuditEvent({
      userId: auth.session.userId,
      action: "UPDATE_REWARD",
      entity: "Reward",
      entityId: id,
      details: data,
    });

    return NextResponse.json({
      success: true,
      reward: updated,
      message: "Recompensa actualizada correctamente",
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
    const reward = await prisma.reward.update({
      where: { id },
      data: { isActive: false },
    });

    await logAuditEvent({
      userId: auth.session.userId,
      action: "DEACTIVATE_REWARD",
      entity: "Reward",
      entityId: id,
    });

    return NextResponse.json({ success: true, message: "Recompensa desactivada" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

