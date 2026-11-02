import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role, PointTransactionType } from "@prisma/client";
import { logAuditEvent } from "@/lib/loyalty/audit";

export async function GET(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN, Role.OPERATOR, Role.CUSTOMER]);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");
  const type = searchParams.get("type");
  const limit = parseInt(searchParams.get("limit") || "50");
  const page = parseInt(searchParams.get("page") || "1");
  const skip = (page - 1) * limit;

  const where: any = {};

  if (auth.session.role === Role.CUSTOMER) {
    where.customerId = auth.session.customerId;
  } else if (customerId) {
    where.customerId = customerId;
  }

  if (type && type !== "ALL") {
    where.type = type as PointTransactionType;
  }

  const [total, transactions] = await Promise.all([
    prisma.pointTransaction.count({ where }),
    prisma.pointTransaction.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            currentPoints: true,
            tier: { select: { name: true, color: true } },
          },
        },
        operator: {
          select: { id: true, name: true },
        },
        booking: {
          select: { id: true, code: true, amount: true },
        },
        redemption: {
          select: { id: true, code: true, reward: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    transactions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN]);
  if (!auth.authorized) return auth.response;

  try {
    const { customerId, points, concept, notes } = await request.json();

    if (!customerId || points === undefined || !concept) {
      return NextResponse.json(
        { error: "Cliente, cantidad de puntos y concepto son obligatorios" },
        { status: 400 }
      );
    }

    const numPoints = parseInt(points);
    if (isNaN(numPoints) || numPoints === 0) {
      return NextResponse.json({ error: "Los puntos deben ser un número distinto de 0" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) throw new Error("Cliente no encontrado");

      const newBalance = customer.currentPoints + numPoints;
      if (newBalance < 0) {
        throw new Error(`Operación inválida: el saldo no puede ser negativo (Saldo actual: ${customer.currentPoints})`);
      }

      const lifetimeDelta = numPoints > 0 ? numPoints : 0;

      // Update customer
      await tx.customer.update({
        where: { id: customerId },
        data: {
          currentPoints: newBalance,
          lifetimePoints: customer.lifetimePoints + lifetimeDelta,
        },
      });

      // Record in ledger
      const transaction = await tx.pointTransaction.create({
        data: {
          customerId,
          type: PointTransactionType.ADJUSTMENT,
          points: numPoints,
          balanceAfter: newBalance,
          concept: `Ajuste administrativo: ${concept}`,
          notes: notes?.trim() || null,
          operatorId: auth.session.userId,
          referenceCode: `ADJ-${Date.now().toString().slice(-6)}`,
        },
      });

      return { transaction, newBalance };
    });

    await logAuditEvent({
      userId: auth.session.userId,
      action: "POINTS_ADJUSTMENT",
      entity: "PointTransaction",
      entityId: result.transaction.id,
      details: { customerId, points: numPoints, concept, newBalance: result.newBalance },
    });

    return NextResponse.json({
      success: true,
      transaction: result.transaction,
      newBalance: result.newBalance,
      message: `Ajuste de ${numPoints > 0 ? "+" : ""}${numPoints} puntos aplicado exitosamente`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

