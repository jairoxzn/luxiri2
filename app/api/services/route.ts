import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role, ServiceCategory } from "@prisma/client";
import { logAuditEvent } from "@/lib/loyalty/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const onlyActive = searchParams.get("active") === "true";

  const where: any = {};
  if (category && category !== "ALL") where.category = category as ServiceCategory;
  if (onlyActive) where.isActive = true;

  const services = await prisma.service.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { bookings: true } },
    },
  });

  return NextResponse.json({ services });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN]);
  if (!auth.authorized) return auth.response;

  try {
    const data = await request.json();
    const { name, category, description, referencePrice, pointsMultiplier = 1.0 } = data;

    if (!name || !category || !referencePrice) {
      return NextResponse.json({ error: "Nombre, categoría y precio son obligatorios" }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const service = await prisma.service.create({
      data: {
        name: name.trim(),
        slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
        category: category as ServiceCategory,
        description: description?.trim() || null,
        referencePrice: parseFloat(referencePrice),
        pointsMultiplier: parseFloat(pointsMultiplier),
        isActive: true,
      },
    });

    await logAuditEvent({
      userId: auth.session.userId,
      action: "CREATE_SERVICE",
      entity: "Service",
      entityId: service.id,
      details: { name: service.name, category: service.category },
    });

    return NextResponse.json({ success: true, service, message: "Servicio creado exitosamente" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

