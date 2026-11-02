import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role, ServiceCategory } from "@prisma/client";
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
    const { name, category, description, referencePrice, pointsMultiplier, isActive } = data;

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(category && { category: category as ServiceCategory }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(referencePrice !== undefined && { referencePrice: parseFloat(referencePrice) }),
        ...(pointsMultiplier !== undefined && { pointsMultiplier: parseFloat(pointsMultiplier) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await logAuditEvent({
      userId: auth.session.userId,
      action: "UPDATE_SERVICE",
      entity: "Service",
      entityId: id,
      details: data,
    });

    return NextResponse.json({ success: true, service: updated, message: "Servicio actualizado" });
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
    // Soft deactivate
    const service = await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    await logAuditEvent({
      userId: auth.session.userId,
      action: "DEACTIVATE_SERVICE",
      entity: "Service",
      entityId: id,
    });

    return NextResponse.json({ success: true, message: "Servicio desactivado" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

