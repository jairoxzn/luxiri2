import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { logAuditEvent } from "@/lib/loyalty/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const onlyActive = searchParams.get("active") === "true";

  const where: any = {};
  if (onlyActive) where.isActive = true;

  const promotions = await prisma.promotion.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ promotions });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN]);
  if (!auth.authorized) return auth.response;

  try {
    const data = await request.json();
    const {
      name,
      description,
      promoType = "DOUBLE_POINTS",
      multiplier = 2.0,
      bonusPoints = 0,
      startDate,
      endDate,
      terms,
    } = data;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Nombre, fecha inicial y fecha final son requeridos" },
        { status: 400 }
      );
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const promotion = await prisma.promotion.create({
      data: {
        name: name.trim(),
        slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
        description: description?.trim() || null,
        promoType,
        multiplier: parseFloat(multiplier),
        bonusPoints: parseInt(bonusPoints),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        terms: terms?.trim() || null,
        isActive: true,
      },
    });

    await logAuditEvent({
      userId: auth.session.userId,
      action: "CREATE_PROMOTION",
      entity: "Promotion",
      entityId: promotion.id,
      details: { name: promotion.name, promoType: promotion.promoType },
    });

    return NextResponse.json({
      success: true,
      promotion,
      message: "Promoción creada exitosamente",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

