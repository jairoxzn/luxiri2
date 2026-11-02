import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { logAuditEvent } from "@/lib/loyalty/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const onlyActive = searchParams.get("active") === "true";
  const category = searchParams.get("category");

  const where: any = {};
  if (onlyActive) where.isActive = true;
  if (category && category !== "ALL") where.category = category;

  const rewards = await prisma.reward.findMany({
    where,
    include: {
      minTier: true,
      _count: { select: { redemptions: true } },
    },
    orderBy: { pointsRequired: "asc" },
  });

  return NextResponse.json({ rewards });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN]);
  if (!auth.authorized) return auth.response;

  try {
    const data = await request.json();
    const {
      name,
      description,
      imageUrl,
      category = "Descuentos",
      pointsRequired,
      stock = 100,
      minTierId,
      terms,
    } = data;

    if (!name || !pointsRequired) {
      return NextResponse.json(
        { error: "Nombre y puntos requeridos son obligatorios" },
        { status: 400 }
      );
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const reward = await prisma.reward.create({
      data: {
        name: name.trim(),
        slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
        description: description?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        category: category.trim(),
        pointsRequired: parseInt(pointsRequired),
        stock: parseInt(stock),
        minTierId: minTierId || null,
        terms: terms?.trim() || null,
        isActive: true,
      },
      include: { minTier: true },
    });

    await logAuditEvent({
      userId: auth.session.userId,
      action: "CREATE_REWARD",
      entity: "Reward",
      entityId: reward.id,
      details: { name: reward.name, pointsRequired: reward.pointsRequired },
    });

    return NextResponse.json({
      success: true,
      reward,
      message: "Recompensa creada exitosamente",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

